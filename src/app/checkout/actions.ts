
'use server'

import { db } from '@/lib/firebase'
import { collection, getDocs, writeBatch, addDoc, serverTimestamp, doc, getDoc, query, where, limit, increment, updateDoc, documentId } from 'firebase/firestore'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { z } from 'zod'
import { getShippingCharge as getChargeFromSettings } from '@/lib/settings'
import { revalidatePath } from 'next/cache'

export async function generateQrCode(amount: number) {
  const upiId = process.env.ADMIN_UPI_ID
  const upiName = process.env.ADMIN_UPI_NAME

  if (!upiId || !upiName) {
    console.error("UPI ID or Name is not configured in environment variables.")
    return { qrCodeUrl: null, error: 'Payment system is not configured. Please contact support.' }
  }
  
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount.toFixed(2)}&cu=INR&tr=${Date.now()}`

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(upiString)
    return { qrCodeUrl: qrCodeDataUrl, error: null }
  } catch (error) {
    console.error('Error generating QR code:', error)
    return { qrCodeUrl: null, error: 'Could not generate QR code.' }
  }
}

const calculateDeliverySchedule = (plan: 'weekly' | 'monthly', startDate: Date): { date: string, status: 'pending' | 'delivered' }[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate); 
    currentDate.setDate(currentDate.getDate() + 1);

    const deliveryCount = plan === 'weekly' ? 5 : 22;

    while (dates.length < deliveryCount) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates.map(d => ({
        date: d.toISOString().split('T')[0],
        status: 'pending'
    }));
};

async function findAvailableAgentForArea(city: string): Promise<any | null> {
    const areasRef = collection(db, 'serviceableAreas');
    const areaQuery = query(areasRef, where('name', '==', city), limit(1));
    const areaSnapshot = await getDocs(areaQuery);

    if (areaSnapshot.empty) {
        return null; // Area not serviceable
    }

    const areaDoc = areaSnapshot.docs[0].data();
    const assignedAgentIds = areaDoc.assignedAgentIds || [];

    if (assignedAgentIds.length === 0) {
        return null; // No agents assigned to this area
    }
    
    // This query is more robust as it does not require a composite index.
    const agentsQuery = query(
        collection(db, 'deliveryAgents'), 
        where(documentId(), 'in', assignedAgentIds)
    );
    const agentsSnapshot = await getDocs(agentsQuery);

    if (agentsSnapshot.empty) {
        return null; // No agents found for the given IDs
    }

    const agentsData = agentsSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    
    // Filter by status and capacity client-side for robustness
    const eligibleAgents = agentsData.filter((agent:any) => {
        const isActive = agent.status === 'approved';
        // Give a default capacity if not set, to avoid issues with older documents.
        const hasCapacity = (agent.activeOrderCount ?? 0) < (agent.maxDeliveries ?? 10);
        return isActive && hasCapacity;
    });

    if (eligibleAgents.length > 0) {
        // Sort by who has the fewest active orders to balance the load
        eligibleAgents.sort((a, b) => (a.activeOrderCount ?? 0) - (b.activeOrderCount ?? 0));
        return eligibleAgents[0]; // Return the agent with the least work
    }

    return null; // All assigned agents are at capacity or not approved
}

export async function createOrder(userId: string, deliveryInfo: any) {
    if (!userId) {
        throw new Error('User not authenticated.')
    }
    const orderRef = doc(collection(db, 'orders')); // Pre-generate order ID
    let orderId = orderRef.id

    try {
        const cartRef = collection(db, 'carts', userId, 'items')
        const cartSnapshot = await getDocs(cartRef)

        if (cartSnapshot.empty) {
            throw new Error('Your cart is empty.')
        }

        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        
        let userName = 'Guest User', userEmail = '', userPhone = '';

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userName = `${userData.firstName} ${userData.lastName}`;
            userEmail = userData.email;
            userPhone = userData.phone;
        }

        const cartItems = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const subtotal = cartItems.reduce((acc, item: any) => acc + item.price * item.quantity, 0)
        const shipping = cartItems.length > 0 ? await getChargeFromSettings() : 0;
        const total = subtotal + shipping

        const orderData: any = {
            userId,
            userName,
            userEmail,
            userPhone,
            deliveryInfo,
            items: cartItems,
            subtotal,
            shipping,
            total,
            status: 'Pending',
            createdAt: serverTimestamp(),
            deliverySchedule: null,
            assignedAgentId: null,
            assignedAgentName: null,
        }

        const chosenAgent = await findAvailableAgentForArea(deliveryInfo.city);
        const batch = writeBatch(db)

        if (chosenAgent) {
            orderData.assignedAgentId = chosenAgent.uid;
            orderData.assignedAgentName = `${chosenAgent.firstName} ${chosenAgent.lastName}`;
            const plan = cartItems.some((item: any) => item.plan === 'monthly') ? 'monthly' : 'weekly';
            orderData.deliverySchedule = calculateDeliverySchedule(plan, new Date());

            const agentRef = doc(db, 'deliveryAgents', chosenAgent.uid);
            batch.update(agentRef, { activeOrderCount: increment(1) });
        }
        
        batch.set(orderRef, orderData)
        
        cartSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })
        
        await batch.commit()

    } catch (error: any) {
        console.error('Error creating order:', error)
        throw new Error(error.message || 'There was an error creating your order.')
    }

    redirect(`/order/confirmation?orderId=${orderId}`)
}

export async function processUnassignedOrders(): Promise<{ success: boolean; assignedCount?: number, error?: string }> {
    try {
        const unassignedOrdersQuery = query(
            collection(db, 'orders'),
            where('assignedAgentId', '==', null),
            where('status', '==', 'Pending')
        );
        const unassignedOrdersSnapshot = await getDocs(unassignedOrdersQuery);

        if (unassignedOrdersSnapshot.empty) {
            return { success: true, assignedCount: 0 };
        }

        let assignedCount = 0;
        const batch = writeBatch(db);

        for (const orderDoc of unassignedOrdersSnapshot.docs) {
            const orderData = orderDoc.data();
            const chosenAgent = await findAvailableAgentForArea(orderData.deliveryInfo.city);

            if (chosenAgent) {
                const orderRef = doc(db, 'orders', orderDoc.id);
                const agentRef = doc(db, 'deliveryAgents', chosenAgent.uid);

                const plan = orderData.items.some((item: any) => item.plan === 'monthly') ? 'monthly' : 'weekly';
                const deliverySchedule = calculateDeliverySchedule(plan, new Date());

                batch.update(orderRef, {
                    assignedAgentId: chosenAgent.uid,
                    assignedAgentName: `${chosenAgent.firstName} ${chosenAgent.lastName}`,
                    deliverySchedule: deliverySchedule,
                });

                batch.update(agentRef, { activeOrderCount: increment(1) });
                assignedCount++;
            }
        }
        
        if (assignedCount > 0) {
            await batch.commit();
            console.log(`Successfully assigned ${assignedCount} orders.`);
            revalidatePath('/admin/dashboard');
            revalidatePath('/delivery/dashboard');
        } else {
            console.log("Found unassigned orders, but no available agents.");
        }

        return { success: true, assignedCount: assignedCount };
    } catch (error) {
        console.error("Error processing unassigned orders:", error);
        return { success: false, error: 'Failed to process unassigned orders.' };
    }
}


export async function getShippingCharge() {
    return await getChargeFromSettings();
}

export async function getServiceableAreas() {
    try {
        const areasRef = collection(db, 'serviceableAreas');
        const q = query(areasRef, where('state', '!=', null));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                pincode: data.pincode,
                state: data.state,
            };
        }) as {id: string, name: string, pincode: string, state: string}[];
    } catch (error) {
        console.error("Error fetching serviceable areas:", error);
        return [];
    }
}

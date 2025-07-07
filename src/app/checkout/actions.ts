'use server'

import { db } from '@/lib/firebase'
import { collection, getDocs, writeBatch, addDoc, serverTimestamp, doc, getDoc, query, where, limit, increment } from 'firebase/firestore'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { z } from 'zod'
import { getShippingCharge as getChargeFromSettings } from '@/lib/settings'

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

const calculateDeliveryDates = (plan: 'weekly' | 'monthly', startDate: Date): string[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate); 
    currentDate.setDate(currentDate.getDate() + 1);

    const deliveryCount = plan === 'weekly' ? 5 : 22;

    while (dates.length < deliveryCount) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates.map(d => d.toISOString().split('T')[0]);
};


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
            deliveryDates: null,
            assignedAgentId: null,
            assignedAgentName: null,
        }

        // --- Agent Assignment Logic ---
        const areasRef = collection(db, 'serviceableAreas');
        const areaQuery = query(areasRef, where('name', '==', deliveryInfo.city), limit(1));
        const areaSnapshot = await getDocs(areaQuery);
        
        let chosenAgent: any = null;

        if (!areaSnapshot.empty) {
            const areaDoc = areaSnapshot.docs[0].data();
            const assignedAgentIds = areaDoc.assignedAgentIds || [];

            if (assignedAgentIds.length > 0) {
                const agentsQuery = query(collection(db, 'deliveryAgents'), where('uid', 'in', assignedAgentIds));
                const agentsSnapshot = await getDocs(agentsQuery);
                const agentsData = agentsSnapshot.docs.map(d => d.data());

                const eligibleAgents = agentsData.filter(agent => agent.activeOrderCount < agent.maxDeliveries && agent.status === 'approved');

                if (eligibleAgents.length > 0) {
                    eligibleAgents.sort((a, b) => a.activeOrderCount - b.activeOrderCount);
                    chosenAgent = eligibleAgents[0];
                }
            }
        }
        
        // If an agent is found, update order data
        if (chosenAgent) {
            orderData.assignedAgentId = chosenAgent.uid;
            orderData.assignedAgentName = `${chosenAgent.firstName} ${chosenAgent.lastName}`;
            const plan = cartItems.some((item: any) => item.plan === 'monthly') ? 'monthly' : 'weekly';
            orderData.deliveryDates = calculateDeliveryDates(plan, new Date());
        }
        // --- End Agent Assignment Logic ---

        const batch = writeBatch(db)

        // 1. Create the order
        batch.set(orderRef, orderData)
        
        // 2. If an agent was assigned, increment their active order count
        if (chosenAgent) {
            const agentRef = doc(db, 'deliveryAgents', chosenAgent.uid);
            batch.update(agentRef, { activeOrderCount: increment(1) });
        }

        // 3. Clear the user's cart
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

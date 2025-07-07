
'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, writeBatch, getDoc, increment } from 'firebase/firestore'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

export type DailyDelivery = {
    orderId: string;
    customerName: string;
    customerAddress: string;
    deliveryTime: string;
    status: 'pending' | 'delivered';
};

export async function getDailyRoute(agentId: string): Promise<DailyDelivery[]> {
    if (!agentId) return [];
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const deliveries: DailyDelivery[] = [];
    
    const ordersRef = collection(db, 'orders');
    // We get all active orders for the agent and filter for today's deliveries in code,
    // as Firestore doesn't support querying inside an array of objects efficiently without complex indexes.
    const q = query(ordersRef, where('assignedAgentId', '==', agentId), where('status', 'in', ['Pending', 'Out for Delivery']));
    
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(doc => {
        const order = doc.data();
        if (order.deliverySchedule && Array.isArray(order.deliverySchedule)) {
            const todayDelivery = order.deliverySchedule.find(d => d.date === today);
            if (todayDelivery) {
                deliveries.push({
                    orderId: doc.id,
                    customerName: order.userName,
                    customerAddress: `${order.deliveryInfo.address}, ${order.deliveryInfo.city}, ${order.deliveryInfo.state} - ${order.deliveryInfo.zip}`,
                    deliveryTime: order.deliveryInfo.deliveryTime,
                    status: todayDelivery.status,
                });
            }
        }
    });

    return deliveries;
}

export async function markDeliveriesAsComplete(deliveriesToUpdate: { orderId: string }[]) {
    if (!deliveriesToUpdate || deliveriesToUpdate.length === 0) {
        return { success: false, error: 'No deliveries selected.' };
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const batch = writeBatch(db);

    try {
        for (const delivery of deliveriesToUpdate) {
            const orderRef = doc(db, 'orders', delivery.orderId);
            const orderSnap = await getDoc(orderRef);
            
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const schedule = orderData.deliverySchedule || [];
                
                let allDelivered = true;
                const updatedSchedule = schedule.map(d => {
                    let updatedDelivery = { ...d };
                    if (d.date === today) {
                        updatedDelivery.status = 'delivered';
                    }
                    if (updatedDelivery.status === 'pending') {
                         allDelivered = false;
                    }
                    return updatedDelivery;
                });

                batch.update(orderRef, { deliverySchedule: updatedSchedule });

                if (allDelivered) {
                    batch.update(orderRef, { status: 'Delivered' });
                    // Decrement agent's active order count only when the whole order is finished.
                    if (orderData.assignedAgentId) {
                        const agentRef = doc(db, 'deliveryAgents', orderData.assignedAgentId);
                        batch.update(agentRef, { activeOrderCount: increment(-1) });
                    }
                }
            }
        }
        
        await batch.commit();
        revalidatePath('/delivery/daily-route');
        revalidatePath('/delivery-schedule'); // for customer calendar
        revalidatePath('/admin/dashboard'); // for admin dashboard status
        return { success: true, error: null };

    } catch (error: any) {
        console.error("Error marking deliveries as complete:", error);
        return { success: false, error: 'Failed to update deliveries.' };
    }
}

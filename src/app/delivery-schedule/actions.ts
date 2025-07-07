
'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export type Delivery = {
    date: string;
    status: 'pending' | 'delivered';
}

export async function getDeliverySchedule(userId: string): Promise<Delivery[]> {
    if (!userId) {
        return [];
    }

    const ordersRef = collection(db, 'orders');
    // Fetch the last 5 orders to find the most recent one with an active schedule
    const q = query(
        ordersRef, 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc'),
        limit(5) 
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }
    
    // Find the most recent order that has a schedule that is still active
    for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.deliverySchedule && Array.isArray(data.deliverySchedule) && data.deliverySchedule.length > 0) {
            // Check if the last delivery date in the schedule is in the future
            const lastDelivery = data.deliverySchedule[data.deliverySchedule.length - 1];
            const [year, month, day] = lastDelivery.date.split('-').map(Number);
            // Use UTC to avoid timezone issues with date comparisons
            const lastDate = new Date(Date.UTC(year, month - 1, day));
            const today = new Date();
            const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            if (lastDate >= todayUTC) {
                 return data.deliverySchedule as Delivery[]; // Return the schedule of the first active order found
            }
        }
    }

    return []; // No active schedule found
}

'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export async function getUpcomingDeliveryDates(userId: string): Promise<string[]> {
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
        if (data.deliveryDates && Array.isArray(data.deliveryDates) && data.deliveryDates.length > 0) {
            // Check if the last delivery date in the schedule is in the future
            const lastDateStr = data.deliveryDates[data.deliveryDates.length - 1];
            const [year, month, day] = lastDateStr.split('-').map(Number);
            const lastDate = new Date(year, month - 1, day);

            if (lastDate >= new Date()) {
                 return data.deliveryDates; // Return the schedule of the first active order found
            }
        }
    }

    return []; // No active schedule found
}

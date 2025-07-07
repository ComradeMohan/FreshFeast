
'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { format } from 'date-fns'

export type Order = {
    id: string;
    status: string;
    total: number;
    createdAt: string; // Will be a formatted string
    items: any[];
    assignedAgentName?: string;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    if (!userId) {
        return [];
    }

    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const orders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                status: data.status,
                total: data.total,
                // Firestore timestamp to serializable string
                createdAt: data.createdAt ? format(data.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A',
                items: data.items,
                assignedAgentName: data.assignedAgentName || null,
            } as Order;
        });

        return orders;
    } catch (error) {
        console.error("Error fetching user orders:", error);
        // In a real app, you might throw an error or return an error object
        return [];
    }
}

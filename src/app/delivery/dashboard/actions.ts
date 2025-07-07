'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

export type AssignedOrder = {
    id: string;
    userName: string;
    status: string;
    total: number;
    createdAt: string;
    deliveryInfo: {
        address: string;
        city: string;
        state: string;
        zip: string;
        deliveryTime: string;
    };
    items: any[];
}

export async function getAssignedOrders(agentId: string): Promise<AssignedOrder[]> {
    if (!agentId) {
        return [];
    }

    try {
        // 1. Find areas assigned to the agent
        const areasRef = collection(db, 'serviceableAreas');
        const areasQuery = query(areasRef, where('assignedAgentId', '==', agentId));
        const areasSnapshot = await getDocs(areasQuery);
        
        if (areasSnapshot.empty) {
            return []; // No areas assigned to this agent
        }
        const assignedAreaNames = areasSnapshot.docs.map(doc => doc.data().name);

        // 2. Find orders for those areas that are not yet delivered
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
            ordersRef, 
            where('deliveryInfo.city', 'in', assignedAreaNames),
            where('status', 'in', ['Pending', 'Out for Delivery']),
            orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        const orders = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userName: data.userName,
                status: data.status,
                total: data.total,
                createdAt: data.createdAt ? format(data.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A',
                items: data.items,
                deliveryInfo: data.deliveryInfo,
            } as AssignedOrder;
        });

        return orders;
    } catch (error) {
        console.error("Error fetching assigned orders:", error);
        return [];
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    if (!orderId || !status) {
        return { success: false, error: 'Order ID or status is missing.' };
    }

    try {
        const orderDocRef = doc(db, 'orders', orderId);
        await updateDoc(orderDocRef, { status });
        revalidatePath('/delivery/dashboard');
        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { success: false, error: 'Failed to update order status.' };
    }
}

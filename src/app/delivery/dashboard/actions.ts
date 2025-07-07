'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, doc, updateDoc, writeBatch, getDoc, increment } from 'firebase/firestore'
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
        const ordersRef = collection(db, 'orders');
        // A simpler query that only requires a single-field index on assignedAgentId,
        // which Firestore creates automatically. This avoids complex index errors.
        const ordersQuery = query(
            ordersRef, 
            where('assignedAgentId', '==', agentId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        const allAgentOrders = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userName: data.userName,
                status: data.status,
                total: data.total,
                createdAtTimestamp: data.createdAt, // Keep original timestamp for sorting
                createdAt: data.createdAt ? format(data.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A',
                items: data.items,
                deliveryInfo: data.deliveryInfo,
            };
        });

        // Filter for active orders and sort them in code.
        const activeOrders = allAgentOrders
            .filter(order => order.status === 'Pending' || order.status === 'Out for Delivery')
            .sort((a, b) => {
                if (!a.createdAtTimestamp || !b.createdAtTimestamp) return 0;
                return b.createdAtTimestamp.toMillis() - a.createdAtTimestamp.toMillis();
            });

        return activeOrders as AssignedOrder[];
    } catch (error) {
        console.error("Error fetching assigned orders:", error);
        return [];
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    if (!orderId || !status) {
        return { success: false, error: 'Order ID or status is missing.' };
    }

    const orderDocRef = doc(db, 'orders', orderId);

    try {
        const orderSnap = await getDoc(orderDocRef);
        if (!orderSnap.exists()) {
            throw new Error("Order not found");
        }
        const orderData = orderSnap.data();
        const assignedAgentId = orderData.assignedAgentId;
        const currentStatus = orderData.status;

        const batch = writeBatch(db);
        
        // Update order status
        batch.update(orderDocRef, { status });

        // If status is changing to a completed state ('Delivered') and there was an assigned agent, decrement their count
        if (status === 'Delivered' && currentStatus !== 'Delivered' && assignedAgentId) {
            const agentRef = doc(db, 'deliveryAgents', assignedAgentId);
            batch.update(agentRef, { activeOrderCount: increment(-1) });
        }
        
        await batch.commit();

        revalidatePath('/delivery/dashboard');
        return { success: true, error: null };
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { success: false, error: 'Failed to update order status.' };
    }
}

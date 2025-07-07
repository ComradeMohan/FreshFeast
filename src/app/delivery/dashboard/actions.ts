
'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { format } from 'date-fns'

// Define a new type for the assigned order
export type AssignedOrder = {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    status: string;
    items: any[];
    createdAt: string;
};

// This function will fetch ALL active orders for an agent
export async function getAssignedOrders(agentId: string): Promise<AssignedOrder[]> {
    if (!agentId) return [];
    
    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef, 
        where('assignedAgentId', '==', agentId), 
        where('status', 'in', ['Pending', 'Out for Delivery']),
        orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return [];
    }

    const orders: AssignedOrder[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            customerName: data.userName,
            customerPhone: data.userPhone,
            customerAddress: `${data.deliveryInfo.address}, ${data.deliveryInfo.city}, ${data.deliveryInfo.state} - ${data.deliveryInfo.zip}`,
            status: data.status,
            items: data.items,
            createdAt: format(data.createdAt.toDate(), 'MMMM d, yyyy'),
        };
    });

    return orders;
}

'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { revalidatePath } from 'next/cache'

export async function getAssignedAreasForAgent(agentId: string): Promise<string[]> {
  if (!agentId) {
    return []
  }
  try {
    const areasRef = collection(db, 'serviceableAreas')
    const q = query(areasRef, where('assignedAgentIds', 'array-contains', agentId))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
        return [];
    }
    return querySnapshot.docs.map(doc => doc.data().name)
  } catch (error) {
    console.error('Error fetching assigned areas for agent:', error)
    return []
  }
}

export async function updateAgentCapacity(agentId: string, capacity: number) {
  if (!agentId) {
    return { success: false, error: 'Agent ID is missing.' };
  }
  if (!Number.isInteger(capacity) || capacity < 0) {
    return { success: false, error: 'Capacity must be a non-negative whole number.' };
  }

  try {
    const agentDocRef = doc(db, 'deliveryAgents', agentId);
    await updateDoc(agentDocRef, {
      maxDeliveries: capacity,
    });
    revalidatePath('/delivery/profile');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating agent capacity:', error);
    return { success: false, error: 'Failed to update capacity.' };
  }
}

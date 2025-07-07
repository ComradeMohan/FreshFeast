'use server'

import { db } from '@/lib/firebase'
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1),
  pincode: z.string().min(6),
  state: z.string().min(1),
})

export async function addArea(values: z.infer<typeof formSchema>) {
  try {
    await addDoc(collection(db, 'serviceableAreas'), {
      name: values.name,
      pincode: values.pincode,
      state: values.state,
      createdAt: serverTimestamp(),
      assignedAgentIds: [], // Start with no agents assigned
    })
    revalidatePath('/admin/areas')
    revalidatePath('/checkout') // To update the dropdown on checkout page
    return { error: null }
  } catch (error: any) {
    console.error('Error adding area:', error)
    return { error: 'Failed to add new area.' }
  }
}

export async function deleteArea(areaId: string) {
  if (!areaId) {
    return { error: 'Area ID is missing.' }
  }
  try {
    await deleteDoc(doc(db, 'serviceableAreas', areaId))
    revalidatePath('/admin/areas')
    revalidatePath('/checkout')
    return { error: null }
  } catch (error: any) {
    console.error('Error deleting area:', error)
    return { error: 'Failed to delete area.' }
  }
}

export async function getApprovedAgents() {
    try {
        const agentsRef = collection(db, 'deliveryAgents');
        const q = query(agentsRef, where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: `${data.firstName} ${data.lastName}`,
            };
        });
    } catch (error) {
        console.error("Error fetching approved agents:", error);
        return [];
    }
}

export async function updateAreaAgents(areaId: string, agentIds: string[]) {
    if (!areaId) {
        return { success: false, error: 'Area ID is missing.' };
    }
    try {
        const areaDocRef = doc(db, 'serviceableAreas', areaId);
        await updateDoc(areaDocRef, {
            assignedAgentIds: agentIds,
        });
        revalidatePath('/admin/areas');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('Error assigning agents:', error);
        return { success: false, error: 'Failed to assign agents.' };
    }
}

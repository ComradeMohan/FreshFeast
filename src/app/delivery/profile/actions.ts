'use server'

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function getAssignedAreasForAgent(agentId: string): Promise<string[]> {
  if (!agentId) {
    return []
  }
  try {
    const areasRef = collection(db, 'serviceableAreas')
    const q = query(areasRef, where('assignedAgentId', '==', agentId))
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

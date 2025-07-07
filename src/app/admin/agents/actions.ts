'use server'

import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export async function approveAgent(agentId: string) {
  if (!agentId) {
    return { success: false, error: 'Agent ID is missing.' }
  }

  try {
    const agentDocRef = doc(db, 'deliveryAgents', agentId)
    await updateDoc(agentDocRef, {
      status: 'approved',
    })
    revalidatePath('/admin/agents')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error approving agent:', error)
    return { success: false, error: 'Failed to approve agent.' }
  }
}

export async function rejectAgent(agentId: string) {
  if (!agentId) {
    return { success: false, error: 'Agent ID is missing.' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    const errorMessage = "Supabase URL or Service Role Key is missing."
    console.error(errorMessage)
    return { success: false, error: errorMessage }
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const agentDocRef = doc(db, 'deliveryAgents', agentId)

  try {
    // 1. Get agent data to find photo URL
    const agentDocSnap = await getDoc(agentDocRef)
    if (!agentDocSnap.exists()) {
      throw new Error("Agent not found in Firestore.")
    }
    const agentData = agentDocSnap.data()
    const photoUrl = agentData.photoUrl

    // 2. Delete photo from Supabase Storage
    if (photoUrl) {
      const filePath = photoUrl.split('/agent-photos/')[1]
      if (filePath) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from('agent-photos')
          .remove([filePath])
        if (deleteError) {
          // Log error but proceed with Firestore deletion
          console.error("Failed to delete agent photo from storage:", deleteError.message)
        }
      }
    }

    // 3. Delete agent document from Firestore
    await deleteDoc(agentDocRef)

    revalidatePath('/admin/agents')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error rejecting agent:', error)
    return { success: false, error: 'Failed to reject agent.' }
  }
}

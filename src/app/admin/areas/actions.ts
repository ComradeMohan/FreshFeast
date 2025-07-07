'use server'

import { db } from '@/lib/firebase'
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1),
  pincode: z.string().min(6),
})

export async function addArea(values: z.infer<typeof formSchema>) {
  try {
    await addDoc(collection(db, 'serviceableAreas'), {
      name: values.name,
      pincode: values.pincode,
      createdAt: serverTimestamp(),
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

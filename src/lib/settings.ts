'use server'

import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { revalidatePath } from 'next/cache'

export async function getShippingCharge(): Promise<number> {
  try {
    const settingDocRef = doc(db, 'settings', 'shipping');
    const docSnap = await getDoc(settingDocRef);

    if (docSnap.exists() && typeof docSnap.data().charge === 'number' && docSnap.data().charge >= 0) {
      return docSnap.data().charge;
    }
    return 0; // Default to 0 if not set or invalid
  } catch (error) {
    console.error("Error fetching shipping charge:", error);
    return 0; // Default to 0 on error
  }
}

export async function updateShippingCharge(formData: FormData) {
   const charge = parseFloat(formData.get('charge') as string);

   if (isNaN(charge) || charge < 0) {
     return { success: false, error: 'Invalid shipping charge amount.' };
   }

   try {
    const settingDocRef = doc(db, 'settings', 'shipping');
    await setDoc(settingDocRef, { charge: charge }, { merge: true });
    
    revalidatePath('/admin/dashboard');

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error updating shipping charge:", error);
    return { success: false, error: 'Failed to update shipping charge.' };
  }
}

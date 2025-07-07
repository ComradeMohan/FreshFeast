'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Note: We are not using the client from /lib/supabase.ts because we need the service role key for admin actions.
// The service role key should be stored in .env.local and MUST NOT be exposed to the client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function addProduct(formData: FormData) {
  const file_name = formData.get('file_name') as string
  const description = formData.get('description') as string
  const price_weekly = parseFloat(formData.get('price_weekly') as string)
  const price_monthly = parseFloat(formData.get('price_monthly') as string)
  const image = formData.get('image') as File

  if (!file_name || !description || !price_weekly || !price_monthly || !image || image.size === 0) {
    return { error: 'All fields, including an image, are required.' }
  }

  try {
    const filePath = `products/${Date.now()}_${image.name}`
    
    // 1. Upload image to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('products')
      .upload(filePath, image)

    if (uploadError) {
      throw uploadError
    }

    // 2. Get the public URL of the uploaded image
    const { data: urlData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(filePath)
    
    const imageUrl = urlData.publicUrl

    // 3. Insert product data into Supabase table
    const { error: insertError } = await supabaseAdmin.from('products').insert({
      file_name: file_name,
      description: description,
      price_weekly: price_weekly,
      price_monthly: price_monthly,
      file_url: imageUrl,
    })

    if (insertError) {
      throw insertError
    }

    // Revalidate paths to show new data
    revalidatePath('/admin/add-product')
    revalidatePath('/')

    return { error: null }
  } catch (error: any) {
    console.error('Add Product Action Error:', error)
    // To avoid leaking sensitive details, return a generic error message.
    return { error: 'An unexpected error occurred while adding the product. Check the server logs for details.' }
  }
}

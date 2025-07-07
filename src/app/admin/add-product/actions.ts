'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function addProduct(formData: FormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    const errorMessage = "Supabase URL or Service Role Key is missing. Please check your .env.local file and restart the server."
    console.error(errorMessage)
    return { error: errorMessage }
  }

  // Note: We are not using the client from /lib/supabase.ts because we need the service role key for admin actions.
  // The service role key should be stored in .env.local and MUST NOT be exposed to the client.
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const file_name = formData.get('file_name') as string
  const description = formData.get('description') as string
  const price_weekly = parseFloat(formData.get('price_weekly') as string)
  const price_monthly = parseFloat(formData.get('price_monthly') as string)
  const image = formData.get('image') as File

  if (!file_name || !description || !price_weekly || !price_monthly || !image || image.size === 0) {
    return { error: 'All fields, including an image, are required.' }
  }

  try {
    const filePath = `${Date.now()}_${image.name}`
    
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

export async function updateProduct(formData: FormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    const errorMessage = "Supabase URL or Service Role Key is missing. Please check your .env.local file and restart the server."
    console.error(errorMessage)
    return { error: errorMessage }
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const id = formData.get('id') as string;
  const file_name = formData.get('file_name') as string
  const description = formData.get('description') as string
  const price_weekly = parseFloat(formData.get('price_weekly') as string)
  const price_monthly = parseFloat(formData.get('price_monthly') as string)
  const image = formData.get('image') as File | null
  const existingImageUrl = formData.get('existing_image_url') as string

  if (!id || !file_name || !description || !price_weekly || !price_monthly) {
    return { error: 'All fields are required.' }
  }
  
  try {
    let imageUrl = existingImageUrl;
    
    // 1. If a new image is uploaded
    if (image && image.size > 0) {
      // a. Upload the new image
      const newFilePath = `${Date.now()}_${image.name}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('products')
        .upload(newFilePath, image)

      if (uploadError) {
        throw uploadError
      }
      
      // b. Get the public URL of the new image
      const { data: urlData } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(newFilePath)
      
      imageUrl = urlData.publicUrl

      // c. Delete the old image
      if (existingImageUrl) {
        const oldFilePath = existingImageUrl.split('/products/')[1]
        if (oldFilePath) {
          const { error: deleteError } = await supabaseAdmin.storage
            .from('products')
            .remove([oldFilePath])
          if (deleteError) {
             // Log the error but don't block the update process
             console.error("Failed to delete old image, continuing with update:", deleteError)
          }
        }
      }
    }

    // 2. Update product data in Supabase table
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        file_name: file_name,
        description: description,
        price_weekly: price_weekly,
        price_monthly: price_monthly,
        file_url: imageUrl,
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }
    
    // 3. Revalidate paths to show new data
    revalidatePath('/admin/add-product')
    revalidatePath('/')

    return { error: null }
  } catch (error: any) {
    console.error('Update Product Action Error:', error)
    return { error: 'An unexpected error occurred while updating the product. Check the server logs for details.' }
  }
}

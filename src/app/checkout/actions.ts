'use server'

import { db } from '@/lib/firebase'
import { collection, getDocs, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { z } from 'zod'

export async function generateQrCode(amount: number) {
  const upiId = process.env.ADMIN_UPI_ID
  const upiName = process.env.ADMIN_UPI_NAME

  if (!upiId || !upiName) {
    console.error("UPI ID or Name is not configured in environment variables.")
    return { qrCodeUrl: null, error: 'Payment system is not configured. Please contact support.' }
  }
  
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount.toFixed(2)}&cu=INR&tr=${Date.now()}`

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(upiString)
    return { qrCodeUrl: qrCodeDataUrl, error: null }
  } catch (error) {
    console.error('Error generating QR code:', error)
    return { qrCodeUrl: null, error: 'Could not generate QR code.' }
  }
}

export async function createOrder(userId: string, deliveryInfo: any) {
    if (!userId) {
        throw new Error('User not authenticated.')
    }

    let orderId = ''
    try {
        const cartRef = collection(db, 'carts', userId, 'items')
        const cartSnapshot = await getDocs(cartRef)

        if (cartSnapshot.empty) {
            throw new Error('Your cart is empty.')
        }

        const cartItems = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const subtotal = cartItems.reduce((acc, item: any) => acc + item.price * item.quantity, 0)
        const shipping = cartItems.length > 0 ? 50.00 : 0;
        const total = subtotal + shipping

        const orderData = {
            userId,
            deliveryInfo,
            items: cartItems,
            subtotal,
            shipping,
            total,
            status: 'processing',
            createdAt: serverTimestamp(),
        }

        const orderRef = await addDoc(collection(db, 'orders'), orderData)
        orderId = orderRef.id
        
        // Clear the cart after order creation
        const batch = writeBatch(db)
        cartSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })
        await batch.commit()
    } catch (error: any) {
        console.error('Error creating order:', error)
        throw new Error(error.message || 'There was an error creating your order.')
    }

    redirect(`/order/confirmation?orderId=${orderId}`)
}

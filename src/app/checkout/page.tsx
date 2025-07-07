'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useCart } from '@/hooks/use-cart-bubble'
import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const [user, authLoading] = useAuthState(auth)
  const router = useRouter()
  const { cartItems, loading: cartLoading } = useCart()

  const subtotal = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [cartItems])

  const shipping = cartItems.length > 0 ? 50.00 : 0;
  const total = subtotal + shipping

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || cartLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-[calc(100vh-15rem)]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl ml-2">
            Checkout
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input id="address" placeholder="123 Fruit Lane" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" placeholder="Fruityville" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="state">State</Label>
                            <Input id="state" placeholder="CA" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="zip">ZIP Code</Label>
                            <Input id="zip" placeholder="90210" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Delivery Time</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a delivery window" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12pm - 4pm)</SelectItem>
                                <SelectItem value="evening">Evening (4pm - 8pm)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="font-headline">Payment Details</CardTitle>
                    <CardDescription>Scan the QR code to complete your payment.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                    <Image 
                        src="https://placehold.co/256x256.png" 
                        alt="UPI QR Code" 
                        width={256} 
                        height={256}
                        data-ai-hint="upi qrcode"
                        className="rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                        Use any UPI app like Google Pay, PhonePe, or Paytm.<br/>
                        Your order will be confirmed after payment.
                    </p>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                {cartItems.map((item) => (
                   <div className="flex justify-between text-muted-foreground" key={item.id}>
                        <span className="max-w-[70%] truncate">{item.name} ({item.plan}) (x{item.quantity})</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <Separator />
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{shipping.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
                <Button size="lg" className="w-full mt-4 bg-primary hover:bg-primary/90" asChild>
                    <Link href="/order/confirmation">
                        Place Order
                    </Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

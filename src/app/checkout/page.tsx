'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, LoaderCircle, AlertTriangle } from 'lucide-react'
import { useCart } from '@/hooks/use-cart-bubble'
import React, { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { generateQrCode, createOrder } from './actions'
import { Skeleton } from '@/components/ui/skeleton'

const deliveryInfoSchema = z.object({
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  zip: z.string().min(1, 'ZIP code is required.'),
  digipin: z.string().min(1, 'DigiPIN is required.'),
  deliveryTime: z.string().min(1, 'Please select a delivery window.'),
})

export default function CheckoutPage() {
  const [user, authLoading] = useAuthState(auth)
  const router = useRouter()
  const { cartItems, loading: cartLoading } = useCart()
  const { toast } = useToast()
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)

  const form = useForm<z.infer<typeof deliveryInfoSchema>>({
    resolver: zodResolver(deliveryInfoSchema),
    defaultValues: {
      address: '', city: '', state: '', zip: '', digipin: '', deliveryTime: ''
    },
  })

  const subtotal = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [cartItems])

  const shipping = cartItems.length > 0 ? 50.00 : 0;
  const total = subtotal + shipping

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (total > 0) {
      setQrLoading(true)
      generateQrCode(total)
        .then(result => {
          if (result.error) {
            toast({ variant: 'destructive', title: 'QR Code Error', description: result.error })
            setQrError(result.error)
            setQrCodeUrl(null)
          } else {
            setQrCodeUrl(result.qrCodeUrl)
            setQrError(null)
          }
        })
        .finally(() => setQrLoading(false))
    } else if (cartItems.length === 0 && !cartLoading) {
        setQrLoading(false)
    }
  }, [total, toast, cartItems, cartLoading])

  async function onSubmit(values: z.infer<typeof deliveryInfoSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in to place an order.' })
      return
    }
    
    form.clearErrors();

    try {
      await createOrder(user.uid, values)
    } catch (error) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is an expected error during redirection, do not show a toast.
      } else {
        console.error('Failed to create order:', error);
        toast({ variant: 'destructive', title: 'Order Failed', description: error instanceof Error ? error.message : 'There was a problem placing your order.' });
      }
    }
  }

  if (authLoading || cartLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-[calc(100vh-15rem)]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      <FormField control={form.control} name="address" render={({ field }) => (
                          <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Fruit Lane" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Fruityville" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="zip" render={({ field }) => (
                            <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input placeholder="400001" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="digipin" render={({ field }) => (
                            <FormItem><FormLabel>DigiPIN</FormLabel><FormControl><Input placeholder="e.g., MU400001A01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                       <p className="text-sm text-muted-foreground -mt-2">
                          Find your required DigiPIN at the{' '}
                          <Link href="https://dac.indiapost.gov.in/mydigipin/home" target="_blank" rel="noopener noreferrer" className="underline font-medium text-primary">
                              India Post website
                          </Link>
                          .
                      </p>
                      <FormField control={form.control} name="deliveryTime" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a delivery window" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                                    <SelectItem value="afternoon">Afternoon (12pm - 4pm)</SelectItem>
                                    <SelectItem value="evening">Evening (4pm - 8pm)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                      )} />
                    </CardContent>
                </Card>
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="font-headline">Payment Details</CardTitle>
                        <CardDescription>Scan the QR code to complete your payment for ₹{total.toFixed(2)}.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                        {qrLoading ? (
                            <Skeleton className="h-[256px] w-[256px] rounded-lg" />
                        ) : qrCodeUrl ? (
                            <Image 
                                src={qrCodeUrl} 
                                alt="UPI QR Code" 
                                width={256} 
                                height={256}
                                className="rounded-lg"
                            />
                        ) : (
                           <Alert variant="destructive" className="w-full">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>QR Code Error</AlertTitle>
                                <AlertDescription>
                                    {qrError || "We couldn't generate a QR code for your payment. Please try refreshing the page or contact support."}
                                </AlertDescription>
                            </Alert>
                        )}
                        <p className="text-sm text-muted-foreground text-center">
                            Use any UPI app like Google Pay, PhonePe, or Paytm.<br/>
                            After payment, click "Place Order" to confirm.
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
                    <Button type="submit" size="lg" className="w-full mt-4 bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting || !qrCodeUrl}>
                        {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : "Place Order"}
                    </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, ArrowRight, LoaderCircle, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/use-cart-bubble'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import React from 'react'
import { getShippingCharge } from './actions'
import { Skeleton } from '@/components/ui/skeleton'

export default function CartPage() {
  const [user] = useAuthState(auth)
  const { cartItems, loading, removeFromCart, updateItemQuantity } = useCart()
  const [shipping, setShipping] = React.useState<number | null>(null);

  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change
    if (newQuantity > 0) {
      updateItemQuantity(itemId, newQuantity)
    }
  }
  
  React.useEffect(() => {
    async function fetchShippingCharge() {
      if (cartItems.length > 0) {
        const charge = await getShippingCharge();
        setShipping(charge);
      } else {
        setShipping(0);
      }
    }
    fetchShippingCharge();
  }, [cartItems.length]);

  const subtotal = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [cartItems])

  const total = shipping !== null ? subtotal + shipping : null;

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-[calc(100vh-15rem)]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
     return (
      <div className="container mx-auto px-4 py-12 md:py-24 text-center">
        <h1 className="text-3xl font-headline font-bold">Your Cart is Empty</h1>
        <p className="text-muted-foreground mt-4">Please log in to see your cart and add items.</p>
        <Button asChild className="mt-6">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-24 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-3xl font-headline font-bold mt-6">Your Cart is Empty</h1>
        <p className="text-muted-foreground mt-2">Looks like you haven't added any packages yet.</p>
        <Button asChild className="mt-6">
          <Link href="/#packages">Browse Packages</Link>
        </Button>
      </div>
    )
  }


  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <h1 className="text-3xl font-headline font-bold tracking-tighter text-center sm:text-4xl md:text-5xl">
        Your Shopping Cart
      </h1>
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Package</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.plan}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                           <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity, -1)}>-</Button>
                           <Input type="number" value={item.quantity} readOnly className="w-16 h-8 text-center" />
                           <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity, 1)}>+</Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        {shipping !== null ? (
                          <span>₹{shipping.toFixed(2)}</span>
                        ) : (
                          <Skeleton className="h-5 w-12" />
                        )}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        {total !== null ? (
                          <span>₹{total.toFixed(2)}</span>
                        ) : (
                          <Skeleton className="h-6 w-20" />
                        )}
                    </div>
                    <Button size="lg" className="w-full mt-4 bg-primary hover:bg-primary/90" asChild>
                        <Link href="/checkout">
                            Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

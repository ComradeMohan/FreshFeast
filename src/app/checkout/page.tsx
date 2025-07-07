import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function CheckoutPage() {
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
                    <CardDescription>All transactions are secure and encrypted.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="card-name">Name on Card</Label>
                        <Input id="card-name" placeholder="John Doe" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input id="card-number" placeholder="**** **** **** 1234" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="expiry">Expiration</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex justify-between text-muted-foreground">
                    <span>Tropical Paradise Box (Monthly) (x1)</span>
                    <span>₹4,499.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Berry Bliss Box (Weekly) (x2)</span>
                    <span>₹2,198.00</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹6,697.00</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹50.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹6,747.00</span>
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

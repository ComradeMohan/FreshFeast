import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, ArrowRight } from 'lucide-react'

const cartItems = [
  {
    id: '1',
    name: 'Tropical Paradise Box (Monthly)',
    price: 4499,
    quantity: 1,
    image: 'https://placehold.co/600x400',
    hint: 'tropical fruit',
  },
  {
    id: '2',
    name: 'Berry Bliss Box (Weekly)',
    price: 1099,
    quantity: 2,
    image: 'https://placehold.co/600x400',
    hint: 'fresh berries',
  },
];

const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
const shipping = 50.00;
const total = subtotal + shipping;

export default function CartPage() {
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
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                          data-ai-hint={item.hint}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Input type="number" defaultValue={item.quantity} className="w-16 text-center" />
                      </TableCell>
                      <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
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
                        <span>₹{shipping.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                    <Button size="lg" className="w-full mt-4 bg-accent hover:bg-accent/90" asChild>
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

'use client'

import Image from 'next/image'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/use-cart-bubble'

type Package = {
  id: string
  file_name: string
  description: string
  price_weekly: number
  price_monthly: number
  file_url: string
}

type ProductCardProps = {
  packageItem: Package
}

export function ProductCard({ packageItem }: ProductCardProps) {
  const { addToCart } = useCart()

  const handleAddToCart = (plan: 'weekly' | 'monthly') => {
    const price = plan === 'weekly' ? packageItem.price_weekly : packageItem.price_monthly;
    const cartItem = {
      productId: packageItem.id,
      name: packageItem.file_name,
      description: packageItem.description,
      imageUrl: packageItem.file_url,
      plan: plan,
      price: price,
      quantity: 1,
    };
    addToCart(cartItem);
  };

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
          <Image
            src={packageItem.file_url}
            alt={packageItem.file_name}
            fill
            className="object-cover"
            data-ai-hint={packageItem.file_name.split(' ')[0]}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline">{packageItem.file_name}</CardTitle>
        <CardDescription className="mt-2 text-sm">{packageItem.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex-col items-start gap-3">
        <div className="w-full flex justify-between items-center">
            <div>
                <p className="text-xs text-muted-foreground">Weekly Plan (5 deliveries)</p>
                <p className="text-lg font-bold text-primary">₹{packageItem.price_weekly.toLocaleString()}</p>
            </div>
            <Button onClick={() => handleAddToCart('weekly')} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add
            </Button>
        </div>
         <div className="w-full flex justify-between items-center">
            <div>
                <p className="text-xs text-muted-foreground">Monthly Plan (~22 deliveries)</p>
                <p className="text-lg font-bold text-primary">₹{packageItem.price_monthly.toLocaleString()}</p>
            </div>
            <Button onClick={() => handleAddToCart('monthly')} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add
            </Button>
        </div>
        <Button variant="outline" className="w-full mt-2">Customize Box</Button>
      </CardFooter>
    </Card>
  )
}

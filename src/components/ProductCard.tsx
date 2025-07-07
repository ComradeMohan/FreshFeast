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
import { useCartBubble } from '@/hooks/use-cart-bubble'

type Product = {
  id: string
  name: string
  description: string
  price: string
  image: string
  hint: string
}

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { setShowCartBubble } = useCartBubble()

  const handleAddToCart = () => {
    setShowCartBubble(true)
  }

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.hint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline">{product.name}</CardTitle>
        <CardDescription className="mt-2 text-sm">{product.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-lg font-bold text-primary">${product.price}</p>
        <Button onClick={handleAddToCart} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}

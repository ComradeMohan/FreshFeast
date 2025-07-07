'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/ProductCard'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

const products = [
  {
    id: '1',
    name: 'Classic Harvest Box',
    description: 'A delightful mix of seasonal apples, bananas, oranges, and grapes.',
    price: '29.99',
    image: 'https://placehold.co/600x400',
    hint: 'fruit basket'
  },
  {
    id: '2',
    name: 'Tropical Paradise Box',
    description: 'An exotic collection of pineapple, mango, kiwi, and passion fruit.',
    price: '39.99',
    image: 'https://placehold.co/600x400',
    hint: 'tropical fruit'
  },
  {
    id: '3',
    name: 'Berry Bliss Box',
    description: 'A sweet assortment of strawberries, blueberries, raspberries, and blackberries.',
    price: '34.99',
    image: 'https://placehold.co/600x400',
    hint: 'fresh berries'
  },
  {
    id: '4',
    name: 'Citrus Sunshine Box',
    description: 'A zesty selection of oranges, grapefruits, lemons, and limes.',
    price: '24.99',
    image: 'https://placehold.co/600x400',
    hint: 'citrus fruit'
  },
]

export default function Home() {
  const [user, loading] = useAuthState(auth)

  if (loading) {
    return (
      <div className="w-full py-12 md:py-24 lg:py-32 container flex justify-center items-center min-h-[calc(100vh-16rem)]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {!user && (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
                Fresh Fruit Boxes, Delivered to You
              </h1>
              <p className="mt-4 text-muted-foreground md:text-xl">
                Experience the taste of nature with our curated fruit boxes. Hand-picked, fresh, and delivered right to your doorstep.
              </p>
              <Button asChild size="lg" className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="#products">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section id="products" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-headline font-bold tracking-tighter text-center sm:text-4xl md:text-5xl">
            Our Most Popular Boxes
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-center text-muted-foreground">
            Choose from our selection of carefully curated fruit boxes, perfect for any occasion.
          </p>
          <div className="grid grid-cols-1 gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

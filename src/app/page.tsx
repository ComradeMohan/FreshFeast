'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/ProductCard'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'

const packages = [
  {
    id: '1',
    name: 'Classic Harvest Box',
    description: 'A delightful mix of seasonal apples, bananas, oranges, and grapes. Perfect for individuals or small families.',
    price_weekly: '899',
    price_monthly: '3,299',
    image: 'https://placehold.co/600x400',
    hint: 'fruit basket'
  },
  {
    id: '2',
    name: 'Tropical Paradise Box',
    description: 'An exotic collection of pineapple, mango, kiwi, and passion fruit. A taste of the tropics.',
    price_weekly: '1,199',
    price_monthly: '4,499',
    image: 'https://placehold.co/600x400',
    hint: 'tropical fruit'
  },
  {
    id: '3',
    name: 'Berry Bliss Box',
    description: 'A sweet assortment of strawberries, blueberries, raspberries, and blackberries. Great for smoothies.',
    price_weekly: '1,099',
    price_monthly: '3,999',
    image: 'https://placehold.co/600x400',
    hint: 'fresh berries'
  },
  {
    id: '4',
    name: 'Citrus Sunshine Box',
    description: 'A zesty selection of oranges, grapefruits, lemons, and limes. Packed with Vitamin C.',
    price_weekly: '799',
    price_monthly: '2,999',
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
                <Link href="#packages">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section id="packages" className={cn("w-full py-12 md:py-24 lg:py-32", user && "pt-0 md:pt-0 lg:pt-0")}>
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-headline font-bold tracking-tighter text-center sm:text-4xl md:text-5xl">
            Our Subscription Packages
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-center text-muted-foreground">
            Choose from our weekly or monthly subscription packages. All packages are customizable.
          </p>
          <div className="grid grid-cols-1 gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <ProductCard key={pkg.id} packageItem={pkg} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

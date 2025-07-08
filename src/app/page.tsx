'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/ProductCard'
import { ArrowRight, LoaderCircle, Truck } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Package = {
  id: string
  file_name: string
  description: string
  price_weekly: number
  price_monthly: number
  file_url: string
}

export default function Home() {
  const [user, authLoading] = useAuthState(auth)
  const [packages, setPackages] = useState<Package[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        setPackages(data as Package[])
      } catch (error) {
        console.error("Error fetching packages: ", error);
      } finally {
        setPackagesLoading(false)
      }
    }

    fetchPackages()
  }, [])

  if (!hasMounted || authLoading || packagesLoading) {
    return (
      <div className="w-full py-12 md:py-24 lg:py-32 container flex justify-center items-center min-h-[calc(100vh-16rem)]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col animate-fade-in">
      {!user && (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10 overflow-hidden">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
              <h1 
                className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.1s' }}
              >
                Fresh Fruit Boxes, Delivered to You
              </h1>
              <p 
                className="mt-4 text-muted-foreground md:text-xl max-w-xl opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                Experience the taste of nature with our curated fruit boxes. Hand-picked, fresh, and delivered right to your doorstep.
              </p>
              <div 
                className="mt-6 inline-flex items-center rounded-lg border border-dashed border-primary/50 bg-background px-4 py-2 text-base font-medium text-primary shadow-sm opacity-0 animate-fade-in-up"
                style={{ animationDelay: '0.3s' }}
              >
                <Truck className="mr-3 h-5 w-5" />
                <span>Free Delivery: 6 AM - 9 AM</span>
              </div>
              <div 
                className="opacity-0 animate-fade-in-up" 
                style={{ animationDelay: '0.4s' }}
              >
                <Button asChild size="lg" className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="#packages">
                    Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
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
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg) => (
                <ProductCard key={pkg.id} packageItem={pkg} />
              ))}
            </div>
          ) : (
             <div className="text-center mt-12 text-muted-foreground">
                No packages available at the moment. Please check back later.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

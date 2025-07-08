import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, ArrowRight } from 'lucide-react'

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 animate-fade-in">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl text-primary">
          Join Our Delivery Team
        </h1>
        <p className="mt-4 text-muted-foreground md:text-xl">
          Become a part of the Fresh Feast Hub family and help us deliver happiness, one fruit box at a time. We're looking for passionate and reliable delivery agents.
        </p>
      </div>

      <div className="mt-12 max-w-lg mx-auto">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Truck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline mt-4">Delivery Agent</CardTitle>
            <CardDescription>
              Flexible hours, competitive pay, and a mission to promote healthy living.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/delivery/login">
                Agent Login <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/delivery/signup">
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

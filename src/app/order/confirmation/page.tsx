import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function OrderConfirmationPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <Card className="mx-auto max-w-lg text-center">
        <CardHeader className="items-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline mt-6">Thank You for Your Order!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your fruit box is on its way.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We've sent a confirmation email to your address with the order details. You can expect your delivery within the selected time window.
          </p>
          <div className="mt-8">
            <p className="font-semibold">Order Number</p>
            <p className="text-primary text-xl font-mono">#FFH12345</p>
          </div>
          <Button asChild className="mt-8 w-full sm:w-auto">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

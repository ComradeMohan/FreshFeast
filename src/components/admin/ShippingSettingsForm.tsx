'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { updateShippingCharge } from '@/lib/settings'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

const formSchema = z.object({
  charge: z.coerce.number().min(0, { message: "Shipping charge must be zero or a positive number." }),
})

export function ShippingSettingsForm({ initialCharge }: { initialCharge: number }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      charge: initialCharge || 0,
    },
  })

  // Update form default value if the prop changes
  useState(() => {
    form.reset({ charge: initialCharge || 0 });
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('charge', values.charge.toString())

    const result = await updateShippingCharge(formData)
    setIsSubmitting(false)

    if (result.error) {
       toast({ variant: "destructive", title: "Update Failed", description: result.error })
    } else {
       toast({ title: "Settings updated!", description: "The new shipping charge has been saved." })
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Settings</CardTitle>
        <CardDescription>Manage store-wide settings like shipping costs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
            <FormField
              control={form.control}
              name="charge"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Shipping Charge (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

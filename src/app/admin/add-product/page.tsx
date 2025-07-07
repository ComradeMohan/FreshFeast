'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, LoaderCircle } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, { message: "Package name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  price_weekly: z.coerce.number().positive({ message: "Weekly price must be a positive number" }),
  price_monthly: z.coerce.number().positive({ message: "Monthly price must be a positive number" }),
  image: z.any().refine((files) => files?.length == 1, "Image is required."),
})

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price_weekly: 0,
      price_monthly: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const imageFile = values.image[0];
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, "products"), {
        name: values.name,
        description: values.description,
        price_weekly: values.price_weekly,
        price_monthly: values.price_monthly,
        image: imageUrl,
        hint: 'fruit box', // default hint
        createdAt: new Date(),
      });

      toast({
        title: "Package added successfully!",
        description: "The new package is now available for customers.",
      })
      router.push('/admin/dashboard')
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem adding the new package.",
      })
    } finally {
        setIsSubmitting(false)
    }
  }
  
  return (
     <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex items-center mb-8 gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Add New Package</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to add a new subscription package.</p>
        </div>
      </div>
       <Card>
        <CardContent className="pt-6">
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Classic Harvest Box" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the contents and benefits of the package." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price_weekly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="899" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="price_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="3299" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Package Image</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        {...rest} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Add Package"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

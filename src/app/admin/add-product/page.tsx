'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const formSchema = z.object({
  file_name: z.string().min(1, { message: "Package name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  price_weekly: z.coerce.number().positive({ message: "Weekly price must be a positive number" }),
  price_monthly: z.coerce.number().positive({ message: "Monthly price must be a positive number" }),
  image: z.any().refine((files) => files?.length == 1, "Image is required."),
})

// Define a type for the product from Supabase
type Product = {
  id: string
  file_name: string
  file_url: string
  price_weekly: number
  price_monthly: number
}

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file_name: "",
      description: "",
      price_weekly: 0,
      price_monthly: 0,
    },
  })

  // Fetch products from Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error)
      toast({
        variant: "destructive",
        title: "Error fetching products",
        description: error.message || "Could not load packages. Please check your Supabase table's Row Level Security policies.",
      })
    } else {
      setProducts(data as Product[])
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const imageFile = values.image[0];
      const filePath = `products/${Date.now()}_${imageFile.name}`;

      // 1. Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      
      const imageUrl = urlData.publicUrl;

      // 3. Insert product data into Supabase table
      const { error: insertError } = await supabase.from('products').insert({
        file_name: values.file_name,
        description: values.description,
        price_weekly: values.price_weekly,
        price_monthly: values.price_monthly,
        file_url: imageUrl,
      });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Package added successfully!",
        description: "The new package is now available for customers.",
      })
      form.reset();
      setImagePreview(null);
      await fetchProducts(); // Refresh the product list
      
    } catch (error: any) {
      console.error("Error adding product:", error)
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem adding the new package.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", event.target.files);
    } else {
        setImagePreview(null);
        form.setValue("image", null);
    }
  };
  
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
                name="file_name"
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Image</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {imagePreview && (
                <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Image Preview:</p>
                    <Image src={imagePreview} alt="Image preview" width={200} height={200} className="rounded-md object-cover" />
                </div>
              )}


              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Add Package"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="mt-12">
        <CardHeader>
            <CardTitle>Existing Packages</CardTitle>
            <CardDescription>A list of packages currently in your store.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Public URL</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <Image src={product.file_url} alt={product.file_name} width={64} height={64} className="rounded-md object-cover"/>
                            </TableCell>
                            <TableCell>{product.file_name}</TableCell>
                            <TableCell>
                                <Link href={product.file_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                                    View URL
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}

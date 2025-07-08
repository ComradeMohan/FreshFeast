'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { addProduct, updateProduct } from './actions'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, LoaderCircle, Pencil } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const addFormSchema = z.object({
  file_name: z.string().min(1, { message: "Package name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  price_weekly: z.coerce.number().positive({ message: "Weekly price must be a positive number" }),
  price_monthly: z.coerce.number().positive({ message: "Monthly price must be a positive number" }),
  image: z.any().refine((files) => files?.length == 1, "Image is required."),
})

const editFormSchema = addFormSchema.extend({
  image: z.any().optional(),
})

type Product = {
  id: string
  file_name: string
  description: string
  file_url: string
  price_weekly: number
  price_monthly: number
}

export default function AddProductPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  const addForm = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: { file_name: "", description: "", price_weekly: 0, price_monthly: 0, },
  })
  
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
  })

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error)
      toast({
        variant: "destructive",
        title: "Error fetching products",
        description: "Could not load packages. Please check your Supabase table's Row Level Security policies to ensure SELECT is allowed.",
      })
    } else {
      setProducts(data as Product[])
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [toast])

  useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        file_name: editingProduct.file_name,
        description: editingProduct.description,
        price_weekly: editingProduct.price_weekly,
        price_monthly: editingProduct.price_monthly,
      });
      setEditImagePreview(editingProduct.file_url);
    }
  }, [editingProduct, editForm]);


  async function onAddSubmit(values: z.infer<typeof addFormSchema>) {
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('file_name', values.file_name)
    formData.append('description', values.description)
    formData.append('price_weekly', values.price_weekly.toString())
    formData.append('price_monthly', values.price_monthly.toString())
    formData.append('image', values.image[0])

    const result = await addProduct(formData)
    setIsSubmitting(false)

    if (result.error) {
       toast({ variant: "destructive", title: "Uh oh! Something went wrong.", description: result.error })
    } else {
       toast({ title: "Package added successfully!", description: "The new package is now available for customers." })
      addForm.reset();
      setImagePreview(null);
      await fetchProducts(); 
    }
  }

  async function onUpdateSubmit(values: z.infer<typeof editFormSchema>) {
    if (!editingProduct) return;
    setIsSubmitting(true);
  
    const formData = new FormData();
    formData.append('id', editingProduct.id);
    formData.append('file_name', values.file_name);
    formData.append('description', values.description);
    formData.append('price_weekly', values.price_weekly.toString());
    formData.append('price_monthly', values.price_monthly.toString());
    formData.append('existing_image_url', editingProduct.file_url);
    if (values.image && values.image[0]) {
      formData.append('image', values.image[0]);
    }
  
    const result = await updateProduct(formData);
    setIsSubmitting(false);
  
    if (result.error) {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    } else {
      toast({ title: "Package updated successfully!" });
      setIsEditDialogOpen(false);
      await fetchProducts();
    }
  }
  

  const handleAddImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string) };
      reader.readAsDataURL(file);
      addForm.setValue("image", event.target.files);
    } else {
      setImagePreview(null);
      addForm.setValue("image", null);
    }
  };

  const handleEditImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setEditImagePreview(reader.result as string) };
      reader.readAsDataURL(file);
      editForm.setValue("image", event.target.files);
    }
  };
  
  return (
     <div className="container mx-auto px-4 py-12 md:py-16 animate-fade-in">
      <div className="flex items-center mb-8 gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Manage Packages</h1>
          <p className="text-muted-foreground mt-1">Add new subscription packages or edit existing ones.</p>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Add New Package</CardTitle>
        </CardHeader>
        <CardContent>
           <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="grid gap-6">
               <FormField control={addForm.control} name="file_name" render={({ field }) => (
                  <FormItem><FormLabel>Package Name</FormLabel><FormControl><Input placeholder="e.g., Classic Harvest Box" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              <FormField control={addForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the contents and benefits of the package." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={addForm.control} name="price_weekly" render={({ field }) => (
                    <FormItem><FormLabel>Weekly Price (₹)</FormLabel><FormControl><Input type="number" placeholder="899" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                 <FormField control={addForm.control} name="price_monthly" render={({ field }) => (
                    <FormItem><FormLabel>Monthly Price (₹)</FormLabel><FormControl><Input type="number" placeholder="3299" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
              <FormField control={addForm.control} name="image" render={({ field }) => (
                  <FormItem><FormLabel>Package Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={handleAddImageChange} /></FormControl><FormMessage /></FormItem>
                )} />
              
              {imagePreview && (
                <div className="mt-4"><p className="text-sm font-medium mb-2">Image Preview:</p><Image src={imagePreview} alt="Image preview" width={200} height={200} className="rounded-md object-cover" /></div>
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
                        <TableHead>Actions</TableHead>
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
                                <Button variant="outline" size="icon" onClick={() => { setEditingProduct(product); setIsEditDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>
              Make changes to your package here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="grid gap-4 py-4">
              <FormField control={editForm.control} name="file_name" render={({ field }) => (
                <FormItem><FormLabel>Package Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="price_weekly" render={({ field }) => (
                  <FormItem><FormLabel>Weekly Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="price_monthly" render={({ field }) => (
                  <FormItem><FormLabel>Monthly Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="image" render={({ field }) => (
                <FormItem><FormLabel>Change Image (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={handleEditImageChange} /></FormControl><FormMessage /></FormItem>
              )} />
              {editImagePreview && (
                <div><p className="text-sm font-medium mb-2">Image Preview:</p><Image src={editImagePreview} alt="Image preview" width={150} height={150} className="rounded-md object-cover" /></div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

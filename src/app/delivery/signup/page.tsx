'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { LoaderCircle, Truck } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  drivingLicense: z.string().min(1, { message: "Driving license number is required" }),
  image: z.any().refine((files) => files?.length == 1, "Your photo is required."),
})

export default function DeliverySignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      drivingLicense: "",
    },
  })

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string) };
      reader.readAsDataURL(file);
      form.setValue("image", event.target.files);
    } else {
      setImagePreview(null);
      form.setValue("image", null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // 1. Upload image to Supabase Storage
      const imageFile = values.image[0] as File
      const filePath = `${Date.now()}_${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('agent-photos')
        .upload(filePath, imageFile)

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`)
      }

      // 2. Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from('agent-photos')
        .getPublicUrl(filePath)
      
      const imageUrl = urlData.publicUrl

      // 3. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)
      const user = userCredential.user

      // 4. Store additional user data in Firestore
      await setDoc(doc(db, "deliveryAgents", user.uid), {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        drivingLicense: values.drivingLicense,
        photoUrl: imageUrl,
        createdAt: new Date(),
        status: 'pending_approval',
        maxDeliveries: 10,
        activeOrderCount: 0,
      })

      toast({
        title: "Application submitted!",
        description: "Your application will be reviewed. You will be notified upon approval.",
      })
      router.push('/delivery/login')
    } catch (error: any) {
      console.error("Delivery signup error:", error)
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem with your request. Please ensure you have created an 'agent-photos' bucket in your Supabase storage.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="items-center text-center">
          <Truck className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-headline">Apply to be a Delivery Agent</CardTitle>
          <CardDescription>
            Join our team and deliver fresh fruit boxes to our customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First name</FormLabel><FormControl><Input placeholder="Max" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last name</FormLabel><FormControl><Input placeholder="Robinson" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="drivingLicense" render={({ field }) => ( <FormItem><FormLabel>Driving License Number</FormLabel><FormControl><Input placeholder="MH01..." {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="image" render={({ field }) => ( <FormItem><FormLabel>Photo (with your delivery vehicle)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={handleImageChange} /></FormControl><FormMessage /></FormItem> )} />
              {imagePreview && ( <div className="mt-4"><p className="text-sm font-medium mb-2">Photo Preview:</p><Image src={imagePreview} alt="Photo preview" width={200} height={200} className="rounded-md object-cover" /></div> )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> Submitting...</> : "Submit Application"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already an agent?{' '}
            <Link href="/delivery/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

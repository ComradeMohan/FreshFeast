'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db, signOut } from '@/lib/firebase'
import { updatePassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { LoaderCircle, UserCircle, LogOut } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const [user, authLoading] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      setUserLoading(true);
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserData(userDocSnap.data() as UserData);
      }
      setUserLoading(false);
    }
    fetchUserData();
  }, [user, authLoading, router])

  async function onSubmitPassword(values: z.infer<typeof passwordFormSchema>) {
    if (!user) return;
    try {
      await updatePassword(user, values.newPassword);
      toast({
        title: "Password updated successfully!",
        description: "Your password has been changed.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: "This is a sensitive operation that may require you to sign in again. Please log out and log back in to change your password.",
      });
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    router.push('/');
  }
  
  const isLoading = authLoading || userLoading;

  if (isLoading) {
      return (
      <div className="container mx-auto flex justify-center items-center h-[calc(100vh-15rem)]">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }


  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:py-16">
      <div className="flex items-center mb-8 gap-4">
        <UserCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">My Profile</h1>
          <p className="text-muted-foreground mt-1">View your details and manage your account.</p>
        </div>
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Name</span>
              {isLoading ? <Skeleton className="h-6 w-48 mt-1" /> : <span className="font-medium">{userData?.firstName} {userData?.lastName}</span>}
            </div>
             <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Email</span>
              {isLoading ? <Skeleton className="h-6 w-64 mt-1" /> : <span className="font-medium">{userData?.email}</span>}
            </div>
             <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Phone</span>
              {isLoading ? <Skeleton className="h-6 w-32 mt-1" /> : <span className="font-medium">{userData?.phone}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your password and other account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Change Password</AccordionTrigger>
                <AccordionContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-6 pt-4">
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-0">
                <AccordionTrigger>Logout</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-4 text-sm text-muted-foreground">Click the button below to end your current session.</p>
                  <Button variant="destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

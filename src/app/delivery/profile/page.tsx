'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db, signOut } from '@/lib/firebase'
import { updatePassword } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getAssignedAreasForAgent, updateAgentCapacity } from './actions'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { LoaderCircle, UserCircle, LogOut, Package, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const capacityFormSchema = z.object({
  maxDeliveries: z.coerce.number().int().min(0, { message: "Capacity must be 0 or more" }),
});

type AgentData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  drivingLicense: string;
  photoUrl: string;
  maxDeliveries: number;
  activeOrderCount: number;
}

export default function DeliveryProfilePage() {
  const [user, authLoading] = useAuthState(auth)
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [assignedAreas, setAssignedAreas] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const capacityForm = useForm<z.infer<typeof capacityFormSchema>>({
    resolver: zodResolver(capacityFormSchema),
  })

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/delivery/login');
      return;
    }

    const fetchAreas = async () => {
        const areas = await getAssignedAreasForAgent(user.uid);
        setAssignedAreas(areas);
    }
    fetchAreas();

    const agentDocRef = doc(db, "deliveryAgents", user.uid);
    const unsubscribe = onSnapshot(agentDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as AgentData
            setAgentData(data);
            capacityForm.reset({ maxDeliveries: data.maxDeliveries });
        } else {
            toast({ variant: 'destructive', title: "Not a delivery agent" });
            router.push('/delivery/login');
        }
        setUserLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, authLoading, router, toast, capacityForm])

  async function onSubmitPassword(values: z.infer<typeof passwordFormSchema>) {
    if (!user) return;
    try {
      await updatePassword(user, values.newPassword);
      toast({ title: "Password updated successfully!", description: "Your password has been changed." });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({ variant: "destructive", title: "Error updating password", description: "This is a sensitive operation that may require you to sign in again." });
    }
  }

  async function onSubmitCapacity(values: z.infer<typeof capacityFormSchema>) {
    if (!user) return;
    const result = await updateAgentCapacity(user.uid, values.maxDeliveries);
    if (result.success) {
      toast({ title: "Capacity Updated", description: "Your maximum delivery capacity has been set." });
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  }


  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    router.push('/delivery/login');
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
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Agent Profile</h1>
          <p className="text-muted-foreground mt-1">View your details and manage your account.</p>
        </div>
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentData?.photoUrl && (
                <div className="flex justify-center">
                    <Image src={agentData.photoUrl} alt="Agent Photo" width={128} height={128} className="rounded-full object-cover" />
                </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{agentData?.firstName} {agentData?.lastName}</span>
            </div>
             <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{agentData?.email}</span>
            </div>
             <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="font-medium">{agentData?.phone}</span>
            </div>
             <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Driving License</span>
              <span className="font-medium">{agentData?.drivingLicense}</span>
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Assigned Delivery Areas</span>
              {assignedAreas.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignedAreas.map((area) => (
                    <Badge key={area} variant="secondary" className="text-base">
                      {area}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="font-medium mt-1">No areas assigned yet.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Capacity</CardTitle>
            <CardDescription>Manage your current workload and delivery limit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Active Deliveries</p>
                        <p className="text-2xl font-bold">{agentData?.activeOrderCount ?? 0} / {agentData?.maxDeliveries ?? 0}</p>
                    </div>
                </div>
            </div>
             <Form {...capacityForm}>
              <form onSubmit={capacityForm.handleSubmit(onSubmitCapacity)} className="flex items-end gap-4 mt-6">
                <FormField
                  control={capacityForm.control}
                  name="maxDeliveries"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Set Max Deliveries</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={capacityForm.formState.isSubmitting}>
                  {capacityForm.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : "Save"}
                </Button>
              </form>
            </Form>
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
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6 pt-4">
                      <FormField
                        control={passwordForm.control}
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
                        control={passwordForm.control}
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
                      <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : "Update Password"}
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
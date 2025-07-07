'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { addArea, deleteArea, getApprovedAgents, updateAreaAgents } from './actions'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, LoaderCircle, Trash2, MapPin, Users } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const formSchema = z.object({
  name: z.string().min(1, { message: "Area name is required" }),
  state: z.string().min(1, { message: "State is required" }),
  pincode: z.string().min(1, { message: "Pincode is required" }).regex(/^\d{6}$/, { message: "Pincode must be 6 digits" }),
})

type Area = {
  id: string
  name: string
  pincode: string
  state: string
  assignedAgentIds?: string[]
}

type Agent = {
    id: string;
    name: string;
}

function AgentAssignmentPopover({ area, agents, onAssign }: { area: Area, agents: Agent[], onAssign: (areaId: string, agentIds: string[]) => void }) {
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(area.assignedAgentIds || []);
    const [isOpen, setIsOpen] = useState(false);

    const handleAssign = () => {
        onAssign(area.id, selectedAgentIds);
        setIsOpen(false);
    }
    
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Agents ({area.assignedAgentIds?.length || 0})
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4">
                    <h4 className="font-medium leading-none">Assign Agents</h4>
                    <p className="text-sm text-muted-foreground">Select agents for the "{area.name}" area.</p>
                </div>
                 <ScrollArea className="h-48">
                    <div className="p-4 space-y-2">
                        {agents.map((agent) => (
                            <div key={agent.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${area.id}-${agent.id}`}
                                    checked={selectedAgentIds.includes(agent.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedAgentIds(prev => 
                                            checked ? [...prev, agent.id] : prev.filter(id => id !== agent.id)
                                        )
                                    }}
                                />
                                <label htmlFor={`${area.id}-${agent.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {agent.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <Separator />
                <div className="p-4 flex justify-end">
                     <Button onClick={handleAssign}>Save Changes</Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}


export default function ManageAreasPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [approvedAgents, setApprovedAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", state: "", pincode: "" },
  })

  useEffect(() => {
    const fetchAgents = async () => {
        const agents = await getApprovedAgents();
        setApprovedAgents(agents);
    }
    fetchAgents();

    const q = query(collection(db, 'serviceableAreas'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const areasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area))
      setAreas(areasData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching areas:", error)
      toast({ variant: 'destructive', title: "Error", description: "Could not load serviceable areas." })
      setLoading(false)
    })
    return () => unsubscribe()
  }, [toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const result = await addArea(values)
    setIsSubmitting(false)

    if (result.error) {
       toast({ variant: "destructive", title: "Uh oh! Something went wrong.", description: result.error })
    } else {
       toast({ title: "Area added successfully!" })
      form.reset();
    }
  }

  async function handleDelete(areaId: string) {
      const result = await deleteArea(areaId);
      if (result.error) {
          toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error })
      } else {
          toast({ title: 'Area Deleted', description: 'The area has been removed.' })
      }
  }

  async function handleAssignAgents(areaId: string, agentIds: string[]) {
    const result = await updateAreaAgents(areaId, agentIds);
    if (result.success) {
        toast({ title: 'Agents Assigned', description: `Agent assignments have been updated for the area.` })
    } else {
        toast({ variant: 'destructive', title: 'Assignment Failed', description: result.error })
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
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Manage Serviceable Areas</h1>
          <p className="text-muted-foreground mt-1">Add or remove areas where you deliver and assign agents.</p>
        </div>
      </div>
       <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                    <CardTitle>Add New Area</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Area Name</FormLabel><FormControl><Input placeholder="e.g., Bandra West" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="pincode" render={({ field }) => (
                                <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="400050" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Add Area"}
                            </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Areas</CardTitle>
                        <CardDescription>A list of areas where you currently deliver.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex justify-center items-center h-48">
                                <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
                             </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Area</TableHead>
                                        <TableHead>Assign Agents</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {areas.length > 0 ? areas.map(area => (
                                        <TableRow key={area.id}>
                                            <TableCell>
                                                <div className="font-medium">{area.name}</div>
                                                <div className="text-sm text-muted-foreground">{area.state}, {area.pincode}</div>
                                            </TableCell>
                                            <TableCell>
                                                <AgentAssignmentPopover area={area} agents={approvedAgents} onAssign={handleAssignAgents} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete this area. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(area.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <p className="mt-4 font-medium">No areas added yet.</p>
                                                <p className="text-muted-foreground text-sm">Use the form to add your first serviceable area.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
       </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { onSnapshot, collection, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { approveAgent, rejectAgent } from './actions'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, LoaderCircle, Users, XCircle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Agent = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  drivingLicense: string
  photoUrl: string
  status: 'pending_approval' | 'approved'
}

export default function ManageAgentsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [submitting, setSubmitting] = useState<string | null>(null) // Store agentId being processed

  useEffect(() => {
    const q = query(collection(db, 'deliveryAgents'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const agentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent))
      setAgents(agentsData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching agents:", error)
      toast({ variant: 'destructive', title: "Error", description: "Could not load delivery agents." })
      setLoading(false)
    })
    return () => unsubscribe()
  }, [toast])

  const handleApprove = async (agentId: string) => {
    setSubmitting(agentId)
    const result = await approveAgent(agentId)
    if (result.success) {
      toast({ title: "Agent Approved", description: "The agent is now active and has been notified." })
    } else {
      toast({ variant: 'destructive', title: "Approval Failed", description: result.error })
    }
    setSubmitting(null)
  }

  const handleReject = async (agentId: string) => {
    setSubmitting(agentId)
    const result = await rejectAgent(agentId)
    if (result.success) {
      toast({ title: "Agent Rejected", description: "The agent application has been removed." })
    } else {
      toast({ variant: 'destructive', title: "Rejection Failed", description: result.error })
    }
    setSubmitting(null)
  }

  const pendingAgents = agents.filter(a => a.status === 'pending_approval')
  const approvedAgents = agents.filter(a => a.status === 'approved')

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 animate-fade-in">
      <div className="flex items-center mb-8 gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Manage Delivery Agents</h1>
          <p className="text-muted-foreground mt-1">Approve or reject new agent applications.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoaderCircle className="animate-spin h-10 w-10 text-primary" />
        </div>
      ) : (
        <div className="grid gap-12">
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Pending Approvals ({pendingAgents.length})</h2>
            {pendingAgents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingAgents.map(agent => (
                  <Card key={agent.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{agent.firstName} {agent.lastName}</CardTitle>
                      <CardDescription>{agent.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                        {agent.photoUrl ? (
                          <Image src={agent.photoUrl} alt={`Photo of ${agent.firstName}`} fill className="object-cover"/>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-sm text-muted-foreground">No photo</span>
                          </div>
                        )}
                      </div>
                      <div><p className="text-sm font-medium">Phone:</p><p>{agent.phone}</p></div>
                      <div><p className="text-sm font-medium">License #:</p><p>{agent.drivingLicense}</p></div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                       <Button onClick={() => handleApprove(agent.id)} disabled={!!submitting} className="w-full">
                         {submitting === agent.id ? <LoaderCircle className="animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4"/> Approve</>}
                       </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" disabled={!!submitting} className="w-full">
                                  {submitting === agent.id ? <LoaderCircle className="animate-spin" /> : <><XCircle className="mr-2 h-4 w-4"/> Reject</>}
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the agent's application and their uploaded data. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReject(agent.id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No Pending Applications</AlertTitle>
                <AlertDescription>There are currently no new agents waiting for approval.</AlertDescription>
              </Alert>
            )}
          </section>

          <Separator />
          
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Approved Agents ({approvedAgents.length})</h2>
             {approvedAgents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {approvedAgents.map(agent => (
                    <Card key={agent.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{agent.firstName} {agent.lastName}</CardTitle>
                                <CardDescription>{agent.email}</CardDescription>
                            </div>
                            <Badge variant="outline" className="border-green-500 text-green-500">Approved</Badge>
                        </CardHeader>
                        <CardContent>
                            <div><p className="text-sm font-medium">Phone:</p><p>{agent.phone}</p></div>
                            <div className="mt-2"><p className="text-sm font-medium">License #:</p><p>{agent.drivingLicense}</p></div>
                        </CardContent>
                    </Card>
                ))}
              </div>
            ) : (
               <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No Approved Agents</AlertTitle>
                <AlertDescription>Once you approve an agent, they will appear here.</AlertDescription>
              </Alert>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

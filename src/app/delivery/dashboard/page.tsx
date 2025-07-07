'use client'

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getAssignedOrders, updateOrderStatus, AssignedOrder } from './actions';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Clock, LoaderCircle, PackageCheck, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Pending': 'secondary',
  'Out for Delivery': 'default',
  'Delivered': 'outline',
};

export default function DeliveryDashboard() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoading(false);
        return;
    };

    const fetchOrders = async () => {
        setLoading(true);
        const assignedOrders = await getAssignedOrders(user.uid);
        setOrders(assignedOrders);
        setLoading(false);
    }
    fetchOrders();
  }, [user, authLoading]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      toast({ title: 'Status Updated', description: `Order has been marked as ${newStatus}.` });
      // Refresh orders list
      if (user) {
        const assignedOrders = await getAssignedOrders(user.uid);
        setOrders(assignedOrders);
      }
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
    }
    setUpdatingOrderId(null);
  }

  if (authLoading || loading) {
    return (
        <div className="container mx-auto flex justify-center items-center h-[calc(100vh-15rem)]">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (!user) {
     return (
      <div className="container mx-auto px-4 py-12 md:py-24 text-center">
        <h1 className="text-3xl font-headline font-bold">Please Log In</h1>
        <p className="text-muted-foreground mt-4">You need to be logged in to view your delivery dashboard.</p>
        <Button asChild className="mt-6">
          <Link href="/delivery/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Delivery Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, Delivery Agent!</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Today's Schedule: {format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Truck className="h-5 w-5"/>
            Your Assigned Deliveries
          </CardTitle>
          <CardDescription>Here are the pending deliveries in your assigned areas.</CardDescription>
        </CardHeader>
        <CardContent>
            {orders.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {orders.map(order => (
                        <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <div className="text-left">
                                        <p className="font-mono text-sm">#{order.id.slice(0, 8)}...</p>
                                        <p className="text-xs text-muted-foreground">{order.deliveryInfo.city}</p>
                                    </div>
                                    <Badge variant={statusVariant[order.status] || 'secondary'}>{order.status}</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 bg-muted/50 rounded-md">
                                    <p className="font-semibold">{order.userName}</p>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {order.deliveryInfo.address}, {order.deliveryInfo.city}, {order.deliveryInfo.state} - {order.deliveryInfo.zip}
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4" />
                                        Window: {order.deliveryInfo.deliveryTime}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        {order.status === 'Pending' && (
                                            <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')} disabled={updatingOrderId === order.id}>
                                                {updatingOrderId === order.id ? <LoaderCircle className="animate-spin" /> : <Truck className="mr-2"/>} Start Delivery
                                            </Button>
                                        )}
                                        {order.status === 'Out for Delivery' && (
                                            <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'Delivered')} disabled={updatingOrderId === order.id}>
                                                {updatingOrderId === order.id ? <LoaderCircle className="animate-spin" /> : <PackageCheck className="mr-2"/>} Mark as Delivered
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <Alert>
                    <Package className="h-4 w-4" />
                    <AlertTitle>No Pending Deliveries</AlertTitle>
                    <AlertDescription>There are no deliveries assigned to you at the moment.</AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>
    </div>
  )
}

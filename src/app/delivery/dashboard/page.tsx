
'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getAssignedOrders } from './actions';
import type { AssignedOrder } from './actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, LoaderCircle, User, Search, Package, Calendar, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

export default function DeliveryDashboard() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Agent Dashboard</h1>
            <p className="text-muted-foreground mt-1">An overview of all your active orders.</p>
        </div>
        <Button asChild>
            <Link href="/delivery/daily-route">
                <Calendar className="mr-2 h-4 w-4" />
                Go to Daily Route
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Truck className="h-5 w-5"/>
                    Your Assigned Orders ({filteredOrders.length})
                </CardTitle>
                <CardDescription>
                    Here are all your active deliveries. Use the search to find a specific customer.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                    <>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by customer name..." 
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {filteredOrders.map((order) => (
                                <AccordionItem value={order.id} key={order.id} className="border rounded-lg px-4 bg-background">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex justify-between w-full pr-4">
                                            <div className="text-left">
                                                <p className="font-bold">{order.customerName}</p>
                                                <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <Badge variant={order.status === 'Out for Delivery' ? 'default' : 'secondary'}>{order.status}</Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2">
                                        <div className="space-y-4">
                                            <p><span className="font-semibold">Phone:</span> {order.customerPhone}</p>
                                            <p><span className="font-semibold">Order Date:</span> {order.createdAt}</p>
                                            <div>
                                                <h4 className="font-semibold mb-2">Items in Subscription:</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex items-center gap-4 p-2 border rounded-md">
                                                        <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover"/>
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.plan === 'weekly' ? 'Weekly Plan' : 'Monthly Plan'} x {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </>
                ) : (
                    <Alert>
                        <Package className="h-4 w-4" />
                        <AlertTitle>No Active Orders</AlertTitle>
                        <AlertDescription>You have no deliveries assigned to you at the moment.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    </div>
  )
}

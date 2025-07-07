
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { format } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoaderCircle, ListOrdered, ShoppingBag, Truck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export type Order = {
    id: string;
    status: string;
    total: number;
    createdAt: string; 
    items: any[];
    assignedAgentName?: string;
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Pending': 'secondary',
  'Out for Delivery': 'default',
  'Delivered': 'outline',
};

export default function OrdersPage() {
  const [user, authLoading] = useAuthState(auth)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userOrders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                status: data.status,
                total: data.total,
                createdAt: data.createdAt ? format(data.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A',
                items: data.items,
                assignedAgentName: data.assignedAgentName || null,
            } as Order;
        });
        setOrders(userOrders);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching orders: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (authLoading) {
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
        <p className="text-muted-foreground mt-4">You need to be logged in to view your order history.</p>
        <Button asChild className="mt-6">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center mb-8 gap-4">
            <ListOrdered className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">My Orders</h1>
                <p className="text-muted-foreground mt-1">Review your order history and check the status of current orders.</p>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>A list of all your past and present orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned Agent</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                               <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                               </TableRow>
                            ))
                        ) : orders.length > 0 ? (
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono">#{order.id.slice(0, 8)}...</TableCell>
                                    <TableCell>{order.createdAt}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[order.status] || 'secondary'}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {order.assignedAgentName ? (
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-muted-foreground" />
                                                <span>{order.assignedAgentName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Not Assigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 font-medium">No orders found.</p>
                                    <p className="text-muted-foreground text-sm">You haven't placed any orders yet.</p>
                                    <Button asChild variant="link" className="mt-1">
                                        <Link href="/#packages">Start Shopping</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}

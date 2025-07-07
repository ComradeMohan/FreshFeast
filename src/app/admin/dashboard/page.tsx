
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Package, DollarSign, PlusCircle, UserCheck, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { getShippingCharge } from "@/lib/settings";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { processUnassignedOrders } from "@/app/checkout/actions";
import { useToast } from "@/hooks/use-toast";

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Pending': 'secondary',
  'Out for Delivery': 'default',
  'Delivered': 'outline',
  'processing': 'secondary', // For legacy orders
};

type Order = {
    id: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    status: string;
    total: number;
    createdAt: any;
    deliveryInfo: {
        city: string;
    };
    assignedAgentName?: string;
}

export default function AdminDashboard() {
  const [shippingCharge, setShippingCharge] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();


  // Stats states
  const [totalRevenue, setTotalRevenue] = useState<number | string>('...');
  const [activeOrdersCount, setActiveOrdersCount] = useState<number | string>('...');
  const [deliveryAgentsCount, setDeliveryAgentsCount] = useState<number | string>('...');
  const [pendingAgentsCount, setPendingAgentsCount] = useState<number | string>('...');
  const [serviceableAreasCount, setServiceableAreasCount] = useState<number | string>('...');


  useEffect(() => {
    getShippingCharge().then(setShippingCharge);

    // Run the auto-assignment logic when an admin visits
    const runOrderAssignment = async () => {
        const result = await processUnassignedOrders();
        if (result.success && result.assignedCount && result.assignedCount > 0) {
            toast({
                title: "Orders Assigned",
                description: `${result.assignedCount} pending order(s) have been automatically assigned.`,
            });
        }
    };
    runOrderAssignment();

    // Recent Orders
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
    const unsubscribeRecent = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
      setLoading(false); // Set loading to false after first fetch
    }, (error) => {
      console.error("Error fetching recent orders:", error);
      setLoading(false);
    });

    // Active Orders Count
    const activeOrdersQuery = query(collection(db, "orders"), where("status", "in", ["Pending", "Out for Delivery"]));
    const unsubscribeActive = onSnapshot(activeOrdersQuery, (snapshot) => {
        setActiveOrdersCount(snapshot.size);
    }, (error) => {
        console.error("Error fetching active orders count:", error);
        setActiveOrdersCount(0);
    });
    
    // Total Revenue
    const deliveredOrdersQuery = query(collection(db, "orders"), where("status", "==", "Delivered"));
    const unsubscribeRevenue = onSnapshot(deliveredOrdersQuery, (snapshot) => {
        const revenue = snapshot.docs.reduce((acc, doc) => acc + doc.data().total, 0);
        setTotalRevenue(`₹${revenue.toFixed(2)}`);
    }, (error) => {
        console.error("Error fetching total revenue:", error);
        setTotalRevenue('₹0.00');
    });

    // Delivery Agents Count (Approved)
    const agentsQuery = query(collection(db, "deliveryAgents"), where("status", "==", "approved"));
    const unsubscribeAgents = onSnapshot(agentsQuery, (snapshot) => {
        setDeliveryAgentsCount(snapshot.size);
    }, (error) => {
        console.error("Error fetching delivery agents count:", error);
        setDeliveryAgentsCount(0);
    });

    // Pending Agents Count
    const pendingAgentsQuery = query(collection(db, "deliveryAgents"), where("status", "==", "pending_approval"));
    const unsubscribePending = onSnapshot(pendingAgentsQuery, (snapshot) => {
      setPendingAgentsCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching pending agents:", error);
      setPendingAgentsCount(0);
    })

    // Serviceable Areas Count
    const areasQuery = query(collection(db, "serviceableAreas"));
    const unsubscribeAreas = onSnapshot(areasQuery, (snapshot) => {
        setServiceableAreasCount(snapshot.size);
    }, (error) => {
        console.error("Error fetching serviceable areas count:", error);
        setServiceableAreasCount(0);
    });


    return () => {
      unsubscribeRecent();
      unsubscribeActive();
      unsubscribeRevenue();
      unsubscribeAgents();
      unsubscribePending();
      unsubscribeAreas();
    }
  }, [toast]);

  const stats = [
    { title: 'Total Revenue', value: totalRevenue, icon: DollarSign, href: null },
    { title: 'Active Orders', value: activeOrdersCount, icon: Package, href: null },
    { title: 'Delivery Agents', value: deliveryAgentsCount, icon: Users, href: '/admin/agents' },
    { title: 'Pending Agents', value: pendingAgentsCount, icon: UserCheck, href: '/admin/agents' },
    { title: 'Serviceable Areas', value: serviceableAreasCount, icon: MapPin, href: '/admin/areas' },
  ]

  const StatCard = ({ title, value, icon: Icon, href }: { title: string, value: number | string, icon: React.ElementType, href: string | null }) => {
    const CardComponent = (
        <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    )

    return href ? <Link href={href}>{CardComponent}</Link> : CardComponent;
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your store, packages, and deliveries.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <Button asChild>
              <Link href="/admin/areas">
                <MapPin className="mr-2 h-4 w-4" />
                Manage Areas
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/agents">
                <Users className="mr-2 h-4 w-4" />
                Manage Agents
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/add-product">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Package
              </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {stats.map(stat => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} href={stat.href} />
        ))}
      </div>

      <div className="grid gap-8">
        {shippingCharge !== null ? (
          <ShippingSettingsForm initialCharge={shippingCharge} />
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="w-full">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-20" />
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
              <CardTitle className="font-headline">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                           <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                           </TableRow>
                        ))
                      ) : orders.length > 0 ? (
                        orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono">#{order.id.slice(0, 8)}...</TableCell>
                                <TableCell>{order.userName}</TableCell>
                                <TableCell>
                                    <div>{order.userEmail}</div>
                                    <div className="text-sm text-muted-foreground">{order.userPhone}</div>
                                </TableCell>
                                <TableCell>{order.deliveryInfo?.city}</TableCell>
                                <TableCell>
                                    {order.assignedAgentName && order.status !== 'Delivered' ? (
                                        <Badge variant={statusVariant[order.status] || 'secondary'} className="font-normal">
                                            <div className="flex items-center gap-1.5">
                                                <Truck className="h-3 w-3" />
                                                <span className="truncate">{order.assignedAgentName}</span>
                                            </div>
                                        </Badge>
                                    ) : (
                                        <Badge variant={statusVariant[order.status] || 'secondary'}>{order.status}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">No recent orders.</TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

    
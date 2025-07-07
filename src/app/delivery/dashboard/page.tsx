'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getDailyRoute, markDeliveriesAsComplete } from './actions';
import type { DailyDelivery } from './actions';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Truck, Clock, LoaderCircle, Package, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function DeliveryDashboard() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoading(false);
        return;
    };

    const fetchRoute = async () => {
        setLoading(true);
        const dailyDeliveries = await getDailyRoute(user.uid);
        setDeliveries(dailyDeliveries);
        setLoading(false);
    }
    fetchRoute();
  }, [user, authLoading]);

  const handleSelect = (orderId: string, isChecked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (isChecked) {
      newSelectedRows.add(orderId);
    } else {
      newSelectedRows.delete(orderId);
    }
    setSelectedRows(newSelectedRows);
  };
  
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allPendingIds = filteredDeliveries.filter(d => d.status === 'pending').map(d => d.orderId);
      setSelectedRows(new Set(allPendingIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSaveChanges = async () => {
    if (selectedRows.size === 0) {
        toast({ variant: 'destructive', title: 'No deliveries selected', description: 'Please select deliveries to mark as complete.' });
        return;
    }

    setIsSubmitting(true);
    const deliveriesToUpdate = Array.from(selectedRows).map(orderId => ({ orderId }));
    const result = await markDeliveriesAsComplete(deliveriesToUpdate);
    
    if (result.success) {
      toast({ title: 'Deliveries Updated', description: 'The selected deliveries have been marked as complete.' });
      if (user) {
        const dailyDeliveries = await getDailyRoute(user.uid);
        setDeliveries(dailyDeliveries);
        setSelectedRows(new Set());
      }
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
    }
    setIsSubmitting(false);
  }

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery =>
      delivery.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customerAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deliveries, searchQuery]);

  const allPendingSelected = useMemo(() => {
    const pendingDeliveries = filteredDeliveries.filter(d => d.status === 'pending');
    return pendingDeliveries.length > 0 && pendingDeliveries.every(d => selectedRows.has(d.orderId));
  }, [filteredDeliveries, selectedRows]);

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
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Daily Route</h1>
            <p className="text-muted-foreground mt-1">Manage your deliveries for today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Today's Date: {format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Truck className="h-5 w-5"/>
            Today's Deliveries
          </CardTitle>
          <CardDescription>Check off deliveries as you complete them. Click "Save Changes" when you're done.</CardDescription>
        </CardHeader>
        <CardContent>
            {deliveries.length > 0 ? (
                <>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by customer or address..." 
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox 
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            checked={allPendingSelected}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Time Slot</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDeliveries.map((delivery) => (
                                    <TableRow key={delivery.orderId} data-state={selectedRows.has(delivery.orderId) && "selected"}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedRows.has(delivery.orderId) || delivery.status === 'delivered'}
                                                disabled={delivery.status === 'delivered'}
                                                onCheckedChange={(checked) => handleSelect(delivery.orderId, !!checked)}
                                                aria-label={`Select delivery for ${delivery.customerName}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{delivery.customerName}</TableCell>
                                        <TableCell className="text-muted-foreground">{delivery.customerAddress}</TableCell>
                                        <TableCell>{delivery.deliveryTime}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={delivery.status === 'delivered' ? 'outline' : 'secondary'} className={delivery.status === 'delivered' ? 'text-green-600 border-green-600' : ''}>
                                                {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSaveChanges} disabled={isSubmitting || selectedRows.size === 0}>
                            {isSubmitting && <LoaderCircle className="animate-spin mr-2"/>}
                            Save Changes ({selectedRows.size})
                        </Button>
                    </div>
                </>
            ) : (
                <Alert>
                    <Package className="h-4 w-4" />
                    <AlertTitle>No Deliveries Today</AlertTitle>
                    <AlertDescription>You have no deliveries scheduled for today. Check back tomorrow!</AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>
    </div>
  )
}

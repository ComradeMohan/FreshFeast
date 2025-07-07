'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Package, DollarSign, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { getShippingCharge } from "@/lib/settings";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { Skeleton } from "@/components/ui/skeleton";

const stats = [
  { title: 'Total Revenue', value: '₹1,24,500', icon: DollarSign },
  { title: 'Active Orders', value: '125', icon: Package },
  { title: 'Delivery Agents', value: '12', icon: Users },
]

const recentOrders = [
  { id: '#FFH12345', customer: 'John Doe', status: 'Delivered', total: '₹6,498' },
  { id: '#FFH12346', customer: 'Jane Smith', status: 'Pending', total: '₹2,999' },
  { id: '#FFH12347', customer: 'Bob Johnson', status: 'Out for Delivery', total: '₹3,999' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Pending': 'secondary',
  'Out for Delivery': 'default',
  'Delivered': 'outline',
};

export default function AdminDashboard() {
  const [shippingCharge, setShippingCharge] = useState<number | null>(null);

  useEffect(() => {
    getShippingCharge().then(setShippingCharge);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your store, packages, and deliveries.</p>
        </div>
        <Button asChild>
          <Link href="/admin/add-product">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Package
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
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
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {recentOrders.map(order => (
                          <TableRow key={order.id}>
                              <TableCell className="font-mono">{order.id}</TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>
                                  <Badge variant={statusVariant[order.status] || 'secondary'}>{order.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{order.total}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

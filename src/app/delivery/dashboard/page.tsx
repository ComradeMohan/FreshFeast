import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock } from 'lucide-react';

const deliveries = [
  { id: '#FFH67890', address: '456 Orchard Ave, Appleville', time: '10:00 AM', status: 'Pending' },
  { id: '#FFH67891', address: '789 Berry Blvd, Strawberry Fields', time: '11:30 AM', status: 'Pending' },
  { id: '#FFH67892', address: '101 Citrus Grove, Lemonwood', time: '1:00 PM', status: 'Out for Delivery' },
  { id: '#FFH67893', address: '212 Melon Way, Watermelon Creek', time: '2:45 PM', status: 'Delivered' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'Pending': 'secondary',
  'Out for Delivery': 'default',
  'Delivered': 'outline',
};

export default function DeliveryDashboard() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Delivery Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, Delivery Agent!</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Today's Schedule: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Truck className="h-5 w-5"/>
            Today's Deliveries
          </CardTitle>
          <CardDescription>Here are your assigned deliveries for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Delivery Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map(delivery => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono">{delivery.id}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground"/> 
                    {delivery.address}
                  </TableCell>
                  <TableCell>{delivery.time}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant[delivery.status] || 'secondary'}>{delivery.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

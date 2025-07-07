
'use client'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays } from 'lucide-react'
import { startOfToday } from 'date-fns'

const getProjectedDeliveryDates = (plan: 'weekly' | 'monthly'): Date[] => {
    const dates: Date[] = [];
    let currentDate = startOfToday();
    const deliveryCount = plan === 'weekly' ? 5 : 22; // ~22 weekdays in a month

    while (dates.length < deliveryCount) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};


export default function DeliverySchedulePage() {
    const weeklyDates = getProjectedDeliveryDates('weekly');
    const monthlyDates = getProjectedDeliveryDates('monthly');
    
    return (
        <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="flex items-center mb-8 gap-4">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Delivery Schedule</h1>
                    <p className="text-muted-foreground mt-1">See our delivery days. We deliver Monday to Friday.</p>
                </div>
            </div>
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Sample Delivery Calendar</CardTitle>
                    <CardDescription>Select a plan to see a sample delivery schedule for the upcoming weeks.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <Tabs defaultValue="weekly" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly Plan</TabsTrigger>
                        </TabsList>
                        <TabsContent value="weekly" className="flex justify-center pt-4">
                             <Calendar
                                mode="multiple"
                                selected={weeklyDates}
                                defaultMonth={weeklyDates[0]}
                                className="p-0"
                            />
                        </TabsContent>
                        <TabsContent value="monthly" className="flex justify-center pt-4">
                             <Calendar
                                mode="multiple"
                                selected={monthlyDates}
                                defaultMonth={monthlyDates[0]}
                                numberOfMonths={2}
                                className="p-0"
                            />
                        </TabsContent>
                    </Tabs>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                        This is a sample schedule. Your actual delivery days will be the next 5 (for a weekly package) or ~22 (for a monthly package) weekdays after your order is placed.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

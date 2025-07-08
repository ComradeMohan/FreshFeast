
'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CalendarDays, LoaderCircle, Package } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { getDeliverySchedule } from './actions'
import type { Delivery } from './actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DeliverySchedulePage() {
    const [user, authLoading] = useAuthState(auth)
    const [schedule, setSchedule] = useState<Delivery[]>([])
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchSchedule = async () => {
            setLoading(true)
            const scheduleFromServer = await getDeliverySchedule(user.uid)
            setSchedule(scheduleFromServer)
            setLoading(false)
        }

        fetchSchedule()
    }, [user, authLoading])

    const today = new Date();
    
    const convertToDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        // Using UTC to prevent timezone shifts from changing the date
        return new Date(Date.UTC(year, month - 1, day));
    };

    const pendingDays = schedule.filter(d => d.status === 'pending').map(d => convertToDate(d.date));
    const deliveredDays = schedule.filter(d => d.status === 'delivered').map(d => convertToDate(d.date));
    
    const allDeliveryDates = [...pendingDays, ...deliveredDays];
    const defaultMonth = allDeliveryDates.length > 0 ? allDeliveryDates[0] : today;

    if (authLoading || loading) {
        return (
            <div className="container mx-auto flex justify-center items-center h-[calc(100vh-15rem)]">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

     if (!user) {
        return (
        <div className="container mx-auto px-4 py-12 md:py-24 text-center animate-fade-in">
            <h1 className="text-3xl font-headline font-bold">Please Log In</h1>
            <p className="text-muted-foreground mt-4">You need to be logged in to view your delivery schedule.</p>
            <Button asChild className="mt-6">
                <Link href="/login">Login</Link>
            </Button>
        </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12 md:py-16 animate-fade-in">
            <div className="flex items-center mb-8 gap-4">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">My Delivery Schedule</h1>
                    <p className="text-muted-foreground mt-1">Your upcoming delivery days.</p>
                </div>
            </div>
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Your Upcoming Deliveries</CardTitle>
                    <CardDescription>This calendar shows the scheduled delivery dates for your active subscription.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                   {allDeliveryDates.length > 0 ? (
                     <>
                        <Calendar
                            modifiers={{ delivered: deliveredDays, pending: pendingDays }}
                            modifiersClassNames={{
                                delivered: 'day-delivered',
                                pending: 'day-pending',
                            }}
                            selected={allDeliveryDates}
                            defaultMonth={defaultMonth}
                            numberOfMonths={2}
                            className="p-0"
                            disabled={(date) => date < new Date(new Date().setUTCHours(0,0,0,0))}
                        />
                         <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2"><span className="h-4 w-4 rounded-full bg-orange-400"></span><span>Pending</span></div>
                            <div className="flex items-center space-x-2"><span className="h-4 w-4 rounded-full bg-green-500"></span><span>Delivered</span></div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                            Deliveries are made Monday to Friday. Your schedule is based on your most recent active subscription.
                        </p>
                     </>
                   ) : (
                    <Alert className="mt-4">
                        <Package className="h-4 w-4" />
                        <AlertTitle>No Active Schedule</AlertTitle>
                        <AlertDescription>
                            You don't have an active delivery schedule. Place an order to see your delivery dates here.
                             <Button asChild variant="link" className="px-1">
                                <Link href="/#packages">Browse Packages</Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                   )}
                </CardContent>
            </Card>
        </div>
    )
}

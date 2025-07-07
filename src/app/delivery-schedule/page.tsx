
'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CalendarDays, LoaderCircle, Package } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { getUpcomingDeliveryDates } from './actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DeliverySchedulePage() {
    const [user, authLoading] = useAuthState(auth)
    const [deliveryDates, setDeliveryDates] = useState<Date[]>([])
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchSchedule = async () => {
            setLoading(true)
            const datesFromServer = await getUpcomingDeliveryDates(user.uid)
            // The dates are strings, so we need to convert them back to Date objects
            // The calendar is in the user's local timezone, so we need to adjust for that.
            const dates = datesFromServer.map(d => {
                const [year, month, day] = d.split('-').map(Number);
                return new Date(year, month - 1, day);
            });
            setDeliveryDates(dates)
            setLoading(false)
        }

        fetchSchedule()
    }, [user, authLoading])

    const today = new Date();
    const defaultMonth = deliveryDates.length > 0 ? deliveryDates[0] : today;

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
            <p className="text-muted-foreground mt-4">You need to be logged in to view your delivery schedule.</p>
            <Button asChild className="mt-6">
                <Link href="/login">Login</Link>
            </Button>
        </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12 md:py-16">
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
                   {deliveryDates.length > 0 ? (
                     <>
                        <Calendar
                            mode="multiple"
                            selected={deliveryDates}
                            defaultMonth={defaultMonth}
                            numberOfMonths={2}
                            className="p-0"
                            disabled={(date) => date < new Date(today.setHours(0,0,0,0))}
                        />
                        <p className="text-sm text-muted-foreground mt-4 text-center">
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

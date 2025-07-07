'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, ShoppingCart, Bell, LogOut, UserCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, requestNotificationPermission, signOut, db } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'
import React, { useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/use-cart-bubble'
import { doc, getDoc } from 'firebase/firestore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


export function Header() {
  const [hasMounted, setHasMounted] = useState(false);
  const isMobile = useIsMobile()
  const router = useRouter()
  const [user, loading] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAgent, setIsAgent] = useState(false)
  const { toast } = useToast()
  const [showNotificationButton, setShowNotificationButton] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { cartCount } = useCart()

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        // Check for Admin
        const adminDocRef = doc(db, "users", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists() && adminDocSnap.data().role === 'admin') {
          setIsAdmin(true);
          setIsAgent(false);
          return;
        }

        // Check for Agent
        const agentDocRef = doc(db, "deliveryAgents", user.uid);
        const agentDocSnap = await getDoc(agentDocRef);
        if (agentDocSnap.exists()) {
          setIsAgent(true);
          setIsAdmin(false);
        } else {
          // Default to customer
          setIsAdmin(false);
          setIsAgent(false);
        }
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    };
    checkUserRole();
  }, [user]);

  const loggedInNavLinks = [
      { href: '/profile', label: 'Profile' },
      { href: '/orders', label: 'My Orders' },
      { href: '/#packages', label: 'Our Packages' },
  ];

  const agentNavLinks = [
    { href: '/delivery/dashboard', label: 'Dashboard' },
    { href: '/delivery/profile', label: 'Profile' },
  ];

  const adminNavLinks = [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/agents', label: 'Agents' },
      { href: '/#packages', label: 'Our Packages' },
  ];
  
  const loggedOutNavLinks = [
      { href: '/', label: 'Home' },
      { href: '/#packages', label: 'Our Packages' },
      { href: '/careers', label: 'Careers' },
  ];
  
  const currentNavLinks = hasMounted && user 
    ? (isAdmin ? adminNavLinks : (isAgent ? agentNavLinks : loggedInNavLinks))
    : loggedOutNavLinks;

  useEffect(() => {
    if (hasMounted && user && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotificationButton(true)
      } else {
        setShowNotificationButton(false)
      }
    } else {
      setShowNotificationButton(false)
    }
  }, [user, hasMounted])

  const handleEnableNotifications = async () => {
    if (!user) return
    const token = await requestNotificationPermission(user.uid)
    if (token) {
      toast({
        title: 'Notifications Enabled!',
        description: "You'll now receive order updates.",
      })
      setShowNotificationButton(false)
    } else {
      toast({
        variant: 'destructive',
        title: 'Notifications Blocked',
        description: 'Please enable notifications in your browser settings.',
      })
      setShowNotificationButton(false)
    }
  }
  
  const handleLogout = async () => {
    await signOut(auth)
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    })
    setIsSheetOpen(false) 
    router.push('/')
  }

  const renderAuthButtons = (isMobileView: boolean) => {
    if (loading) {
      return null
    }
    
    if (user) {
      const fallback = user.email ? user.email.charAt(0).toUpperCase() : 'U';
      return (
        <>
          {showNotificationButton && (
            isMobileView ? (
              <Button onClick={handleEnableNotifications} variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" /> Enable Notifications
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleEnableNotifications}>
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <span className="sr-only">Enable Notifications</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enable Notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
          {isMobileView ? (
             <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{isAgent ? 'Agent Account' : 'My Account'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={isAgent ? '/delivery/profile' : '/profile'}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )
    }

    return (
      <>
        {isMobileView ? (
          <>
            <Button asChild onClick={() => setIsSheetOpen(false)}>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" onClick={() => setIsSheetOpen(false)}>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </>
        )}
      </>
    )
  }

  if (!hasMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
              Fresh Feast Hub
            </span>
          </Link>
          <div className="flex-1" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-bold font-headline sm:inline-block">
            Fresh Feast Hub
          </span>
        </Link>
        
        {isMobile ? (
          <div className="flex-1 flex justify-end items-center gap-2">
            {!isAdmin && !isAgent && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/cart" className="relative">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  {cartCount > 0 && (
                    <span 
                        key={cartCount}
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground animate-cart-pop">
                        {cartCount}
                    </span>
                  )}
                  <span className="sr-only">Shopping Cart</span>
                </Link>
              </Button>
            )}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium mt-10">
                  {currentNavLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                  {renderAuthButtons(true)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-end gap-6">
            <nav className="flex items-center gap-6 text-sm">
              {currentNavLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              {!isAdmin && !isAgent && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/cart" className="relative">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    {cartCount > 0 && (
                      <span 
                          key={cartCount}
                          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground animate-cart-pop">
                          {cartCount}
                      </span>
                    )}
                    <span className="sr-only">Shopping Cart</span>
                  </Link>
                </Button>
              )}
              {renderAuthButtons(false)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

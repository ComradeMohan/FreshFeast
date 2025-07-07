'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, ShoppingCart } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useIsMobile } from '@/hooks/use-mobile'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#products', label: 'All Fruit Boxes' },
  { href: '/careers', label: 'Careers' },
]

export function Header() {
  const isMobile = useIsMobile()

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
          <div className="flex-1 flex justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium mt-10">
                  {navLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <>
            <nav className="flex items-center gap-6 text-sm flex-1">
              {navLinks.map(({ href, label }) => (
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
              <Button variant="ghost" size="icon" asChild>
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Shopping Cart</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

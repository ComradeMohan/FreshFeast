'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function Footer() {
  const [user] = useAuthState(auth)
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // Render a placeholder to avoid layout shift and hydration errors.
    return (
        <footer className="w-full border-t border-border/40">
            <div className="container h-24" />
        </footer>
    )
  }

  return (
    <footer className="w-full border-t border-border/40">
      <div className={cn(
        "container flex flex-col items-center gap-6 py-10 md:h-24 md:flex-row md:py-0",
        user ? "justify-center" : "justify-between"
      )}>
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo className="h-8 w-8 text-primary" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Fresh Feast Hub. All rights reserved.
          </p>
        </div>
        {!user && (
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              href="/careers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Careers
            </Link>
            <Link
              href="/admin/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
            <Link
              href="/delivery/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Delivery
            </Link>
          </nav>
        )}
      </div>
    </footer>
  )
}

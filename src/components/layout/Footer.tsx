import Link from 'next/link'
import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-6 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo className="h-8 w-8 text-primary" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Fresh Feast Hub. All rights reserved.
          </p>
        </div>
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
      </div>
    </footer>
  )
}

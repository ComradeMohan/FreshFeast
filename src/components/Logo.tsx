import { cn } from "@/lib/utils";
import * as React from "react";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M11 20A7 7 0 0 1 4 13a7 7 0 0 1 7-7h1" />
      <path d="M15 10a3 3 0 0 1-3-3" />
      <path d="M12 21a7 7 0 0 0 7-7h-1" />
      <path d="M18 11a3 3 0 0 0-3 3" />
    </svg>
  );
}

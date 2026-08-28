"use client";

import { useState } from "react";
import Link from "next/link";
import { Mosque, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const nav = [
  { href: "#features", label: "ফিচার" },
  { href: "#modules", label: "মডিউল" },
  { href: "#pricing", label: "প্রাইসিং" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md safe-top">
      <div className="container-app flex h-14 items-center justify-between sm:h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mosque className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight sm:text-xl">
            Edupro
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">লগইন</Link>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">
              ফ্রি ট্রায়াল <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border md:hidden"
            aria-label={open ? "মেনু বন্ধ" : "মেনু"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Button variant="outline" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  লগইন
                </Link>
              </Button>
              <Button asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  ফ্রি ট্রায়াল
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

"use client"

import Link from "next/link"
import { Leaf } from "lucide-react"
import { currencyOptions, type CurrencyCode } from "@/lib/currency"

type FinanceHeaderProps = {
  currency: CurrencyCode
  onCurrencyChange: (currency: CurrencyCode) => void
}

export function FinanceHeader({ currency, onCurrencyChange }: FinanceHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Goodground home" className="group flex shrink-0 items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary text-primary-foreground shadow-[0_4px_12px_-6px_var(--primary)] transition-transform group-hover:-rotate-6">
            <Leaf aria-hidden="true" />
          </span>
          <span className="text-[16px] font-semibold tracking-[-0.05em]">goodground<span className="ml-1 text-primary">.</span></span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end gap-1">
            <label className="text-[10px] font-medium leading-none text-muted-foreground" htmlFor="finance-currency">Currency</label>
            <select
              id="finance-currency"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
              className="h-8 w-[156px] shrink-0 rounded-lg border border-border bg-card px-2 text-[11px] font-semibold text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[176px]"
            >
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="hidden items-center gap-2.5 border-l border-border pl-3.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground sm:flex sm:pl-4 sm:text-xs">
            <span className="relative flex size-2 items-center justify-center">
              <span className="absolute size-2 animate-ping rounded-full bg-chart-2/40 motion-reduce:animate-none" />
              <span className="relative size-1.5 rounded-full bg-chart-2" />
            </span>
            Your money, your pace
          </div>
        </div>
      </div>
    </header>
  )
}

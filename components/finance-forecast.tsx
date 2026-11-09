"use client"

import { useMemo } from "react"
import { CalendarDays, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency as formatCurrencyValue, type CurrencyCode } from "@/lib/currency"

type ForecastCategory = {
  id: string
  name: string
  amount: number
}

type FinanceForecastProps = {
  categories: ForecastCategory[]
  monthlyIncome: number
  currency: CurrencyCode
}

const forecastColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const currentMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date())

export function FinanceForecast({ categories, monthlyIncome, currency }: FinanceForecastProps) {
  const formatMoney = (amount: number) => formatCurrencyValue(amount, currency)
  const spendingCategories = useMemo(
    () => categories
      .filter((category) => category.id !== "savings" && category.id !== "retirement" && category.amount > 0)
      .sort((first, second) => second.amount - first.amount),
    [categories],
  )
  const forecastTotal = spendingCategories.reduce((total, category) => total + category.amount, 0)
  const shareOfIncome = monthlyIncome > 0 ? (forecastTotal / monthlyIncome) * 100 : 0

  return (
    <section id="forecast" aria-labelledby="forecast-heading" className="scroll-mt-36 flex flex-col gap-5">
      <div>
        <p className="finance-eyebrow mb-3 text-[10px] font-semibold text-muted-foreground"><span className="text-primary">05</span> <span aria-hidden="true">/</span> Plan ahead</p>
        <h2 id="forecast-heading" className="text-3xl leading-[1.06] font-semibold tracking-[-0.055em] sm:text-4xl">Your monthly spending forecast.</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          See which areas are set to take the biggest share of this month&apos;s budget.
        </p>
      </div>

      <Card className="finance-card rounded-[18px] bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5" /> {currentMonth} · BASED ON YOUR PLAN
            </p>
            <CardTitle className="mt-2 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">Biggest spending areas this month</CardTitle>
          </div>
          <span aria-hidden="true" className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary sm:flex">
            <Sparkles className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="grid gap-3 rounded-2xl bg-secondary/65 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">PROJECTED MONTHLY SPENDING</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] tabular-nums">{formatMoney(forecastTotal)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {shareOfIncome.toFixed(0)}% of {formatMoney(monthlyIncome)} take-home income
            </p>
          </div>

          {spendingCategories.length > 0 ? (
            <div className="flex flex-col gap-5">
              {spendingCategories.slice(0, 5).map((category, index) => {
                const shareOfSpending = forecastTotal > 0 ? (category.amount / forecastTotal) * 100 : 0
                const color = forecastColors[index % forecastColors.length]

                return (
                  <div key={category.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{category.name}</span>
                      <span className="shrink-0 text-right tabular-nums text-muted-foreground">
                        {formatMoney(category.amount)} <span className="ml-1 text-xs">· {shareOfSpending.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`${category.name} share of projected monthly spending`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Number(shareOfSpending.toFixed(1))}
                      aria-valuetext={`${formatMoney(category.amount)}, ${shareOfSpending.toFixed(0)}% of projected monthly spending`}
                    >
                      <div className="h-full rounded-full transition-[width]" style={{ width: `${shareOfSpending}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Add monthly amounts to your spending categories above to build a forecast.
            </p>
          )}

          <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            This estimate uses your current monthly budget amounts, not actual transactions. Change a category above to refresh the forecast.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

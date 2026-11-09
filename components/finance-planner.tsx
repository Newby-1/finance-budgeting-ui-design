"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { FinanceHeader } from "@/components/finance-header"
import { FinancePots } from "@/components/finance-pots"
import { FinanceForecast } from "@/components/finance-forecast"
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
  BadgeCheck,
  CircleHelp,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency as formatCurrencyValue, getCurrencyName, getCurrencySymbol, getCurrencyUnit, type CurrencyCode } from "@/lib/currency"

type BudgetCategory = {
  id: string
  name: string
  amount: number
}

type SortOrder = "custom" | "high" | "low"

const MAX_INCOME = 10000
const categoryColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const initialCategories: BudgetCategory[] = [
  { id: "utilities", name: "Utilities", amount: 420 },
  { id: "monthly-expenses", name: "Monthly expenses", amount: 1680 },
  { id: "savings", name: "Savings", amount: 840 },
  { id: "retirement", name: "Retirement", amount: 840 },
  { id: "personal", name: "Personal & fun", amount: 420 },
]

function amountFromInput(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export function FinancePlanner({ initialCurrency }: { initialCurrency: CurrencyCode }) {
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency)
  const [income, setIncome] = useState(4200)
  const [categories, setCategories] = useState(initialCategories)
  const [sortOrder, setSortOrder] = useState<SortOrder>("custom")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [activeSection, setActiveSection] = useState("income")

  function updateCurrency(nextCurrency: CurrencyCode) {
    setCurrency(nextCurrency)
    const secureAttribute = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `finance-currency=${nextCurrency}; Path=/; Max-Age=31536000; SameSite=Lax${secureAttribute}`
  }

  const formatMoney = (amount: number, cents = false) => formatCurrencyValue(amount, currency, cents)
  const allocated = categories.reduce((sum, category) => sum + category.amount, 0)
  const unassigned = income - allocated

  const visibleCategories = useMemo(() => {
    if (sortOrder === "custom") return categories
    return [...categories].sort((a, b) =>
      sortOrder === "high" ? b.amount - a.amount : a.amount - b.amount
    )
  }, [categories, sortOrder])

  useEffect(() => {
    const sectionIds = ["income", "budget", "pots", "overview", "forecast"]

    function updateActiveSection() {
      const readingLine = window.scrollY + 180
      let nextActiveSection = sectionIds[0]

      for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId)
        if (section && section.getBoundingClientRect().top + window.scrollY <= readingLine) {
          nextActiveSection = sectionId
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        nextActiveSection = sectionIds[sectionIds.length - 1]
      }

      setActiveSection(nextActiveSection)
    }

    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)
    return () => {
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [])

  const sectionLinkClass = (sectionId: string) => `shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeSection === sectionId ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`

  const chartData = useMemo(() => {
    const slices = categories
      .map((category, index) => ({
        id: category.id,
        name: category.name,
        amount: category.amount,
        fill: categoryColors[index % categoryColors.length],
      }))
      .filter((category) => category.amount > 0)

    if (unassigned > 0) {
      slices.push({
        id: "unassigned",
        name: "Not assigned yet",
        amount: unassigned,
        fill: "var(--chart-6)",
      })
    }
    return slices
  }, [categories, unassigned])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = Object.fromEntries(
      categories.map((category, index) => [
        category.id,
        {
          label: category.name,
          color: categoryColors[index % categoryColors.length],
        },
      ])
    )
    config.unassigned = { label: "Not assigned yet", color: "var(--chart-6)" }
    return config
  }, [categories])

  function rebalanceCategories(totalAvailable: number) {
    setCategories((current) => {
      const totalAllocated = current.reduce((sum, category) => sum + category.amount, 0)
      if (totalAllocated <= totalAvailable || totalAllocated === 0) return current

      const ratio = totalAvailable / totalAllocated
      return current.map((category) => ({
        ...category,
        amount: Math.floor(category.amount * ratio * 100 + 1e-8) / 100,
      }))
    })
  }

  function updateCategoryAmount(id: string, amount: number) {
    setCategories((current) => {
      const otherAllocations = current.reduce(
        (sum, category) => sum + (category.id === id ? 0 : category.amount),
        0,
      )
      const availableForCategory = Math.max(income - otherAllocations, 0)
      const cappedAmount = Math.min(Math.max(amount, 0), availableForCategory)
      return current.map((category) =>
        category.id === id ? { ...category, amount: cappedAmount } : category,
      )
    })
  }

  function addCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setCategories((current) => [
      ...current,
      { id: `custom-${Date.now()}`, name, amount: 0 },
    ])
    setNewCategoryName("")
    setIsAddingCategory(false)
  }

  function removeCategory(id: string) {
    setCategories((current) => current.filter((category) => category.id !== id))
  }

  return (
    <div className="finance-shell min-h-screen text-foreground">
      <FinanceHeader currency={currency} onCurrencyChange={updateCurrency} />

      <main id="home" className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-7 sm:gap-8 sm:px-8 sm:py-9">
        <section className="flex flex-col items-center border-b border-border/70 px-1 pb-8 pt-3 text-center sm:pb-10 sm:pt-7">
          <p className="finance-eyebrow mb-4 flex items-center gap-2.5 text-[10px] font-semibold text-primary sm:text-[11px]">
            <span className="h-px w-7 bg-primary/60" aria-hidden="true" /> A calmer way to budget <span className="h-px w-7 bg-primary/60" aria-hidden="true" />
          </p>
          <h1 className="finance-display max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] font-normal tracking-[-0.055em] text-foreground">
            Give your money <span className="text-primary italic">a little direction.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-[15px] sm:leading-7">
            Start with what comes in, then make a plan that feels like yours. Change any number as life changes.
          </p>
          <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/75 px-3.5 py-2 shadow-sm">
            <WalletCards aria-hidden="true" className="size-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Your monthly plan</span>
            <span aria-hidden="true" className="text-border">/</span>
            <span className="text-xs font-semibold">October 2026</span>
          </div>
        </section>

        <nav aria-label="Budget plan sections" className="sticky top-[68px] z-10 -mx-5 border-b border-border/70 bg-background px-5 sm:-mx-8 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <a href="#income" aria-current={activeSection === "income" ? "location" : undefined} className={sectionLinkClass("income")}>01 <span className="ml-1.5">Income</span></a>
            <a href="#budget" aria-current={activeSection === "budget" ? "location" : undefined} className={sectionLinkClass("budget")}>02 <span className="ml-1.5">Budget</span></a>
            <a href="#pots" aria-current={activeSection === "pots" ? "location" : undefined} className={sectionLinkClass("pots")}>03 <span className="ml-1.5">Savings</span></a>
            <a href="#overview" aria-current={activeSection === "overview" ? "location" : undefined} className={sectionLinkClass("overview")}>04 <span className="ml-1.5">Tips</span></a>
            <a href="#forecast" aria-current={activeSection === "forecast" ? "location" : undefined} className={sectionLinkClass("forecast")}>05 <span className="ml-1.5">Forecast</span></a>
          </div>
        </nav>

        <div className="flex flex-col gap-4">
        <section id="income" aria-labelledby="income-heading" className="scroll-mt-36 grid gap-4 md:grid-cols-2">
          <Card className="finance-card rounded-[18px] bg-card">
            <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
              <div>
                <p className="finance-eyebrow inline-flex items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="text-primary">01</span><span className="h-px w-5 bg-border" aria-hidden="true" /> Income</p>
                <CardTitle id="income-heading" className="mt-2 text-xl font-medium tracking-[-0.035em] sm:text-[22px]">Monthly take-home income</CardTitle>
              </div>
              <span className="hidden rounded-full border border-primary/10 bg-secondary/80 p-2.5 text-primary sm:inline-flex">
                <WalletCards aria-hidden="true" className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 pb-5 sm:px-7 sm:pb-6">
              <IncomeInput
                inputId="monthly-income"
                label="Monthly take-home"
                currency={currency}
                value={income}
                onAmountChange={setIncome}
                onBlur={() => { if (income > 0) rebalanceCategories(income) }}
              />
              <div
                className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 ${unassigned < -0.005 ? "bg-destructive/10" : "bg-secondary/65"}`}
                aria-live="polite"
              >
                <div>
                  <p className="text-sm font-medium">{income <= 0 ? "Add your monthly income" : unassigned < -0.005 ? "Budget over income" : "Leftover income"}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {income <= 0
                      ? "Enter your take-home pay after tax to make this breakdown useful. Your budget categories are kept as-is for now."
                      : unassigned < -0.005
                        ? "Adjust your budget categories to bring them within your take-home income."
                        : "Income not yet assigned to a monthly budget category."}
                  </p>
                </div>
                <p className={`shrink-0 text-lg font-semibold tabular-nums ${unassigned < -0.005 ? "text-destructive" : "text-primary"}`}>
                  {unassigned < -0.005 ? "−" : ""}{formatMoney(Math.abs(unassigned))}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="finance-feature-card relative isolate overflow-hidden rounded-[18px] bg-primary text-primary-foreground">
            <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
              <p className="text-[10px] font-medium tracking-[0.13em] text-primary-foreground/70 uppercase">A quick snapshot</p>
              <CardTitle className="mt-2 text-lg font-semibold tracking-[-0.035em]">You&apos;re building a baseline.</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
              <p className="text-xs leading-5 text-primary-foreground/80">A budget isn&apos;t a test. It&apos;s a flexible plan for the next version of your life.</p>
              <div className="flex items-end justify-between gap-3 border-t border-primary-foreground/20 pt-3">
                <div>
                  <p className="text-[11px] text-primary-foreground/70">Planned from monthly income</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] tabular-nums">{formatMoney(allocated)}</p>
                </div>
                <div aria-hidden="true" className="flex items-end gap-1 pb-1 opacity-85">
                  {[28, 42, 35, 55, 48, 70, 62, 86].map((height, index) => (
                    <span key={index} className="w-2 rounded-full bg-chart-4" style={{ height: `${height * 0.45}px` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="budget" aria-labelledby="budget-heading" className="scroll-mt-36 grid items-start gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Card className="finance-card rounded-[18px] bg-card lg:sticky lg:top-[124px] lg:self-start">
            <CardHeader className="px-5 pt-3 sm:px-7 sm:pt-4">
              <p className="finance-eyebrow text-[10px] font-semibold text-muted-foreground"><span className="text-primary">02</span> <span aria-hidden="true">/</span> Your plan at a glance</p>
              <CardTitle className="mt-1 text-lg font-semibold tracking-[-0.035em]">See where it all goes</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Your budget split updates as you make a plan below.</p>
            </CardHeader>
            <CardContent className="px-5 pb-3 sm:px-7 sm:pb-4">
              <div className="flex flex-col items-center">
                <div className="relative mx-auto h-[180px] w-full max-w-[260px]">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <PieChart accessibilityLayer>
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} />} />
                      <Pie
                        data={chartData}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={chartData.length > 1 ? 3 : 0}
                        strokeWidth={0}
                      >
                        {chartData.map((slice) => <Cell key={slice.id} fill={slice.fill} />)}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-medium text-muted-foreground">{unassigned < -0.005 ? "Planned" : "Monthly income"}</span>
                    <span className="mt-1 text-2xl font-semibold tracking-[-0.05em] tabular-nums">{formatMoney(unassigned < -0.005 ? allocated : income)}</span>
                  </div>
                </div>
                <div role="region" aria-label="Budget category breakdown" tabIndex={0} className="mt-2 flex h-[132px] w-full flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                  {chartData.map((slice) => (
                    <div key={slice.id} className="flex shrink-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} aria-hidden="true" />
                        <span className="truncate text-sm text-muted-foreground">{slice.name}</span>
                      </div>
                      <div className="flex shrink-0 items-baseline gap-2">
                        <span className="text-sm font-medium tabular-nums">{formatMoney(slice.amount)}</span>
                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{income > 0 ? `${((slice.amount / income) * 100).toFixed(1)}%` : "0.0%"}</span>
                      </div>
                    </div>
                  ))}
                  {chartData.length === 0 && <p className="text-sm text-muted-foreground">Add a budget amount to see your income split.</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="finance-card rounded-[18px] bg-card">
            <CardHeader className="gap-4 px-5 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:pt-7">
              <div>
                <p className="finance-eyebrow text-[10px] font-semibold text-muted-foreground"><span className="text-primary">02</span> <span aria-hidden="true">/</span> Make it yours</p>
                <CardTitle id="budget-heading" className="mt-2 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">Plan your monthly budget</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Allocate up to 100% of this month&apos;s take-home income.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="sort-categories">Sort budget categories</label>
                <span className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-muted-foreground">
                  {sortOrder === "high" ? <ArrowDownWideNarrow aria-hidden="true" className="size-4" /> : sortOrder === "low" ? <ArrowUpWideNarrow aria-hidden="true" className="size-4" /> : <ArrowUpDown aria-hidden="true" className="size-4" />}
                  <select
                    id="sort-categories"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                    className="max-w-[148px] cursor-pointer bg-transparent text-xs font-medium text-foreground outline-none"
                  >
                    <option value="custom">Custom order</option>
                    <option value="high">Amount: high to low</option>
                    <option value="low">Amount: low to high</option>
                  </select>
                </span>
                {!isAddingCategory && (
                  <Button variant="outline" size="sm" className="h-9 rounded-lg px-3" onClick={() => setIsAddingCategory(true)}>
                    <Plus data-icon="inline-start" /> Add category
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-7 sm:pb-7">
              <div className="mb-4 hidden grid-cols-[minmax(0,1fr)_minmax(190px,250px)_52px_38px] gap-4 px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:grid">
                <span>Budget category</span><span>Monthly amount</span><span className="text-right">Percent</span><span className="sr-only">Actions</span>
              </div>
              <div role="region" aria-label="Budget categories" tabIndex={0} className="flex h-[480px] flex-col gap-2 overflow-y-auto overscroll-contain pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                {visibleCategories.map((category) => {
                  const originalIndex = categories.findIndex((item) => item.id === category.id)
                  const categoryPercent = income > 0 ? (category.amount / income) * 100 : 0
                  const categoryLimit = Math.max(income - (allocated - category.amount), 0)
                  return (
                    <div key={category.id} className="grid grid-cols-1 items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(190px,250px)_52px_38px] sm:gap-4 sm:px-4">
                      <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[originalIndex % categoryColors.length] }} aria-hidden="true" />
                          <span className="truncate text-sm font-medium">{category.name}</span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground sm:hidden">{categoryPercent.toFixed(1)}%</span>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2">
                        <label className="relative flex h-10 min-w-0 items-center rounded-xl border border-input bg-card px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
                          <span className="mr-1 text-sm text-muted-foreground">{getCurrencySymbol(currency)}</span>
                          <input
                            type="number"
                            min="0"
                            max={categoryLimit}
                            step="0.01"
                            inputMode="decimal"
                            aria-label={`${category.name} monthly budget in ${getCurrencyName(currency)}`}
                            value={category.amount}
                            onChange={(event) => updateCategoryAmount(category.id, amountFromInput(event.target.value))}
                            className="min-w-0 w-full bg-transparent text-right text-sm font-medium tabular-nums outline-none"
                          />
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(categoryLimit, 0.01)}
                          step="0.01"
                          value={Math.min(category.amount, Math.max(categoryLimit, 0.01))}
                          aria-label={`${category.name} budget slider, adjustable in one cent increments`}
                          aria-valuetext={`${formatMoney(category.amount, true)} for ${category.name}; ${formatMoney(categoryLimit, true)} available`}
                          onChange={(event) => updateCategoryAmount(category.id, Number(event.target.value))}
                          disabled={categoryLimit <= 0}
                          style={{ "--range-progress": `${Math.min((category.amount / Math.max(categoryLimit, 0.01)) * 100, 100)}%` } as CSSProperties}
                          className="income-range w-full"
                        />
                      </div>
                      <span className="hidden text-right text-sm font-semibold tabular-nums text-foreground sm:block">{categoryPercent.toFixed(1)}%</span>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${category.name} category`}
                          onClick={() => removeCategory(category.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {isAddingCategory && (
                <form
                  className="mt-3 flex flex-col gap-2 rounded-2xl border border-dashed border-primary/35 bg-secondary/45 p-3 sm:flex-row sm:items-center"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addCategory()
                  }}
                >
                  <label className="sr-only" htmlFor="new-category">New budget category name</label>
                  <input
                    id="new-category"
                    autoFocus
                    maxLength={36}
                    placeholder="For example, learning or travel"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-10 rounded-xl px-4" disabled={!newCategoryName.trim()}>
                      <Plus data-icon="inline-start" /> Add
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-10 rounded-xl px-3" onClick={() => { setIsAddingCategory(false); setNewCategoryName("") }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className={`mt-4 flex flex-col gap-3 rounded-2xl px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${unassigned < -0.005 ? "bg-destructive/10" : "bg-secondary/65"}`} aria-live="polite">
                <div className="flex items-start gap-2.5">
                  {unassigned < -0.005 ? <CircleHelp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" /> : <BadgeCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />}
                  <div>
                    <p className="text-sm font-medium">{unassigned < -0.005 ? "Your plan is above this month&apos;s income" : unassigned <= 0.005 ? `Every ${getCurrencyUnit(currency)} has a direction` : "A little left to assign"}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {unassigned < -0.005 ? "Lower one or two categories to bring your plan within this month&apos;s income." : unassigned <= 0.005 ? "Nice work. You can still adjust any category whenever you need." : "You can assign the remaining monthly income to a category whenever you need."}
                    </p>
                  </div>
                </div>
                <p className={`shrink-0 text-lg font-semibold tabular-nums ${unassigned < -0.005 ? "text-destructive" : "text-primary"}`}>
                  {unassigned < -0.005 ? "−" : ""}{formatMoney(Math.abs(unassigned))}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{unassigned < -0.005 ? "over" : "unassigned"}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
        </div>

          <FinancePots currency={currency} />

        <section id="overview" aria-labelledby="tips-heading" className="scroll-mt-36">
          <Card className="rounded-[24px] border-0 bg-accent/80 shadow-[0_14px_40px_-28px_oklch(0.24_0.04_150/0.2)]">
            <CardHeader className="px-5 pt-5 sm:px-7 sm:pt-7">
              <span className="mb-1 flex size-9 items-center justify-center rounded-xl bg-card text-primary"><Sparkles aria-hidden="true" className="size-4" /></span>
              <CardTitle id="tips-heading" className="mt-2 text-xl font-semibold tracking-[-0.035em]">New to budgeting? Start simple.</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 pb-5 sm:px-7 sm:pb-7">
              <p className="text-sm leading-6 text-muted-foreground">
                Cover the essentials first, build a little emergency savings over time, and give future-you something too. Your first plan doesn&apos;t need to be perfect.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-card/85 p-3">
                  <p className="text-xs text-muted-foreground">Needs</p>
                  <p className="mt-1 text-sm font-semibold">Essentials</p>
                </div>
                <div className="rounded-xl bg-card/85 p-3">
                  <p className="text-xs text-muted-foreground">Future you</p>
                  <p className="mt-1 text-sm font-semibold">Save & invest</p>
                </div>
                <div className="rounded-xl bg-card/85 p-3">
                  <p className="text-xs text-muted-foreground">Right now</p>
                  <p className="mt-1 text-sm font-semibold">Some fun</p>
                </div>
              </div>
              <p className="flex items-start gap-2 border-t border-foreground/10 pt-4 text-xs leading-5 text-muted-foreground">
                <CircleHelp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                This is a learning tool, not personalized financial advice. Small, repeatable steps count.
              </p>
            </CardContent>
          </Card>
        </section>

          <FinanceForecast categories={categories} monthlyIncome={income} currency={currency} />

        <footer className="flex items-center justify-center gap-2 pb-2 text-xs text-muted-foreground">
          <Minus aria-hidden="true" className="size-3" /> One monthly plan, shaped around you <Minus aria-hidden="true" className="size-3" />
        </footer>
      </main>
    </div>
  )
}

type IncomeInputProps = {
  inputId: string
  label: string
  currency: CurrencyCode
  value: number
  onAmountChange: (value: number) => void
  onBlur: () => void
}

function IncomeInput({ inputId, label, currency, value, onAmountChange, onBlur }: IncomeInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="finance-eyebrow text-[10px] font-semibold text-muted-foreground" htmlFor={inputId}>{label} in {getCurrencyName(currency)}</label>
      <label className="flex h-[58px] items-center rounded-xl border border-border/80 bg-background/75 px-4 transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-4 focus-within:ring-ring/10">
        <span aria-hidden="true" className="mr-2 font-serif text-2xl text-primary/70">{getCurrencySymbol(currency)}</span>
        <input
          id={inputId}
          type="number"
          min="0"
          max={MAX_INCOME}
          step="0.01"
          inputMode="decimal"
          aria-label={`${label} in ${getCurrencyName(currency)}`}
          aria-describedby={`${inputId}-hint`}
          value={value}
          onChange={(event) => onAmountChange(Math.min(amountFromInput(event.target.value), MAX_INCOME))}
          onBlur={onBlur}
          className="min-w-0 w-full bg-transparent text-[26px] leading-none font-semibold tracking-[-0.045em] tabular-nums outline-none"
        />
        <span className="ml-3 shrink-0 border-l border-border pl-3 text-[10px] font-medium tracking-wide text-muted-foreground">{currency} / MONTH</span>
      </label>
      <p id={`${inputId}-hint`} className="text-xs leading-5 text-muted-foreground" aria-live={value === 0 ? "polite" : undefined}>
        {value === 0
          ? "No income entered yet. Add your monthly take-home pay after tax to see a more useful breakdown."
          : `Enter your take-home pay after tax, for example ${getCurrencySymbol(currency)}4,200. Amounts are displayed in ${getCurrencyName(currency)}; no exchange-rate conversion is applied.`}
      </p>
    </div>
  )
}


"use client"

import { useMemo, useState, type FormEvent } from "react"
import { PiggyBank, Plus, Target, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency as formatCurrencyValue, getCurrencySymbol, type CurrencyCode } from "@/lib/currency"

type Pot = {
  id: string
  name: string
  balance: number
  target: number
}

const startingPots: Pot[] = [
  { id: "emergency", name: "Savings", balance: 1850, target: 5000 },
  { id: "retirement", name: "Retirement", balance: 6400, target: 12000 },
]

const potColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

function parseAmount(value: string) {
  const amount = Number.parseFloat(value)
  return Number.isFinite(amount) ? Math.max(0, amount) : 0
}

export function FinancePots({ currency }: { currency: CurrencyCode }) {
  const [pots, setPots] = useState(startingPots)
  const [isAddingPot, setIsAddingPot] = useState(false)
  const [potName, setPotName] = useState("")
  const [potTarget, setPotTarget] = useState("")
  const [potBalance, setPotBalance] = useState("0")
  const [activeContributionId, setActiveContributionId] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [activeGoalEditId, setActiveGoalEditId] = useState<string | null>(null)
  const [goalTarget, setGoalTarget] = useState("")

  const formatMoney = (amount: number) => formatCurrencyValue(amount, currency)
  const totals = useMemo(
    () => pots.reduce((result, pot) => ({ balance: result.balance + pot.balance, target: result.target + pot.target }), { balance: 0, target: 0 }),
    [pots],
  )

  function addPot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = potName.trim()
    const target = parseAmount(potTarget)
    if (!name || target <= 0) return

    setPots((current) => [
      ...current,
      {
        id: `pot-${Date.now()}`,
        name,
        balance: parseAmount(potBalance),
        target,
      },
    ])
    setPotName("")
    setPotTarget("")
    setPotBalance("0")
    setIsAddingPot(false)
  }

  function addContribution(event: FormEvent<HTMLFormElement>, potId: string) {
    event.preventDefault()
    const amount = parseAmount(contributionAmount)
    if (amount <= 0) return

    setPots((current) => current.map((pot) => pot.id === potId ? { ...pot, balance: pot.balance + amount } : pot))
    setContributionAmount("")
    setActiveContributionId(null)
  }

  function updateGoalTarget(event: FormEvent<HTMLFormElement>, potId: string) {
    event.preventDefault()
    const target = parseAmount(goalTarget)
    if (target <= 0) return

    setPots((current) => current.map((pot) => pot.id === potId ? { ...pot, target } : pot))
    setGoalTarget("")
    setActiveGoalEditId(null)
  }

  return (
    <section id="pots" aria-labelledby="pots-heading" className="scroll-mt-36 flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="finance-eyebrow mb-3 text-[10px] font-semibold text-muted-foreground"><span className="text-primary">03</span> <span aria-hidden="true">/</span> Separate savings &amp; retirement goals</p>
          <h2 id="pots-heading" className="text-3xl leading-[1.06] font-semibold tracking-[-0.055em] sm:text-4xl">Make room for what matters.</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            Set or change a target for savings, retirement, or a pot of your own. These goals are separate from your monthly budget and don&apos;t appear in “Biggest spending areas this month.”
          </p>
        </div>
        {!isAddingPot && (
          <Button className="w-fit rounded-xl" onClick={() => setIsAddingPot(true)}>
            <Plus data-icon="inline-start" /> Create a pot
          </Button>
        )}
      </div>

      <Card className="rounded-[24px] border-0 bg-accent/75 shadow-[0_14px_40px_-28px_oklch(0.24_0.04_150/0.2)]">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
              <PiggyBank aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Your pots at a glance</p>
              <p className="text-xs text-muted-foreground">Across {pots.length} {pots.length === 1 ? "goal" : "goals"}</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 sm:justify-end">
            <span className="text-xl font-semibold tracking-[-0.04em] tabular-nums">{formatMoney(totals.balance)}</span>
            <span className="text-sm text-muted-foreground">of {formatMoney(totals.target)} saved</span>
          </div>
        </CardContent>
      </Card>

      {isAddingPot && (
        <Card className="rounded-[24px] border border-dashed border-primary/35 bg-secondary/35 shadow-none">
          <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-lg tracking-[-0.03em]">Create a new pot</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <form onSubmit={addPot} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-pot-name" className="text-xs font-medium text-muted-foreground">Pot name</label>
                <input
                  id="new-pot-name"
                  autoFocus
                  required
                  maxLength={36}
                  placeholder="For example, a weekend away"
                  value={potName}
                  onChange={(event) => setPotName(event.target.value)}
                  className="h-10 min-w-0 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-pot-target" className="text-xs font-medium text-muted-foreground">Savings target</label>
                <div className="flex h-10 items-center rounded-xl border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring/30">
                  <span className="mr-1 text-sm text-muted-foreground">{getCurrencySymbol(currency)}</span>
                  <input
                    id="new-pot-target"
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="2,000"
                    value={potTarget}
                    onChange={(event) => setPotTarget(event.target.value)}
                    className="min-w-0 w-full bg-transparent text-right text-sm tabular-nums outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-pot-balance" className="text-xs font-medium text-muted-foreground">Already saved <span className="font-normal">(optional)</span></label>
                <div className="flex h-10 items-center rounded-xl border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring/30">
                  <span className="mr-1 text-sm text-muted-foreground">{getCurrencySymbol(currency)}</span>
                  <input
                    id="new-pot-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={potBalance}
                    onChange={(event) => setPotBalance(event.target.value)}
                    className="min-w-0 w-full bg-transparent text-right text-sm tabular-nums outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                <Button type="submit" className="h-10 flex-1 rounded-xl lg:flex-none"><Plus data-icon="inline-start" /> Add pot</Button>
                <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={() => { setIsAddingPot(false); setPotName(""); setPotTarget(""); setPotBalance("0") }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pots.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pots.map((pot, index) => {
            const progress = pot.target > 0 ? Math.min((pot.balance / pot.target) * 100, 100) : 0
            const isContributing = activeContributionId === pot.id
            return (
              <Card key={pot.id} className="finance-card rounded-[18px] bg-card">
                <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary" style={{ color: potColors[index % potColors.length] }}>
                      <Target aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base font-semibold tracking-[-0.02em]">{pot.name}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{progress >= 100 ? "Goal reached" : `${Math.round(progress)}% of your goal`}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${pot.name} pot`}
                    onClick={() => setPots((current) => current.filter((item) => item.id !== pot.id))}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-5 pb-5 sm:px-6 sm:pb-6">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold tracking-[-0.05em] tabular-nums">{formatMoney(pot.balance)}</p>
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="pb-0.5 text-xs text-muted-foreground">of {formatMoney(pot.target)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg px-2 text-xs"
                        aria-label={`Edit ${pot.name} goal target`}
                        onClick={() => {
                          setActiveGoalEditId(pot.id)
                          setGoalTarget(String(pot.target))
                        }}
                      >
                        Edit goal
                      </Button>
                    </div>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${pot.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    aria-valuetext={`${formatMoney(pot.balance)} saved toward ${formatMoney(pot.target)}`}
                  >
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${progress}%`, backgroundColor: potColors[index % potColors.length] }} />
                  </div>
                  {activeGoalEditId === pot.id && (
                    <form
                      onSubmit={(event) => updateGoalTarget(event, pot.id)}
                      className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 p-3"
                    >
                      <label htmlFor={`pot-goal-target-${pot.id}`} className="text-xs font-medium text-muted-foreground">
                        New target for {pot.name}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/30">
                          <span className="mr-1 text-sm text-muted-foreground">{getCurrencySymbol(currency)}</span>
                          <input
                            id={`pot-goal-target-${pot.id}`}
                            autoFocus
                            required
                            min="0.01"
                            step="0.01"
                            type="number"
                            inputMode="decimal"
                            value={goalTarget}
                            onChange={(event) => setGoalTarget(event.target.value)}
                            className="min-w-0 w-full bg-transparent text-right text-sm tabular-nums outline-none"
                          />
                        </div>
                        <Button type="submit" size="sm" className="h-9 rounded-lg">Save goal</Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-lg"
                          onClick={() => { setActiveGoalEditId(null); setGoalTarget("") }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                  {isContributing ? (
                    <form onSubmit={(event) => addContribution(event, pot.id)} className="flex gap-2">
                      <label className="flex h-9 min-w-0 flex-1 items-center rounded-xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/30">
                        <span className="mr-1 text-sm text-muted-foreground">{getCurrencySymbol(currency)}</span>
                        <input
                          autoFocus
                          required
                          min="0.01"
                          step="0.01"
                          type="number"
                          inputMode="decimal"
                          aria-label={`Amount to add to ${pot.name}`}
                          placeholder="Amount to add"
                          value={contributionAmount}
                          onChange={(event) => setContributionAmount(event.target.value)}
                          className="min-w-0 w-full bg-transparent text-right text-sm tabular-nums outline-none"
                        />
                      </label>
                      <Button type="submit" size="sm" className="h-9 rounded-xl">Add</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl px-2" onClick={() => { setActiveContributionId(null); setContributionAmount("") }}>Cancel</Button>
                    </form>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-full rounded-xl"
                      onClick={() => { setActiveContributionId(pot.id); setContributionAmount("") }}
                    >
                      <Plus data-icon="inline-start" /> Add money
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="rounded-[24px] border-dashed bg-card shadow-none">
          <CardContent className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <Target aria-hidden="true" className="size-6 text-primary" />
            <p className="text-sm font-semibold">Your next goal starts with a pot.</p>
            <p className="text-sm text-muted-foreground">Create one to give your savings somewhere to go.</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs leading-5 text-muted-foreground">Example balances for planning only. Adding money updates this on-page demo; it doesn&apos;t move funds between accounts.</p>
    </section>
  )
}

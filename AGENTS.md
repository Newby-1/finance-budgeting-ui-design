# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack

- **Next.js 16** (App Router, RSC) · **React 19** · **TypeScript 5.7** (strict)
- **Tailwind CSS v4** (config-less — no `tailwind.config.ts`; theme lives in [`app/globals.css`](app/globals.css) via `@theme inline`)
- **shadcn/ui** style `base-nova` with `@/components/ui` alias; add components via `pnpm dlx shadcn add <component>`
- Package manager: **pnpm** (`packageManager: pnpm@12.3.4`)

## Commands

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm start    # start production server
```

No lint, test, or typecheck scripts are defined. `next build` skips TypeScript errors (`ignoreBuildErrors: true` in [`next.config.mjs`](next.config.mjs)).

## Environment

`GOOGLE_GENERATIVE_AI_API_KEY` is required in `.env.local` — used by [`app/api/chat/route.ts`](app/api/chat/route.ts) to call Gemini (`gemini-flash-latest` model). The API route retries up to 3 times with a 1 s delay on failure.

## Architecture

- [`app/page.tsx`](app/page.tsx) — Server Component; reads `finance-currency` cookie and passes initial `CurrencyCode` to `<FinancePlanner>`.
- [`components/finance-planner.tsx`](components/finance-planner.tsx) — top-level client component owning all budget state (income, categories, sort order). Currency preference is persisted client-side via `document.cookie`, not via an API route.
- [`components/ChatBot.tsx`](components/ChatBot.tsx) — always-rendered in [`app/layout.tsx`](app/layout.tsx) via a default export (the only default export in `components/`; all other components use named exports).
- [`lib/currency.ts`](lib/currency.ts) — the single source of truth for `CurrencyCode` (`"USD" | "GBP" | "EUR"`). Use `formatCurrency`, `getCurrencySymbol`, `getCurrencyName`, `getCurrencyUnit`, and `isCurrencyCode` from here — never use `Intl` directly.

## Critical Patterns

- **Tailwind v4 CSS variables**: All design tokens are CSS custom properties defined in [`app/globals.css`](app/globals.css) under `:root` using `oklch()`. Reference them with `var(--token)` in inline styles or CSS, and `bg-primary`, `text-foreground`, etc. in Tailwind classes. Do **not** use hardcoded colour values.
- **Chart colours** cycle through `--chart-1` … `--chart-6`; `--chart-6` is reserved for the "unassigned" budget slice. Always use `var(--chart-N)` inline style, not Tailwind colour utilities, because chart fill values are dynamic.
- **Custom CSS classes** in `globals.css`: `.finance-card`, `.finance-feature-card`, `.finance-shell`, `.finance-display`, `.finance-eyebrow`, `.budget-line`, `.income-range`. Use these on matching elements rather than recreating the styles.
- **`@/*` path alias** maps to the project root (not `src/`). Imports use `@/components/…`, `@/lib/…`.
- **Radius scale** is multiplier-based: `--radius: 0.8rem`; use Tailwind's `rounded-[18px]` / `rounded-[24px]` literals for cards to match the design rather than the scale tokens.
- **`"use client"`** is required on all interactive components. Server components (only `app/page.tsx`) are the exception.
- Number inputs for currency amounts always include `inputMode="decimal"`, `step="0.01"`, and `tabular-nums` class for alignment.
- `amountFromInput` / `parseAmount` helper functions (defined per-file in `finance-planner.tsx` and `finance-pots.tsx`) normalise `<input type="number">` string values to safe non-negative floats — replicate this pattern for any new number input.

## Code Style

- Named exports for all finance components; default export only for `ChatBot`.
- `type` keyword for all local type definitions (not `interface`).
- `useMemo` used for derived state (chart data, sorted categories, totals); avoid recalculating in render.
- Inline `aria-label` on every interactive control and every `role="progressbar"` element.
- `data-icon="inline-start"` attribute on Lucide icons placed before button text (e.g. `<Plus data-icon="inline-start" />`).

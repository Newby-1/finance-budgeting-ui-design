export type CurrencyCode = "USD" | "GBP" | "EUR"

export const currencyOptions: Array<{ code: CurrencyCode; label: string }> = [
  { code: "USD", label: "USD · US Dollar" },
  { code: "GBP", label: "GBP · British Pound" },
  { code: "EUR", label: "EUR · Euro" },
]

const currencyNames: Record<CurrencyCode, string> = {
  USD: "US dollars",
  GBP: "British pounds",
  EUR: "euros",
}

export function isCurrencyCode(value: string | undefined): value is CurrencyCode {
  return value === "USD" || value === "GBP" || value === "EUR"
}

export function getCurrencyName(currency: CurrencyCode) {
  return currencyNames[currency]
}

export function getCurrencyUnit(currency: CurrencyCode) {
  const units: Record<CurrencyCode, string> = {
    USD: "dollar",
    GBP: "pound",
    EUR: "euro",
  }

  return units[currency]
}

const currencyLocales: Record<CurrencyCode, string> = {
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-IE",
}

export function getCurrencySymbol(currency: CurrencyCode) {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? currency
}

export function formatCurrency(amount: number, currency: CurrencyCode, cents = false) {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

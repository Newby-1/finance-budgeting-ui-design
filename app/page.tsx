import { cookies } from 'next/headers'
import { FinancePlanner } from '@/components/finance-planner'
import { isCurrencyCode } from '@/lib/currency'

export default async function Page() {
  const cookieStore = await cookies()
  const preferredCurrency = cookieStore.get('finance-currency')?.value

  return <FinancePlanner initialCurrency={isCurrencyCode(preferredCurrency) ? preferredCurrency : 'USD'} />
}

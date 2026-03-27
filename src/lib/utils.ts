import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function isMarketOpen(): boolean {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = ist.getHours()
  const minutes = ist.getMinutes()
  const day = ist.getDay()

  // Monday-Friday only
  if (day === 0 || day === 6) return false

  const timeInMinutes = hours * 60 + minutes
  const marketOpen = 9 * 60 + 15  // 9:15 AM
  const marketClose = 15 * 60 + 30 // 3:30 PM

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose
}

export function getPnlColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-slate-400'
}

export function getPnlBg(value: number): string {
  if (value > 0) return 'bg-emerald-400/10 text-emerald-400'
  if (value < 0) return 'bg-red-400/10 text-red-400'
  return 'bg-slate-400/10 text-slate-400'
}

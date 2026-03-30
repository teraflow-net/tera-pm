import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: ko })
}

export function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
}

export function formatNumber(num: number) {
  return num.toLocaleString('ko-KR')
}

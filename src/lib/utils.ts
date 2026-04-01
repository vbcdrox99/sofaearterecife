import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOrderNumber(numero: number | string | undefined | null, createdAt?: string | null): string {
  if (numero === undefined || numero === null) return 'N/A';
  const numStr = String(numero).padStart(3, '0');
  let year = new Date().getFullYear().toString();
  if (createdAt) {
    year = new Date(createdAt).getFullYear().toString();
  }
  return `${numStr} ${year}`;
}

export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseInt(numbers, 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

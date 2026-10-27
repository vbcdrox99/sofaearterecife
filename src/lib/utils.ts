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

export function parseMetragem(raw?: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    let sum = 0;
    let anyValid = false;
    for (const p of parts) {
      const numStr = p.replace(',', '.').replace(/[^0-9.]/g, '');
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed)) {
        sum += parsed;
        anyValid = true;
      }
    }
    return anyValid ? sum : null;
  }

  const numStr = cleaned.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? null : parsed;
}

export function formatMetros(num: number): string {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '\u00A0m';
}


export function calcularDiasRestantes(dataEntrega: string | null | undefined): number | null {
  if (!dataEntrega) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const partes = dataEntrega.split('T')[0].split('-');
  if (partes.length === 3) {
    const [ano, mes, dia] = partes.map(Number);
    if (!isNaN(ano) && !isNaN(mes) && !isNaN(dia)) {
      const dEntrega = new Date(ano, mes - 1, dia);
      const diffTime = dEntrega.getTime() - hoje.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  const entrega = new Date(dataEntrega);
  if (isNaN(entrega.getTime())) return null;
  const diffTime = entrega.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

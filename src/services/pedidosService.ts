import { supabase } from '@/integrations/supabase/client';

export type StoreGroup = 'tamarineira' | 'valleri';

/**
 * Retorna se a loja informada pertence ao grupo Tamarineira (loja_3)
 */
export function isTamarineiraStore(loja?: string | null): boolean {
  return loja === 'loja_3';
}

/**
 * Retorna o nome amigável da loja a partir do identificador
 */
export function getStoreName(loja?: string | null): string {
  switch (loja) {
    case 'loja_1':
      return 'Aragão';
    case 'loja_2':
      return 'Boa Viagem';
    case 'loja_3':
      return 'Tamarineira';
    default:
      return 'Loja';
  }
}

/**
 * Retorna o rótulo descritivo da sequência de numeração para a loja e ano
 */
export function getStoreSequenceLabel(loja?: string | null, ano?: number): string {
  const currentYear = ano || new Date().getFullYear();
  if (isTamarineiraStore(loja)) {
    return `Sequência própria Tamarineira (${currentYear})`;
  }
  return `Sequência compartilhada Aragão & Boa Viagem (${currentYear})`;
}

/**
 * Busca o próximo número de pedido para a loja especificada considerando:
 * 1. Tamarineira (loja_3): sequência própria anual (1, 2, 3...)
 * 2. Aragão (loja_1) e Boa Viagem (loja_2): sequência unificada compartilhada anual (1, 2, 3...)
 * 3. Reinício anual: apenas pedidos do ano corrente são considerados no cálculo do maior número
 */
export async function getNextOrderNumber(loja: string, anoReferencia?: number): Promise<number> {
  const currentYear = anoReferencia || new Date().getFullYear();
  const startOfYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0)).toISOString();
  const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999)).toISOString();

  const isTamarineira = isTamarineiraStore(loja);

  try {
    let query = supabase
      .from('pedidos')
      .select('numero_pedido')
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear)
      .lt('numero_pedido', 1000000);

    if (isTamarineira) {
      query = query.eq('loja', 'loja_3');
    } else {
      query = query.in('loja', ['loja_1', 'loja_2']);
    }

    const { data, error } = await query
      .order('numero_pedido', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao consultar próximo número do pedido:', error);
      // Tentativa de fallback via RPC se o select falhou
      const { data: rpcNumber } = await supabase.rpc('get_next_order_number', { p_loja: loja });
      if (typeof rpcNumber === 'number' && rpcNumber > 0) {
        return rpcNumber;
      }
      return 1;
    }

    if (data && data.length > 0 && typeof data[0].numero_pedido === 'number') {
      return data[0].numero_pedido + 1;
    }

    return 1;
  } catch (err) {
    console.error('Exceção ao calcular próximo número do pedido:', err);
    return 1;
  }
}

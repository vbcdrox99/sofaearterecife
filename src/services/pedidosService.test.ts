import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTamarineiraStore, getStoreName, getStoreSequenceLabel, getNextOrderNumber } from './pedidosService';
import { supabase } from '@/integrations/supabase/client';

describe('pedidosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isTamarineiraStore', () => {
    it('deve identificar loja_3 como Tamarineira', () => {
      expect(isTamarineiraStore('loja_3')).toBe(true);
    });

    it('não deve identificar loja_1 ou loja_2 como Tamarineira', () => {
      expect(isTamarineiraStore('loja_1')).toBe(false);
      expect(isTamarineiraStore('loja_2')).toBe(false);
      expect(isTamarineiraStore('todas')).toBe(false);
      expect(isTamarineiraStore(null)).toBe(false);
    });
  });

  describe('getStoreName', () => {
    it('deve retornar nomes amigáveis corretos', () => {
      expect(getStoreName('loja_1')).toBe('Aragão');
      expect(getStoreName('loja_2')).toBe('Boa Viagem');
      expect(getStoreName('loja_3')).toBe('Tamarineira');
      expect(getStoreName('desconhecida')).toBe('Loja');
    });
  });

  describe('getStoreSequenceLabel', () => {
    it('deve retornar rótulo de sequência própria para Tamarineira com o ano', () => {
      const label = getStoreSequenceLabel('loja_3', 2026);
      expect(label).toBe('Sequência própria Tamarineira (2026)');
    });

    it('deve retornar rótulo de sequência compartilhada para Aragão e Boa Viagem', () => {
      expect(getStoreSequenceLabel('loja_1', 2026)).toBe('Sequência compartilhada Aragão & Boa Viagem (2026)');
      expect(getStoreSequenceLabel('loja_2', 2026)).toBe('Sequência compartilhada Aragão & Boa Viagem (2026)');
    });
  });

  describe('getNextOrderNumber', () => {
    it('deve retornar 1 se não houver pedidos no ano', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

      const nextNum = await getNextOrderNumber('loja_3', 2026);
      expect(nextNum).toBe(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('loja', 'loja_3');
    });

    it('deve retornar max + 1 para Tamarineira se houver pedidos', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ numero_pedido: 57 }], error: null }),
      };

      vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

      const nextNum = await getNextOrderNumber('loja_3', 2026);
      expect(nextNum).toBe(58);
      expect(mockQuery.eq).toHaveBeenCalledWith('loja', 'loja_3');
    });

    it('deve filtrar com in(loja_1, loja_2) para Aragão e retornar max + 1', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ numero_pedido: 55 }], error: null }),
      };

      vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

      const nextNum = await getNextOrderNumber('loja_1', 2026);
      expect(nextNum).toBe(56);
      expect(mockQuery.in).toHaveBeenCalledWith('loja', ['loja_1', 'loja_2']);
    });
  });
});

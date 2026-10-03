import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  ModalImpressaoTecidos, 
  TecidoItem, 
  TecidoAgrupado 
} from './ModalImpressaoTecidos';
import { parseMetragem, formatMetros } from '@/lib/utils';

describe('ModalImpressaoTecidos & Helpers', () => {
  describe('parseMetragem', () => {
    it('deve extrair números simples com ponto ou vírgula', () => {
      expect(parseMetragem('12.5')).toBe(12.5);
      expect(parseMetragem('12,5')).toBe(12.5);
      expect(parseMetragem('15m')).toBe(15);
      expect(parseMetragem('14,20 m')).toBe(14.2);
    });

    it('deve somar metragens compostas com "+"', () => {
      expect(parseMetragem('2.5 + 3.5')).toBe(6);
      expect(parseMetragem('10 + 5m')).toBe(15);
    });

    it('deve retornar null para valores inválidos ou vazios', () => {
      expect(parseMetragem('')).toBeNull();
      expect(parseMetragem(null)).toBeNull();
      expect(parseMetragem(undefined)).toBeNull();
      expect(parseMetragem('não especificado')).toBeNull();
    });
  });

  describe('formatMetros', () => {
    it('deve formatar número no padrão pt-BR', () => {
      const res = formatMetros(12.5);
      expect(res).toContain('12,5');
      expect(res).toContain('m');
    });
  });

  describe('Renderização do ModalImpressaoTecidos', () => {
    const mockItens: TecidoItem[] = [
      {
        id: '1',
        pedidoId: 'ped-1',
        numeroPedido: 65,
        clienteNome: 'Ademir Pereira',
        produtoDescricao: 'Teste Produto 2',
        tecido: 'Suede Bege',
        metragemTecido: '5.5m',
        dimensoes: '2.00m',
        dataPrevisaoEntrega: '2026-10-25',
        statusPedido: 'em_producao',
        observacoes: 'Obs teste',
      },
    ];

    const mockAgrupados: TecidoAgrupado[] = [
      {
        tecido: 'Suede Bege',
        itens: mockItens,
        metragens: ['5.5m'],
        totalMetrosCalculado: 5.5,
        itensComMetragem: 1,
        itensSemMetragem: 0,
      },
    ];

    it('deve renderizar o modal e as opções de filtro por data', () => {
      render(
        <ModalImpressaoTecidos
          isOpen={true}
          onClose={vi.fn()}
          itens={mockItens}
          onAplicarFiltroEImprimir={vi.fn()}
        />
      );

      expect(screen.getByText('Imprimir Relatório de Tecidos')).toBeInTheDocument();
      expect(screen.getByText('Filtrar Data de Entrega:')).toBeInTheDocument();
      expect(screen.getByText('Todas as Datas')).toBeInTheDocument();
      expect(screen.getByText('Por Mês')).toBeInTheDocument();
      expect(screen.getByText('📅 No Calendário')).toBeInTheDocument();
      expect(screen.getByText('Imprimir Agora (A4 Retrato)')).toBeInTheDocument();
    });
  });
});

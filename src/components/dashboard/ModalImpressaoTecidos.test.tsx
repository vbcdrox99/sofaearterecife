import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  describe('Renderização e Fluxo do ModalImpressaoTecidos', () => {
    const mockItens: TecidoItem[] = [
      {
        id: '1',
        pedidoId: 'ped-1',
        numeroPedido: 65,
        clienteNome: 'Ademir Pereira',
        produtoDescricao: 'Sofá Retrátil 3L',
        tecido: 'Suede Bege',
        metragemTecido: '5.5m',
        dimensoes: '2.00m',
        dataPrevisaoEntrega: '2026-08-15',
        statusPedido: 'em_producao',
        observacoes: 'Obs teste agosto',
      },
      {
        id: '2',
        pedidoId: 'ped-2',
        numeroPedido: 66,
        clienteNome: 'Maria Silva',
        produtoDescricao: 'Poltrona Paris',
        tecido: 'Bouclê Bege',
        metragemTecido: '3.0m',
        dimensoes: '1.00m',
        dataPrevisaoEntrega: '2026-08-20',
        statusPedido: 'em_producao',
        observacoes: 'Obs teste agosto 2',
      },
      {
        id: '3',
        pedidoId: 'ped-3',
        numeroPedido: 70,
        clienteNome: 'Carlos Santos',
        produtoDescricao: 'Sofá Cama',
        tecido: 'Linho Cinza',
        metragemTecido: '4.0m',
        dimensoes: '1.80m',
        dataPrevisaoEntrega: '2026-09-10',
        statusPedido: 'em_producao',
        observacoes: 'Obs teste setembro',
      },
    ];

    it('deve renderizar a Etapa 1 com opções de filtro por data', () => {
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
      expect(screen.getByText(/Avançar para Seleção/i)).toBeInTheDocument();
    });

    it('deve avançar para a Etapa 2 e exibir os pedidos com checkboxes pré-marcados', () => {
      render(
        <ModalImpressaoTecidos
          isOpen={true}
          onClose={vi.fn()}
          itens={mockItens}
          onAplicarFiltroEImprimir={vi.fn()}
        />
      );

      // Clicar em "Avançar para Seleção"
      const botaoAvancar = screen.getByText(/Avançar para Seleção/i);
      fireEvent.click(botaoAvancar);

      // Agora deve estar na Etapa 2
      expect(screen.getByText(/Seleção de Pedidos/i)).toBeInTheDocument();
      expect(screen.getByText('#65')).toBeInTheDocument();
      expect(screen.getByText('#66')).toBeInTheDocument();
      expect(screen.getByText('#70')).toBeInTheDocument();
      expect(screen.getByText(/3 de 3 selecionados/i)).toBeInTheDocument();
    });

    it('deve permitir desmarcar um item e chamar onAplicarFiltroEImprimir com itens filtrados', () => {
      const handleImprimir = vi.fn();
      render(
        <ModalImpressaoTecidos
          isOpen={true}
          onClose={vi.fn()}
          itens={mockItens}
          onAplicarFiltroEImprimir={handleImprimir}
        />
      );

      // Avança para a Etapa 2
      fireEvent.click(screen.getByText(/Avançar para Seleção/i));

      // Desmarca o pedido #65 clicando no checkbox do pedido #65
      const checkbox65 = screen.getByLabelText('Selecionar pedido #65');
      fireEvent.click(checkbox65);

      // Contador deve atualizar para 2 de 3
      expect(screen.getByText(/2 de 3 selecionados/i)).toBeInTheDocument();

      // Clica em imprimir
      const botaoImprimir = screen.getByText(/Imprimir Agora \(2 pedidos • A4 Retrato\)/i);
      fireEvent.click(botaoImprimir);

      expect(handleImprimir).toHaveBeenCalledTimes(1);
      const args = handleImprimir.mock.calls[0][0];
      expect(args.itensFiltrados).toHaveLength(2);
      expect(args.itensFiltrados.map((i: any) => i.id)).toEqual(['2', '3']);
      expect(args.isSelecaoPersonalizada).toBe(true);
    });

    it('deve permitir adicionar pedidos de outras datas que não estavam no filtro inicial', () => {
      const handleImprimir = vi.fn();
      render(
        <ModalImpressaoTecidos
          isOpen={true}
          onClose={vi.fn()}
          itens={mockItens}
          onAplicarFiltroEImprimir={handleImprimir}
        />
      );

      // Na Etapa 1, seleciona "Por Mês"
      fireEvent.click(screen.getByText('Por Mês'));

      // Avança para a Etapa 2 (vai conter os pedidos de Agosto ou do mês padrão)
      fireEvent.click(screen.getByText(/Avançar para Seleção/i));

      // Alterna para a aba "Outras Datas"
      const abaOutras = screen.getByText(/Outras Datas/i);
      fireEvent.click(abaOutras);

      // Deve listar pedidos fora do período
      const pedidoSetembro = screen.getByText('#70');
      expect(pedidoSetembro).toBeInTheDocument();

      // Clica para marcar o pedido #70
      const checkbox70 = screen.getByLabelText('Selecionar pedido #70');
      fireEvent.click(checkbox70);

      // Volta para a Etapa 1 usando o botão Voltar
      fireEvent.click(screen.getByText(/Voltar \(Datas\)/i));
      expect(screen.getByText('Filtrar Data de Entrega:')).toBeInTheDocument();
    });
  });
});

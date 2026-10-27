import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ModalImpressaoDashboard,
  LinhaDashboard,
} from './ModalImpressaoDashboard';

describe('ModalImpressaoDashboard', () => {
  const mockLinhas: LinhaDashboard[] = [
    {
      pedido: {
        id: 'ped-1',
        numero_pedido: 65,
        cliente_nome: 'Ademir Pereira',
        tipo_sofa: 'Sofá Retrátil 3L',
        data_previsao_entrega: '2026-08-15',
        loja: 'loja_1',
      },
      itensProducao: [
        { id: 'ip-1', pedido_id: 'ped-1', etapa: 'marcenaria', status: 'pendente' as const },
      ],
      seq: 1,
      item: { descricao: 'Sofá Retrátil 3L', dimensoes: '2.00m' },
    },
    {
      pedido: {
        id: 'ped-2',
        numero_pedido: 66,
        cliente_nome: 'Maria Silva',
        tipo_sofa: 'Poltrona Paris',
        data_previsao_entrega: '2026-08-20',
        loja: 'loja_2',
      },
      itensProducao: [
        { id: 'ip-2', pedido_id: 'ped-2', etapa: 'marcenaria', status: 'iniciado' as const },
      ],
      seq: 1,
      item: { descricao: 'Poltrona Paris', dimensoes: '1.00m' },
    },
    {
      pedido: {
        id: 'ped-3',
        numero_pedido: 70,
        cliente_nome: 'Carlos Santos',
        tipo_sofa: 'Sofá Cama',
        data_previsao_entrega: '2026-09-10',
        loja: 'loja_3',
      },
      itensProducao: [
        { id: 'ip-3', pedido_id: 'ped-3', etapa: 'corte_costura', status: 'pendente' as const },
      ],
      seq: 1,
      item: { descricao: 'Sofá Cama', dimensoes: '1.80m' },
    },
  ];

  it('deve renderizar a Etapa 1 com opções de status e de datas', () => {
    render(
      <ModalImpressaoDashboard
        isOpen={true}
        onClose={vi.fn()}
        linhas={mockLinhas}
        onConfirmarImpressao={vi.fn()}
      />
    );

    expect(screen.getByText('Gerar Relatório PDF da Produção')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Status / Urgência:')).toBeInTheDocument();
    expect(screen.getByText('Atrasados')).toBeInTheDocument();
    expect(screen.getByText('Para Hoje')).toBeInTheDocument();
    expect(screen.getByText('Novos')).toBeInTheDocument();
    expect(screen.getByText('Filtrar Data de Entrega:')).toBeInTheDocument();
    expect(screen.getByText('Todas as Datas')).toBeInTheDocument();
    expect(screen.getByText('Por Mês')).toBeInTheDocument();
    expect(screen.getByText('📅 No Calendário')).toBeInTheDocument();
    expect(screen.getByText('Imprimir Agora (A4 Paisagem)')).toBeInTheDocument();
    expect(screen.getByText(/Avançar para Seleção/i)).toBeInTheDocument();
  });

  it('deve avançar para a Etapa 2 e exibir os pedidos com checkboxes pré-marcados', () => {
    render(
      <ModalImpressaoDashboard
        isOpen={true}
        onClose={vi.fn()}
        linhas={mockLinhas}
        onConfirmarImpressao={vi.fn()}
      />
    );

    // Clicar em "Avançar para Seleção"
    const botaoAvancar = screen.getByText(/Avançar para Seleção/i);
    fireEvent.click(botaoAvancar);

    // Agora deve estar na Etapa 2
    expect(screen.getByText('Seleção de Pedidos para o PDF')).toBeInTheDocument();
    expect(screen.getByText('#065')).toBeInTheDocument();
    expect(screen.getByText('#066')).toBeInTheDocument();
    expect(screen.getByText('#070')).toBeInTheDocument();
    expect(screen.getByText(/3 de 3 selecionados/i)).toBeInTheDocument();
  });

  it('deve permitir desmarcar um item e chamar onConfirmarImpressao com seleção personalizada', () => {
    const handleConfirmar = vi.fn();
    render(
      <ModalImpressaoDashboard
        isOpen={true}
        onClose={vi.fn()}
        linhas={mockLinhas}
        onConfirmarImpressao={handleConfirmar}
      />
    );

    // Avança para a Etapa 2
    fireEvent.click(screen.getByText(/Avançar para Seleção/i));

    // Desmarca o pedido #065
    const checkbox65 = screen.getByLabelText('Selecionar pedido #65');
    fireEvent.click(checkbox65);

    expect(screen.getByText(/2 de 3 selecionados/i)).toBeInTheDocument();

    // Clica em imprimir
    const botaoImprimir = screen.getByText(/Imprimir Agora \(2 pedidos • A4 Paisagem\)/i);
    fireEvent.click(botaoImprimir);

    expect(handleConfirmar).toHaveBeenCalledTimes(1);
    const args = handleConfirmar.mock.calls[0][0];
    expect(args.selectedChaves.size).toBe(2);
    expect(args.isPersonalizada).toBe(true);
  });

  it('deve permitir filtrar por mês e adicionar pedidos de outras datas na Etapa 2', () => {
    const handleConfirmar = vi.fn();
    render(
      <ModalImpressaoDashboard
        isOpen={true}
        onClose={vi.fn()}
        linhas={mockLinhas}
        onConfirmarImpressao={handleConfirmar}
      />
    );

    // Seleciona filtro Por Mês na Etapa 1
    fireEvent.click(screen.getByText('Por Mês'));

    // Avança para a Etapa 2
    fireEvent.click(screen.getByText(/Avançar para Seleção/i));

    // Alterna para a aba Outros Pedidos
    const abaOutras = screen.getByText(/Outros Pedidos/i);
    fireEvent.click(abaOutras);

    // Pedido #070 (setembro) deve aparecer aqui
    const pedido70 = screen.getByText('#070');
    expect(pedido70).toBeInTheDocument();

    // Marca o pedido #070
    const checkbox70 = screen.getByLabelText('Selecionar pedido #70');
    fireEvent.click(checkbox70);

    // Volta para a Etapa 1 e verifica se manteve integridade
    fireEvent.click(screen.getByText(/Voltar \(Filtros\)/i));
    expect(screen.getByText('Filtrar Data de Entrega:')).toBeInTheDocument();
  });

  it('deve permitir imprimir diretamente da Etapa 1', () => {
    const handleConfirmar = vi.fn();
    render(
      <ModalImpressaoDashboard
        isOpen={true}
        onClose={vi.fn()}
        linhas={mockLinhas}
        onConfirmarImpressao={handleConfirmar}
      />
    );

    const botaoImprimirDireto = screen.getByText('Imprimir Agora (A4 Paisagem)');
    fireEvent.click(botaoImprimirDireto);

    expect(handleConfirmar).toHaveBeenCalledTimes(1);
    const args = handleConfirmar.mock.calls[0][0];
    expect(args.selectedChaves.size).toBe(3);
    expect(args.isPersonalizada).toBe(false);
  });
});

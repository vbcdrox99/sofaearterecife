import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';

// Mock dos hooks customizados
vi.mock('@/hooks/usePedidos', () => ({
  usePedidos: vi.fn(() => ({
    pedidos: [
      {
        id: '1',
        numero_pedido: 1,
        cliente_nome: 'Cliente Teste',
        cliente_telefone: '11999999999',
        descricao_sofa: 'Sofá 3 lugares',
        status: 'aguardando_producao',
        valor_total: 1500,
        created_at: '2024-01-15',
        data_previsao_entrega: '2024-01-30',
      },
      {
        id: '2',
        numero_pedido: 2,
        cliente_nome: 'Cliente Teste 2',
        cliente_telefone: '11888888888',
        descricao_sofa: 'Sofá 2 lugares',
        status: 'em_producao',
        valor_total: 2000,
        created_at: '2024-01-16',
        data_previsao_entrega: '2024-01-31',
      },
    ],
    loading: false,
    getStatusLabel: vi.fn((status) => {
      const labels = {
        aguardando_producao: 'Aguardando Produção',
        em_producao: 'Em Produção',
        finalizado: 'Finalizado',
        em_entrega: 'Em Entrega',
        entregue: 'Entregue'
      };
      return labels[status] || status;
    }),
    getStatusColor: vi.fn(() => 'blue'),
  })),
}));

vi.mock('@/hooks/useMateriais', () => ({
  useMateriais: vi.fn(() => ({
    materiais: [
      {
        id: '1',
        nome: 'Tecido Algodão',
        quantidade_atual: 5,
        quantidade_minima: 10,
        unidade_medida: 'metros',
        preco_unitario: 25,
      },
      {
        id: '2',
        nome: 'Espuma',
        quantidade_atual: 15,
        quantidade_minima: 5,
        unidade_medida: 'unidades',
        preco_unitario: 50,
      },
    ],
    loading: false,
    getMaterialBaixoEstoque: vi.fn(() => [
      {
        id: '1',
        nome: 'Tecido Algodão',
        quantidade_atual: 5,
        quantidade_minima: 10,
        unidade_medida: 'metros',
        preco_unitario: 25,
      }
    ]),
    getValorTotalEstoque: vi.fn(() => 875),
  })),
}));

vi.mock('@/lib/supabase', () => ({
  producaoService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'ip-1',
        pedido_id: '1',
        etapa: 'marcenaria',
        status: 'pendente',
        pedidos: {
          numero_pedido: 1,
          cliente_nome: 'Cliente Teste',
          tipo_sofa: 'Sofá Retrátil',
          observacoes: 'Espuma D33, Tecido Bouclê',
          data_previsao_entrega: '2026-10-01',
          forma_pagamento: 'À vista',
        }
      }
    ]),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            {component}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título de status de produção', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Status de Produção - Todos os Pedidos')).toBeInTheDocument();
  });

  it('deve exibir os botões de filtro por área de produção', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('GERAL/TODOS')).toBeInTheDocument();
    expect(screen.getByText('Marcenaria')).toBeInTheDocument();
    expect(screen.getByText('Corte Costura')).toBeInTheDocument();
    expect(screen.getByText('Espuma')).toBeInTheDocument();
    expect(screen.getByText('Bancada')).toBeInTheDocument();
    expect(screen.getByText('Tecido')).toBeInTheDocument();
  });

  it('deve exibir o campo de busca global', async () => {
    renderWithProviders(<Dashboard />);
    const searchInput = await screen.findByPlaceholderText('Buscar pedido, produto, cliente...');
    expect(searchInput).toBeInTheDocument();
  });

  it('deve renderizar o cabeçalho da tabela com a coluna Detalhes', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Nº Pedido')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Entrega')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Status Produção')).toBeInTheDocument();
  });

  it('deve renderizar o botão de Gerar PDF', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByRole('button', { name: /Gerar PDF/i })).toBeInTheDocument();
  });
});
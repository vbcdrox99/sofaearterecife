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

  it('deve renderizar o título do dashboard', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('deve exibir as estatísticas de pedidos', () => {
    renderWithProviders(<Dashboard />);
    
    // Verifica se os cards de estatísticas estão presentes
    expect(screen.getByText('Aguardando Produção')).toBeInTheDocument();
    expect(screen.getByText('Em Produção')).toBeInTheDocument();
    expect(screen.getByText('Finalizados')).toBeInTheDocument();
    expect(screen.getByText('Em Entrega')).toBeInTheDocument();
  });

  it('deve exibir alertas de baixo estoque', () => {
    renderWithProviders(<Dashboard />);
    
    // Verifica se o alerta de baixo estoque está presente
    expect(screen.getByText('Materiais em Baixo Estoque')).toBeInTheDocument();
    expect(screen.getByText('Tecido Algodão')).toBeInTheDocument();
  });

  it('deve calcular e exibir o tempo médio de produção', () => {
    renderWithProviders(<Dashboard />);
    
    // Verifica se o tempo médio está sendo exibido
    expect(screen.getByText('Tempo Médio de Produção')).toBeInTheDocument();
    expect(screen.getByText('0 dias')).toBeInTheDocument();
  });

  it('deve calcular e exibir o valor total do estoque', () => {
    renderWithProviders(<Dashboard />);
    
    // Verifica se o valor total do estoque está sendo exibido
    expect(screen.getByText('Valor Total do Estoque')).toBeInTheDocument();
    expect(screen.getByText('R$ 875')).toBeInTheDocument();
  });

  it('deve exibir a seção de pedidos recentes', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
  });

  it('deve permitir busca rápida de pedidos', () => {
    renderWithProviders(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Buscar pedidos...');
    expect(searchInput).toBeInTheDocument();
  });
});
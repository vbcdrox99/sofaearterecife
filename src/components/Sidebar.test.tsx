import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from './dashboard/Sidebar';

// Mock do contexto de autenticação
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: vi.fn(),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  const mockOnToggle = vi.fn();
  const mockSignOut = vi.fn();
  const mockSetSelectedStore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('deve renderizar a logo da empresa e itens padrão', () => {
    (useAuth as any).mockReturnValue({
      profile: { nome_completo: 'Carlos Silva', role: 'funcionario' },
      isAdmin: false,
      userStores: ['loja_1'],
      selectedStore: 'loja_1',
      setSelectedStore: mockSetSelectedStore,
      signOut: mockSignOut,
    });

    renderWithProviders(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    expect(screen.getByText('Válleri')).toBeInTheDocument();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
    expect(screen.getByText('Linha de Produção')).toBeInTheDocument();
  });

  it('NÃO deve exibir Cadastro de Funcionários para funcionário comum', () => {
    (useAuth as any).mockReturnValue({
      profile: { nome_completo: 'Carlos Silva', role: 'funcionario' },
      isAdmin: false,
      userStores: ['loja_1'],
      selectedStore: 'loja_1',
      setSelectedStore: mockSetSelectedStore,
      signOut: mockSignOut,
    });

    renderWithProviders(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    expect(screen.queryByText('Cadastro de Funcionários')).not.toBeInTheDocument();
    expect(screen.queryByText('Histórico de Logs')).not.toBeInTheDocument();
  });

  it('deve exibir Cadastro de Funcionários e Histórico de Logs quando for administrador', () => {
    (useAuth as any).mockReturnValue({
      profile: { nome_completo: 'Administrador Chefe', role: 'admin' },
      isAdmin: true,
      userStores: ['loja_1', 'loja_2', 'loja_3'],
      selectedStore: 'todas',
      setSelectedStore: mockSetSelectedStore,
      signOut: mockSignOut,
    });

    renderWithProviders(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    expect(screen.getByText('Cadastro de Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Histórico de Logs')).toBeInTheDocument();
  });

  it('deve exibir badge fixa de loja para colaborador com apenas uma loja', () => {
    (useAuth as any).mockReturnValue({
      profile: { nome_completo: 'Mariana Lima', role: 'funcionario' },
      isAdmin: false,
      userStores: ['loja_2'],
      selectedStore: 'loja_2',
      setSelectedStore: mockSetSelectedStore,
      signOut: mockSignOut,
    });

    renderWithProviders(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    expect(screen.getByText('Loja: Boa Viagem')).toBeInTheDocument();
  });

  it('deve exibir seletor de lojas para colaborador com múltiplas lojas', () => {
    (useAuth as any).mockReturnValue({
      profile: { nome_completo: 'Gerente Regional', role: 'gerente' },
      isAdmin: false,
      userStores: ['loja_1', 'loja_2'],
      selectedStore: 'todas',
      setSelectedStore: mockSetSelectedStore,
      signOut: mockSignOut,
    });

    renderWithProviders(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    // Deve exibir o seletor com a opção Minhas Lojas
    expect(screen.getByText('Minhas Lojas')).toBeInTheDocument();
  });
});
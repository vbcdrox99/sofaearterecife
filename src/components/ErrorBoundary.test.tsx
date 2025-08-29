import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

// Componente que gera erro para testar o ErrorBoundary
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Erro de teste');
  }
  return <div>Componente funcionando</div>;
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciar erros do console durante os testes
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('deve renderizar children quando não há erro', () => {
    renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
  });

  it('deve renderizar UI de erro quando há um erro', () => {
    renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
  });

  it('deve exibir botões de ação na UI de erro', () => {
    renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /recarregar página/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir para dashboard/i })).toBeInTheDocument();
  });

  it('deve recarregar a página quando o botão recarregar for clicado', () => {
    // Mock do window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
    });

    renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const reloadButton = screen.getByRole('button', { name: /recarregar página/i });
    fireEvent.click(reloadButton);
    
    expect(mockReload).toHaveBeenCalled();
  });

  it('deve exibir detalhes do erro em modo de desenvolvimento', () => {
    // Mock do NODE_ENV para desenvolvimento
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Detalhes do erro:')).toBeInTheDocument();
    expect(screen.getByText('Erro de teste')).toBeInTheDocument();

    // Restaurar o NODE_ENV original
    process.env.NODE_ENV = originalEnv;
  });

  it('não deve exibir detalhes do erro em modo de produção', () => {
    // Mock do NODE_ENV para produção
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Detalhes do erro:')).not.toBeInTheDocument();
    expect(screen.queryByText('Erro de teste')).not.toBeInTheDocument();

    // Restaurar o NODE_ENV original
    process.env.NODE_ENV = originalEnv;
  });

  it('deve resetar o estado de erro quando receber novas props', () => {
    const { rerender } = renderWithRouter(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Verifica se a UI de erro está sendo exibida
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    
    // Re-renderiza com um componente que não gera erro
    rerender(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </BrowserRouter>
    );
    
    // Verifica se o componente normal está sendo exibido novamente
    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
  });
});
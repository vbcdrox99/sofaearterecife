import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3,
  Package2, 
  ClipboardList, 
  Wrench, 
  CheckCircle, 
  Truck,
  Sofa,
  LogOut,
  Settings,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      description: 'Visão geral do sistema',
    },
    {
      name: 'Novo Pedido',
      href: '/dashboard/novo-pedido',
      icon: PlusCircle,
      description: 'Cadastrar novo pedido',
    },
    {
      name: 'Pedidos',
      href: '/dashboard/pedidos',
      icon: ClipboardList,
      description: 'Gerenciar pedidos',
    },
    {
      name: 'Produção',
      href: '/dashboard/producao',
      icon: Wrench,
      description: 'Controle de produção',
    },
    {
      name: 'Finalizados',
      href: '/dashboard/finalizados',
      icon: CheckCircle,
      description: 'Produtos finalizados',
    },
    {
      name: 'Entrega',
      href: '/dashboard/entrega',
      icon: Truck,
      description: 'Controle de entregas',
    },
  ];

  // Itens apenas para administradores
  const adminItems = [
    {
      name: 'Estoque',
      href: '/dashboard/estoque',
      icon: Package2,
      description: 'Gerenciar materiais',
    },
    {
      name: 'Relatórios',
      href: '/dashboard/relatorios',
      icon: BarChart3,
      description: 'Relatórios e análises',
    },
  ];

  const allItems = isAdmin ? [...navigationItems, ...adminItems] : navigationItems;

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r border-border shadow-lg"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-red-glow">
              <Sofa className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">Sofá e Arte</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
          
          {/* User info */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">{profile?.nome_completo}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {allItems.map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="hover-lift"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full justify-start hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
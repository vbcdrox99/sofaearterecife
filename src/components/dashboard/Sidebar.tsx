import { motion, AnimatePresence } from 'framer-motion';
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
  PlusCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  UserPlus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  disabled?: boolean;
  disabledNote?: string;
};

const Sidebar = ({ isOpen = true, onToggle, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const { profile, signOut, isAdmin, selectedStore, setSelectedStore } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLinkClick = () => {
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  const navigationItems: NavItem[] = [
    {
      name: 'Administração',
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
      name: 'Produção',
      href: '/dashboard/producao',
      icon: Wrench,
      description: 'Controle de produção',
    },
  ];

  // Itens apenas para administradores
  const adminItems: NavItem[] = [
    {
      name: 'Cadastro de Funcionários',
      href: '/dashboard/cadastro-funcionarios',
      icon: UserPlus,
      description: 'Criar contas de acesso',
    },
  ];

  let allItems: NavItem[] = [];

  if (profile?.role === 'admin' || profile?.tipo === 'admin') {
    // Admin sees everything
    allItems = [...navigationItems, ...adminItems];
  } else if (profile?.role === 'gerente' || profile?.role === 'funcionario') {
    // Gerente and Funcionario see everything except Admin Items
    allItems = [...navigationItems];
  } else {
    allItems = [...navigationItems];
  }

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: isMobile ? -300 : 0 }}
        animate={{
          x: isMobile ? (isOpen ? 0 : -300) : 0,
          width: isMobile ? (isOpen ? 320 : 0) : (isCollapsed ? 80 : 288)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border shadow-lg",
          isMobile ? "w-80" : (isCollapsed ? "w-20" : "w-72")
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn("border-b border-border", isCollapsed ? "p-3" : "p-6")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <img src="/vallerilogo.png" alt="Válleri Logo" className="h-10 w-auto object-contain drop-shadow-sm" />
                {!isCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold text-gradient">Válleri</h1>
                    <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
                  </div>
                )}
              </div>

              {/* Close button for mobile */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="md:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}

              {/* Collapse button for desktop */}
              {!isMobile && onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="hidden md:flex"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              )}
            </div>

            {/* Store Selector for Admin */}
            {!isCollapsed && isAdmin && (
              <div className="mb-4">
                <Select value={selectedStore} onValueChange={(v: any) => setSelectedStore(v)}>
                  <SelectTrigger className="w-full h-8 text-xs bg-muted/50 border-muted">
                    <div className="flex items-center gap-2">
                      <Store className="w-3 h-3" />
                      <SelectValue placeholder="Selecione a Loja" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Lojas</SelectItem>
                    <SelectItem value="loja_1">Aragão</SelectItem>
                    <SelectItem value="loja_2">Boa Viagem</SelectItem>
                    <SelectItem value="loja_3">Tamarineira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* User info */}
            {!isCollapsed && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{profile?.nome_completo}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {(profile?.role === 'admin' || profile?.tipo === 'admin') ? 'Administrador' : 
                   profile?.role === 'gerente' ? 'Gerente' : 'Funcionário'}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2" : "p-4")}>
            <nav className="space-y-2">
              {allItems.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={item.disabled ? {} : { scale: 1.02 }}
                  whileTap={item.disabled ? {} : { scale: 0.98 }}
                >
                  {item.disabled ? (
                    <div
                      className={cn(
                        "flex items-center rounded-lg transition-all duration-200 group relative",
                        isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3",
                        "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                      title={isCollapsed ? `${item.name} — ${item.disabledNote || 'Em breve'}` : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && (
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs opacity-75">{item.description}</div>
                          {item.disabledNote && (
                            <div className="text-xs italic opacity-75">{item.disabledNote}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.href}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-lg transition-all duration-200 group relative",
                          isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )
                      }
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && (
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs opacity-75">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  )}
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className={cn("border-t border-border space-y-2", isCollapsed ? "p-2" : "p-4")}>
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover-lift"
                  title="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive hover:text-destructive-foreground"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
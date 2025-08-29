import { motion } from 'framer-motion';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Package,
  ClipboardList,
  Wrench,
  CheckCircle,
  Truck,
  Search
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePedidos } from '@/hooks/usePedidos';
import { useMateriais } from '@/hooks/useMateriais';
import { useState } from 'react';

const Dashboard = () => {
  const { pedidos, loading: loadingPedidos, getStatusLabel, getStatusColor } = usePedidos();
  const { materiais, getMaterialBaixoEstoque, getValorTotalEstoque } = useMateriais();
  const [searchTerm, setSearchTerm] = useState('');

  const contarPorStatus = () => {
    return pedidos.reduce((acc, pedido) => {
      acc[pedido.status] = (acc[pedido.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = contarPorStatus();
  const materiaisBaixoEstoque = getMaterialBaixoEstoque();
  const valorTotalEstoque = getValorTotalEstoque();

  const calcularTempoMedioProducao = () => {
    const pedidosFinalizados = pedidos.filter(p => p.status === 'entregue' || p.status === 'finalizado');
    if (pedidosFinalizados.length === 0) return 0;

    const tempoTotal = pedidosFinalizados.reduce((total, pedido) => {
      const inicio = new Date(pedido.created_at);
      const fim = new Date(pedido.updated_at);
      const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      return total + dias;
    }, 0);

    return Math.round(tempoTotal / pedidosFinalizados.length);
  };

  const filteredPedidos = pedidos.filter(pedido =>
    pedido.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.numero_pedido.toString().includes(searchTerm)
  );

  const tempoMedio = calcularTempoMedioProducao();

  const statsCards = [
    {
      title: 'Aguardando Produção',
      value: statusCounts.aguardando_producao || 0,
      description: 'Pedidos na fila',
      icon: ClipboardList,
      color: 'warning' as const,
    },
    {
      title: 'Em Produção',
      value: statusCounts.em_producao || 0,
      description: 'Em andamento',
      icon: Wrench,
      color: 'primary' as const,
    },
    {
      title: 'Finalizados',
      value: statusCounts.finalizado || 0,
      description: 'Prontos para entrega',
      icon: CheckCircle,
      color: 'success' as const,
    },
    {
      title: 'Em Entrega',
      value: statusCounts.em_entrega || 0,
      description: 'Saíram para entrega',
      icon: Truck,
      color: 'primary' as const,
    },
  ];

  return (
    <DashboardLayout
      title="Painel de Controle - Sofá e Arte"
      description="Visão geral do sistema de produção Sofá e Arte"
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatsCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Materiais em Falta"
            value={materiaisBaixoEstoque.length}
            description="Abaixo do estoque mínimo"
            icon={AlertTriangle}
            color={materiaisBaixoEstoque.length > 0 ? 'danger' : 'success'}
          />
          
          <StatsCard
            title="Tempo Médio Produção"
            value={`${tempoMedio} dias`}
            description="Média de conclusão"
            icon={Clock}
            color="primary"
          />
          
          <StatsCard
            title="Valor Total Estoque"
            value={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            description="Valor dos materiais"
            icon={Package}
            color="primary"
          />
        </div>

        {/* Search and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Search */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-primary" />
                <span>Busca Rápida</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Nome do cliente ou nº do pedido"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
              
              {searchTerm && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filteredPedidos.slice(0, 5).map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">#{pedido.numero_pedido}</p>
                        <p className="text-xs text-muted-foreground">{pedido.cliente_nome}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(pedido.status)}`} />
                    </div>
                  ))}
                  {filteredPedidos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum pedido encontrado
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="card-elegant lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Pedidos Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pedidos.slice(0, 5).map((pedido) => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(pedido.status)}`} />
                        <div>
                          <p className="text-sm font-medium">#{pedido.numero_pedido} - {pedido.cliente_nome}</p>
                          <p className="text-xs text-muted-foreground">{getStatusLabel(pedido.status)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {pedido.valor_total && (
                        <p className="text-sm font-medium text-primary">
                          R$ {pedido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {pedidos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum pedido cadastrado ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for Low Stock */}
        {materiaisBaixoEstoque.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-warning bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Alerta de Estoque</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  {materiaisBaixoEstoque.length} material(is) com estoque baixo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {materiaisBaixoEstoque.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between bg-background rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{material.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.quantidade_atual} {material.unidade_medida} restante(s)
                        </p>
                      </div>
                      <div className="text-warning">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
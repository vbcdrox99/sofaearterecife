import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Edit, Trash2, Plus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PedidoFicticio {
  id: string;
  numeroPedido: string;
  clienteNome: string;
  tipoSofa: string;
  status: 'orcamento' | 'aprovado' | 'producao' | 'finalizado' | 'entregue';
  valor: number;
  dataPedido: string;
  dataPrevisaoEntrega: string;
}

const pedidosFicticios: PedidoFicticio[] = [
  {
    id: '1',
    numeroPedido: 'PED-2024-001',
    clienteNome: 'Maria Silva Santos',
    tipoSofa: 'Sofá 3 Lugares - Couro Marrom',
    status: 'producao',
    valor: 2500.00,
    dataPedido: '2024-01-15',
    dataPrevisaoEntrega: '2024-02-15'
  },
  {
    id: '2',
    numeroPedido: 'PED-2024-002',
    clienteNome: 'João Carlos Oliveira',
    tipoSofa: 'Sofá de Canto - Tecido Cinza',
    status: 'aprovado',
    valor: 3200.00,
    dataPedido: '2024-01-18',
    dataPrevisaoEntrega: '2024-02-20'
  },
  {
    id: '3',
    numeroPedido: 'PED-2024-003',
    clienteNome: 'Ana Paula Costa',
    tipoSofa: 'Sofá 2 Lugares - Veludo Azul',
    status: 'finalizado',
    valor: 1800.00,
    dataPedido: '2024-01-10',
    dataPrevisaoEntrega: '2024-02-10'
  },
  {
    id: '4',
    numeroPedido: 'PED-2024-004',
    clienteNome: 'Roberto Ferreira',
    tipoSofa: 'Sofá Reclinável - Couro Preto',
    status: 'entregue',
    valor: 4500.00,
    dataPedido: '2024-01-05',
    dataPrevisaoEntrega: '2024-02-05'
  },
  {
    id: '5',
    numeroPedido: 'PED-2024-005',
    clienteNome: 'Fernanda Lima',
    tipoSofa: 'Sofá com Chaise - Linho Bege',
    status: 'orcamento',
    valor: 2800.00,
    dataPedido: '2024-01-20',
    dataPrevisaoEntrega: '2024-02-25'
  },
  {
    id: '6',
    numeroPedido: 'PED-2024-006',
    clienteNome: 'Carlos Eduardo Santos',
    tipoSofa: 'Sofá 4 Lugares - Suede Verde',
    status: 'producao',
    valor: 3800.00,
    dataPedido: '2024-01-22',
    dataPrevisaoEntrega: '2024-02-28'
  }
];

const Pedidos = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [pedidos] = useState<PedidoFicticio[]>(pedidosFicticios);

  const getStatusLabel = (status: string) => {
    const labels = {
      'orcamento': 'Orçamento',
      'aprovado': 'Aprovado',
      'producao': 'Em Produção',
      'finalizado': 'Finalizado',
      'entregue': 'Entregue'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'orcamento': 'bg-yellow-100 text-yellow-800',
      'aprovado': 'bg-blue-100 text-blue-800',
      'producao': 'bg-orange-100 text-orange-800',
      'finalizado': 'bg-green-100 text-green-800',
      'entregue': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.tipoSofa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || pedido.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action: string, pedidoId: string) => {
    toast({
      title: `${action} Executado`,
      description: `Ação "${action}" executada para o pedido ${pedidoId}. (Demonstração)`,
    });
  };

  return (
    <DashboardLayout
      title="Gerenciar Pedidos"
      description="Visualizar e gerenciar todos os pedidos de sofás"
    >
      <div className="space-y-6">
        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, número do pedido ou tipo de sofá..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="orcamento">Orçamento</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="producao">Em Produção</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Pedido
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({filteredPedidos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPedidos.map((pedido, index) => (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{pedido.numeroPedido}</h3>
                        <Badge className={getStatusColor(pedido.status)}>
                          {getStatusLabel(pedido.status)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-1">
                        <strong>Cliente:</strong> {pedido.clienteNome}
                      </p>
                      <p className="text-muted-foreground mb-1">
                        <strong>Produto:</strong> {pedido.tipoSofa}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                        <span><strong>Pedido:</strong> {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</span>
                        <span className="hidden sm:inline">•</span>
                        <span><strong>Entrega:</strong> {new Date(pedido.dataPrevisaoEntrega).toLocaleDateString('pt-BR')}</span>
                        <span className="hidden sm:inline">•</span>
                        <span><strong>Valor:</strong> R$ {pedido.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('Visualizar', pedido.numeroPedido)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('Editar', pedido.numeroPedido)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('Excluir', pedido.numeroPedido)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filteredPedidos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum pedido encontrado com os filtros aplicados.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pedidos;
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, Calendar, User, DollarSign, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { pedidosService, type Pedido } from '@/lib/supabase';

// Interface movida para supabase.ts

// Dados fictícios removidos - agora usando dados reais do Supabase

const Pedidos = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);

  // Carregar pedidos do banco de dados
  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const dados = await pedidosService.getAll();
      setPedidos(dados || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const cores = {
      'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'em_producao': 'bg-purple-100 text-purple-800 border-purple-200',
      'concluido': 'bg-green-100 text-green-800 border-green-200',
      'entregue': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return cores[status as keyof typeof cores] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPrioridadeColor = (prioridade: string) => {
    const cores = {
      'baixa': 'bg-gray-100 text-gray-800 border-gray-200',
      'media': 'bg-blue-100 text-blue-800 border-blue-200',
      'alta': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return cores[prioridade as keyof typeof cores] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchStatus = filtroStatus === 'todos' || pedido.status === filtroStatus;
    const matchPrioridade = filtroPrioridade === 'todos' || pedido.prioridade === filtroPrioridade;
    const matchBusca = termoBusca === '' || 
      pedido.numero_pedido.toLowerCase().includes(termoBusca.toLowerCase()) ||
      pedido.cliente_nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      pedido.tipo_sofa.toLowerCase().includes(termoBusca.toLowerCase());
    
    return matchStatus && matchPrioridade && matchBusca;
  });


  const handleVisualizarPedido = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    setDialogAberto(true);
  };

  const handleEditarPedido = (pedido: Pedido) => {
    navigate(`/dashboard/editar-pedido/${pedido.id}`);
  };

  const handleExcluirPedido = async (pedido: Pedido) => {
    if (window.confirm(`Tem certeza que deseja excluir o pedido ${pedido.numero_pedido}?`)) {
      try {
        await pedidosService.delete(pedido.id!);
        toast({
          title: "Sucesso",
          description: `Pedido ${pedido.numero_pedido} foi excluído com sucesso.`,
        });
        carregarPedidos(); // Recarregar a lista
      } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o pedido.",
          variant: "destructive"
        });
      }
    }
  };

  const handleNovoPedido = () => {
    navigate('/dashboard/novo-pedido');
  };

  const calcularSaldoDevedor = (valorTotal: number, valorPago: number) => {
    return (valorTotal || 0) - (valorPago || 0);
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Gerenciar Pedidos"
        description="Visualizar e gerenciar todos os pedidos de sofás"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando pedidos...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Gerenciar Pedidos"
      description="Visualizar e gerenciar todos os pedidos de sofás"
    >
      <div className="space-y-6">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pedidos.length}</div>
              <p className="text-xs text-muted-foreground">+2 desde ontem</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Produção</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pedidos.filter(p => p.status === 'em_producao').length}
              </div>
              <p className="text-xs text-muted-foreground">Atualmente em andamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pedidos.filter(p => p.status === 'pendente').length}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {pedidos.reduce((acc, p) => acc + p.valorTotal, 0).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">Em pedidos ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle>Lista de Pedidos</CardTitle>
              <Button onClick={handleNovoPedido} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Pedido
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, cliente ou tipo de sofá..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_producao">Em Produção</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {pedidosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum pedido encontrado com os filtros aplicados.
              </CardContent>
            </Card>
          ) : (
            pedidosFiltrados.map((pedido, index) => {
              const saldoDevedor = calcularSaldoDevedor(pedido.valor_orcamento, pedido.valor_pago || 0);
              
              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{pedido.numero_pedido}</CardTitle>
                            <Badge className={getStatusColor(pedido.status)}>
                              {pedido.status.replace('_', ' ').charAt(0).toUpperCase() + pedido.status.replace('_', ' ').slice(1)}
                            </Badge>
                            <Badge className={getPrioridadeColor(pedido.prioridade)}>
                              {pedido.prioridade.charAt(0).toUpperCase() + pedido.prioridade.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Cliente:</strong> {pedido.cliente_nome}
                            </div>
                            <div>
                              <strong>Produto:</strong> {pedido.tipo_sofa}
                            </div>
                            <div>
                              <strong>Cor/Tecido:</strong> {pedido.cor || 'N/A'} - {pedido.tecido || 'N/A'}
                            </div>
                            <div>
                              <strong>Entrega:</strong> {pedido.data_previsao_entrega ? new Date(pedido.data_previsao_entrega).toLocaleDateString('pt-BR') : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVisualizarPedido(pedido)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditarPedido(pedido)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExcluirPedido(pedido)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Orçamento</p>
                          <p className="font-semibold text-lg">R$ {(pedido.valor_orcamento || 0).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Pago</p>
                          <p className="font-semibold text-lg text-green-600">R$ {(pedido.valor_pago || 0).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                          <p className={`font-semibold text-lg ${
                            saldoDevedor > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            R$ {saldoDevedor.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {pedido.observacoes && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm"><strong>Observações:</strong> {pedido.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Dialog de Detalhes do Pedido */}
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detalhes do Pedido {pedidoSelecionado?.numero_pedido}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{pedidoSelecionado?.cliente_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{pedidoSelecionado?.cliente_telefone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{pedidoSelecionado?.cliente_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{pedidoSelecionado?.cliente_endereco || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Produto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Informações do Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Sofá</p>
                    <p className="font-medium">{pedidoSelecionado?.tipo_sofa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{pedidoSelecionado?.cor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tecido</p>
                    <p className="font-medium">{pedidoSelecionado?.tecido || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensões</p>
                    <p className="font-medium">{pedidoSelecionado?.dimensoes || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Financeiras */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Informações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Orçamento</p>
                    <p className="font-medium text-lg">R$ {(pedidoSelecionado?.valor_orcamento || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                    <p className="font-medium text-lg text-green-600">R$ {(pedidoSelecionado?.valor_pago || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                    <p className={`font-medium text-lg ${
                      pedidoSelecionado && calcularSaldoDevedor(pedidoSelecionado.valor_orcamento || 0, pedidoSelecionado.valor_pago || 0) > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      R$ {pedidoSelecionado && calcularSaldoDevedor(pedidoSelecionado.valor_orcamento || 0, pedidoSelecionado.valor_pago || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Cronograma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Pedido</p>
                    <p className="font-medium">{pedidoSelecionado?.created_at ? new Date(pedidoSelecionado.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                    <p className="font-medium">{pedidoSelecionado?.data_previsao_entrega ? new Date(pedidoSelecionado.data_previsao_entrega).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={pedidoSelecionado && getStatusColor(pedidoSelecionado.status)}>
                      {pedidoSelecionado?.status.replace('_', ' ').charAt(0).toUpperCase() + pedidoSelecionado?.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prioridade</p>
                    <Badge className={pedidoSelecionado && getPrioridadeColor(pedidoSelecionado.prioridade)}>
                      {pedidoSelecionado?.prioridade.charAt(0).toUpperCase() + pedidoSelecionado?.prioridade.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observações */}
            {pedidoSelecionado?.observacoes && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{pedidoSelecionado.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Pedidos;
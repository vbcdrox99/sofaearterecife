import { useState, useEffect } from 'react';
import { 
  Package,
  Wrench,
  Hammer,
  Scissors,
  Shirt,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  Play,
  CheckCircle
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePedidos } from '@/hooks/usePedidos';
import { producaoService, ItemProducao, StatusProducao } from '@/lib/supabase';

const Dashboard = () => {
  const { pedidos } = usePedidos();
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [loadingProducao, setLoadingProducao] = useState(true);
  const [datasVisiveis, setDatasVisiveis] = useState<{[key: string]: boolean}>({});
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'novos' | 'iniciados' | 'finalizados'>('todos');

  useEffect(() => {
    carregarDadosProducao();
  }, []);

  const carregarDadosProducao = async () => {
    try {
      setLoadingProducao(true);
      const dados = await producaoService.getAll();
      setItensProducao(dados);
    } catch (error) {
      console.error('Erro ao carregar dados de produção:', error);
    } finally {
      setLoadingProducao(false);
    }
  };

  const getStatusColor = (status: StatusProducao) => {
    const colors = {
      'pendente': 'bg-red-500',
      'iniciado': 'bg-yellow-500',
      'supervisao': 'bg-blue-500',
      'finalizado': 'bg-green-500'
    };
    return colors[status];
  };

  const getStatusText = (status: StatusProducao) => {
    const texts = {
      'pendente': 'Pendente',
      'iniciado': 'Iniciado',
      'supervisao': 'Supervisão',
      'finalizado': 'Finalizado'
    };
    return texts[status];
  };

  const getEtapaIcon = (etapa: string) => {
    const icons = {
      'marcenaria': Hammer,
      'corte_costura': Scissors,
      'espuma': Package,
      'bancada': Wrench,
      'tecido': Shirt
    };
    return icons[etapa as keyof typeof icons] || Package;
  };

  const getEtapaLabel = (etapa: string) => {
    const labels = {
      'marcenaria': 'Marcenaria',
      'corte_costura': 'Corte e Costura',
      'espuma': 'Espuma',
      'bancada': 'Bancada',
      'tecido': 'Tecido'
    };
    return labels[etapa as keyof typeof labels] || etapa;
  };

  // Agrupar itens de produção por pedido
  const pedidosComProducao = pedidos.map(pedido => {
    const itensRelacionados = itensProducao.filter(item => item.pedido_id === pedido.id);
    return {
      ...pedido,
      itensProducao: itensRelacionados
    };
  }).filter(pedido => pedido.itensProducao.length > 0);

  // Calcular estatísticas dos pedidos
  const pedidosNovos = pedidosComProducao.filter(pedido => 
    pedido.itensProducao.every(item => item.status === 'pendente')
  ).length;
  
  const pedidosIniciados = pedidosComProducao.filter(pedido => 
    pedido.itensProducao.some(item => item.status === 'iniciado' || item.status === 'supervisao') &&
    !pedido.itensProducao.every(item => item.status === 'finalizado')
  ).length;
  
  const pedidosFinalizados = pedidosComProducao.filter(pedido => 
    pedido.itensProducao.length > 0 && pedido.itensProducao.every(item => item.status === 'finalizado')
  ).length;

  // Filtrar pedidos baseado no filtro ativo
  const pedidosFiltrados = pedidosComProducao.filter(pedido => {
    switch (filtroAtivo) {
      case 'novos':
        return pedido.itensProducao.every(item => item.status === 'pendente');
      case 'iniciados':
        return pedido.itensProducao.some(item => item.status === 'iniciado' || item.status === 'supervisao') &&
               !pedido.itensProducao.every(item => item.status === 'finalizado');
      case 'finalizados':
        return pedido.itensProducao.length > 0 && pedido.itensProducao.every(item => item.status === 'finalizado');
      default:
        return true;
    }
  });

  return (
    <DashboardLayout
      title="Painel de Controle - Sofá e Arte"
      description="Visão geral do sistema de produção Sofá e Arte"
    >
      <div className="space-y-8">
        {/* Estatísticas dos Pedidos */}
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between space-x-6">
              <button 
                onClick={() => setFiltroAtivo('novos')}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-blue-50 ${
                  filtroAtivo === 'novos' ? 'bg-blue-100 ring-2 ring-blue-300' : ''
                }`}
              >
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Novos</p>
                  <p className="text-lg font-bold text-blue-700">{pedidosNovos}</p>
                </div>
              </button>
              
              <button 
                onClick={() => setFiltroAtivo('iniciados')}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-orange-50 ${
                  filtroAtivo === 'iniciados' ? 'bg-orange-100 ring-2 ring-orange-300' : ''
                }`}
              >
                <div className="p-2 bg-orange-100 rounded-full">
                  <Play className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Iniciados</p>
                  <p className="text-lg font-bold text-orange-700">{pedidosIniciados}</p>
                </div>
              </button>
              
              <button 
                onClick={() => setFiltroAtivo('finalizados')}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-green-50 ${
                  filtroAtivo === 'finalizados' ? 'bg-green-100 ring-2 ring-green-300' : ''
                }`}
              >
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Finalizados</p>
                  <p className="text-lg font-bold text-green-700">{pedidosFinalizados}</p>
                </div>
              </button>
            </div>
            
            {filtroAtivo !== 'todos' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button 
                  onClick={() => setFiltroAtivo('todos')}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Mostrar todos os pedidos
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Status de Produção de Todos os Pedidos */}
        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="text-base">Status de Produção - Todos os Pedidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingProducao ? (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-xs text-muted-foreground">Carregando dados de produção...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                  {/* Layout Planilha */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Container com scroll horizontal para mobile */}
                    <div className="overflow-x-auto">
                      {/* Cabeçalho da Tabela */}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 min-w-[1200px]">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          <div className="col-span-1">Nº Pedido</div>
                          <div className="col-span-1">Tipo</div>
                          <div className="col-span-1">Entrega</div>
                          <div className="col-span-1">Espuma</div>
                          <div className="col-span-1">Tecido</div>
                          <div className="col-span-1">Tipo Pé</div>
                          <div className="col-span-1">Braço</div>
                          <div className="col-span-3">Status Produção</div>
                          <div className="col-span-1">Cliente</div>
                          <div className="col-span-1">Ações</div>
                        </div>
                      </div>

                      {/* Conteúdo da Tabela */}
                      <div className="divide-y divide-gray-200 min-w-[1200px]">
                        {pedidosFiltrados.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {filtroAtivo === 'todos' 
                              ? 'Nenhum pedido em produção encontrado.' 
                              : `Nenhum pedido ${filtroAtivo} encontrado.`
                            }
                          </div>
                        ) : (
                          pedidosFiltrados.map((pedido, index) => (
                          <div key={pedido.id} className={`px-4 py-3 hover:bg-gray-100 transition-colors ${
                             index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                           }`}>
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Número do Pedido */}
                              <div className="col-span-1">
                                <div className="flex items-center space-x-2">
                                  <Package className="w-4 h-4 text-primary" />
                                  <span className="font-semibold text-sm">#{pedido.numero_pedido}</span>
                                </div>
                              </div>

                              {/* Tipo */}
                              <div className="col-span-1">
                                <span className="text-sm text-gray-900">{pedido.tipo_sofa || 'N/A'}</span>
                              </div>

                              {/* Data de Entrega */}
                              <div className="col-span-1">
                                <span className="text-sm text-gray-900">
                                  {pedido.data_previsao_entrega ? 
                                    new Date(pedido.data_previsao_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) :
                                    'N/A'
                                  }
                                </span>
                              </div>

                              {/* Espuma */}
                              <div className="col-span-1">
                                <span className="text-sm text-gray-900">{pedido.espuma || 'D33'}</span>
                              </div>

                              {/* Tecido */}
                              <div className="col-span-1">
                                <span className="text-sm text-gray-900 truncate">{pedido.tecido || 'Suede Premium'}</span>
                              </div>

                              {/* Tipo de Pé */}
                              <div className="col-span-1">
                                <span className="text-sm text-gray-900 truncate">{pedido.pe || 'Madeira Escura'}</span>
                              </div>

                              {/* Braço */}
                              <div className="col-span-1">
                                <span className="text-sm text-gray-900 truncate">{pedido.braco || 'Reto'}</span>
                              </div>

                              {/* Status de Produção */}
                              <div className="col-span-3">
                                <div className="flex items-center space-x-2">
                                  {pedido.itensProducao?.map((item) => {
                                    const IconComponent = getEtapaIcon(item.etapa);
                                    const currentStatus = item.status || 'pendente';
                                    
                                    return (
                                      <div key={item.id} className="flex items-center space-x-1 bg-gray-100 rounded-md px-2 py-1">
                                        <IconComponent className="w-3 h-3 text-gray-600" />
                                        <div 
                                          className={`w-2 h-2 rounded-full ${
                                            currentStatus === 'pendente' ? 'bg-red-500' :
                                            currentStatus === 'iniciado' ? 'bg-yellow-500' :
                                            currentStatus === 'supervisao' ? 'bg-blue-500' :
                                            currentStatus === 'finalizado' ? 'bg-green-500' :
                                            'bg-gray-400'
                                          }`}
                                          title={`${getEtapaLabel(item.etapa)}: ${getStatusText(currentStatus)}`}
                                        ></div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Cliente (escondido por padrão) */}
                              <div className="col-span-1">
                                <button 
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  title={pedido.cliente_nome}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Ações */}
                              <div className="col-span-1">
                                <div className="flex items-center space-x-2">
                                  {/* Ícone para observações */}
                                  {pedido.observacoes && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button 
                                          className="text-gray-400 hover:text-gray-600 transition-colors"
                                          title={pedido.observacoes}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Observações - Pedido #{pedido.numero_pedido}</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                          <p className="text-gray-700">{pedido.observacoes}</p>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  
                                  {/* Ícone para horários */}
                                  <button 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Ver horários de início e término"
                                    onClick={() => setDatasVisiveis(prev => ({ ...prev, [pedido.id]: !prev[pedido.id] }))}
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Ícone para expandir detalhes */}
                                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Datas expandidas */}
                            {datasVisiveis[pedido.id] && (
                              <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 rounded-lg p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                  {pedido.itensProducao.map((item) => (
                                    <div key={item.id} className="space-y-1">
                                      <h4 className="font-medium text-gray-900">{getEtapaLabel(item.etapa)}</h4>
                                      {pedido.created_at && (
                                        <p className="text-gray-600"><strong>Pedido criado:</strong> {new Date(pedido.created_at).toLocaleDateString('pt-BR')} às {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                      )}
                                      {item.data_inicio && (
                                        <p className="text-gray-600"><strong>Etapa iniciada:</strong> {new Date(item.data_inicio).toLocaleDateString('pt-BR')} às {new Date(item.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                      )}
                                      {item.data_conclusao && (
                                        <p className="text-gray-600"><strong>Etapa finalizada:</strong> {new Date(item.data_conclusao).toLocaleDateString('pt-BR')} às {new Date(item.data_conclusao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                      )}
                                      {!item.data_inicio && !item.data_conclusao && (
                                        <p className="text-gray-400">Etapa ainda não foi iniciada</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
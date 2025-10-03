import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Hammer, Scissors, Package, Wrench, Shirt, Loader2, Eye, RefreshCw, Camera } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { producaoService, ItemProducao, StatusProducao } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PedidoPhotosModal from '@/components/PedidoPhotosModal';

const Producao = () => {
  const { toast } = useToast();
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [abaAtiva, setAbaAtiva] = useState('marcenaria');
  const [carregando, setCarregando] = useState(true);
  const [statusItems, setStatusItems] = useState<{[key: string]: StatusProducao}>({});
  const [pedidoPhotosModal, setPedidoPhotosModal] = useState<{ isOpen: boolean; pedidoId: string | null }>({
    isOpen: false,
    pedidoId: null
  });

  useEffect(() => {
    carregarItensProducao();
  }, [abaAtiva]);

  const carregarItensProducao = async () => {
    try {
      setCarregando(true);
      const dados = await producaoService.getByEtapa(abaAtiva as ItemProducao['etapa']);
      const dadosOrdenados = [...dados].sort((a, b) => {
        const diasA = calcularDiasRestantes(a.pedidos?.data_previsao_entrega);
        const diasB = calcularDiasRestantes(b.pedidos?.data_previsao_entrega);
        if (diasA === null && diasB === null) return 0;
        if (diasA === null) return 1;
        if (diasB === null) return -1;
        return diasA - diasB;
      });
      setItensProducao(dadosOrdenados);
      
      // Inicializar status dos itens baseado no banco
      const initialStatus: {[key: string]: StatusProducao} = {};
      dados.forEach(item => {
        initialStatus[item.id] = item.status || 'pendente';
      });
      setStatusItems(initialStatus);
    } catch (error) {
      console.error('Erro ao carregar itens de produção:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os itens de produção.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  const getStatusColor = (status: StatusProducao) => {
    const colors = {
      'pendente': 'bg-red-100 text-red-800 border-red-200',
      'iniciado': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'supervisao': 'bg-blue-100 text-blue-800 border-blue-200',
      'finalizado': 'bg-green-100 text-green-800 border-green-200'
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

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Urgência por data de entrega (igual ao Dashboard)
  const calcularDiasRestantes = (dataEntrega: string | undefined) => {
    if (!dataEntrega) return null;
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    const diffTime = entrega.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCorUrgencia = (dataEntrega: string | undefined) => {
    const diasRestantes = calcularDiasRestantes(dataEntrega);
    if (diasRestantes === null) return 'bg-gray-300';
    if (diasRestantes <= 2) return 'bg-red-500';
    if (diasRestantes <= 5) return 'bg-yellow-500';
    if (diasRestantes <= 10) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getTextoUrgencia = (dataEntrega: string | undefined) => {
    const diasRestantes = calcularDiasRestantes(dataEntrega);
    if (diasRestantes === null) return 'Sem data';
    if (diasRestantes < 0) return `${Math.abs(diasRestantes)} dias atrasado`;
    if (diasRestantes === 0) return 'Entrega hoje';
    if (diasRestantes === 1) return '1 dia restante';
    return `${diasRestantes} dias restantes`;
  };

  const handleStatusChange = async (itemId: string, novoStatus: StatusProducao) => {
    try {
      // Atualizar estado local imediatamente
      setStatusItems(prev => ({
        ...prev,
        [itemId]: novoStatus
      }));

      // Atualizar no banco de dados
      await producaoService.updateStatus(itemId, novoStatus);
      toast({
        title: 'Status Atualizado',
        description: `A etapa foi marcada como ${getStatusText(novoStatus).toLowerCase()}.`,
      });
      
      // Recarregar dados para sincronizar
      await carregarItensProducao();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Reverter mudança local em caso de erro
      setStatusItems(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da etapa.',
        variant: 'destructive',
      });
    }
  };

  const getIconeEtapa = (etapa: string) => {
    const icones = {
      'marcenaria': <Hammer className="w-4 h-4" />,
      'corte_costura': <Scissors className="w-4 h-4" />,
      'espuma': <Package className="w-4 h-4" />,
      'bancada': <Wrench className="w-4 h-4" />,
      'tecido': <Shirt className="w-4 h-4" />
    };
    return icones[etapa as keyof typeof icones];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button onClick={carregarItensProducao} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Abas de Produção */}
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="marcenaria" className="flex items-center gap-2">
              {getIconeEtapa('marcenaria')}
              MARCENARIA
            </TabsTrigger>
            <TabsTrigger value="corte_costura" className="flex items-center gap-2">
              {getIconeEtapa('corte_costura')}
              CORTE COSTURA
            </TabsTrigger>
            <TabsTrigger value="espuma" className="flex items-center gap-2">
              {getIconeEtapa('espuma')}
              ESPUMA
            </TabsTrigger>
            <TabsTrigger value="bancada" className="flex items-center gap-2">
              {getIconeEtapa('bancada')}
              BANCADA
            </TabsTrigger>
            <TabsTrigger value="tecido" className="flex items-center gap-2">
              {getIconeEtapa('tecido')}
              TECIDO
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das Abas */}
          {['marcenaria', 'corte_costura', 'espuma', 'bancada', 'tecido'].map((etapa) => (
            <TabsContent key={etapa} value={etapa} className="space-y-2">
              {carregando ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : itensProducao.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum item em produção
                    </h3>
                    <p className="text-gray-500">
                      Não há itens na etapa de {etapa.replace('_', ' ')} no momento.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                itensProducao.map((item, index) => {
                  const currentStatus = statusItems[item.id] || item.status || 'pendente';
                  
                  return (
                    <Card key={item.id} className={`relative p-4 hover:shadow-md transition-shadow ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}>
                      {/* Barra de urgência na lateral esquerda */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCorUrgencia(item.pedidos?.data_previsao_entrega)}`}></div>
                      {/* Primeira linha - Informações Principais */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-8 flex-1">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pedido</span>
                            <span className="text-lg font-bold text-gray-900">#{item.pedidos?.numero_pedido || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</span>
                            <span className="text-sm font-medium text-gray-900">{item.pedidos?.cliente_nome || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Produto</span>
                            <span className="text-sm text-gray-900">{item.pedidos?.tipo_sofa || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Serviço</span>
                            <span className="text-sm text-gray-900">{item.pedidos?.tipo_servico || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entrega</span>
                            <span className="text-sm text-gray-900">
                              {item.pedidos?.data_previsao_entrega ? 
                                new Date(item.pedidos.data_previsao_entrega).toLocaleDateString('pt-BR') : 
                                'N/A'
                              }
                            </span>
                            <span className={`text-xs font-medium ${
                              calcularDiasRestantes(item.pedidos?.data_previsao_entrega) !== null && calcularDiasRestantes(item.pedidos?.data_previsao_entrega)! <= 2 
                                ? 'text-red-600' 
                                : calcularDiasRestantes(item.pedidos?.data_previsao_entrega) !== null && calcularDiasRestantes(item.pedidos?.data_previsao_entrega)! <= 5
                                ? 'text-yellow-600'
                                : 'text-gray-500'
                            }`}>
                              {getTextoUrgencia(item.pedidos?.data_previsao_entrega)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Status e Observações */}
                        <div className="flex items-center space-x-3">
                          <Badge className={`px-3 py-1 text-xs font-medium ${getStatusColor(currentStatus)}`}>
                            {getStatusText(currentStatus)}
                          </Badge>
                          
                          {/* Ícone para fotos */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-blue-600"
                            title="Ver fotos do pedido"
                            onClick={() => setPedidoPhotosModal({ isOpen: true, pedidoId: item.pedido_id })}
                          >
                            <Camera className="w-4 h-4" />
                          </Button>

                          {item.pedidos?.observacoes && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Descrição do Pedido #{item.pedidos?.numero_pedido}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <p className="text-gray-700">{item.pedidos.observacoes}</p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {/* Segunda linha - Especificações e Ações */}
                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-gray-100">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                            <span className="text-gray-600">Cor: </span>
                            <span className="font-medium text-gray-900">{item.pedidos?.cor || 'N/A'}</span>
                          </div>
                          <div className="bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                             <span className="text-gray-600">Espuma: </span>
                             <span className="font-medium text-gray-900">{item.pedidos?.espuma || 'N/A'}</span>
                           </div>
                           <div className="bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                             <span className="text-gray-600">Tecido: </span>
                             <span className="font-medium text-gray-900">{item.pedidos?.tecido || 'N/A'}</span>
                           </div>
                           <div className="bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                             <span className="text-gray-600">Pé: </span>
                             <span className="font-medium text-gray-900">{item.pedidos?.tipo_pe || 'N/A'}</span>
                           </div>
                           <div className="bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                             <span className="text-gray-600">Braço: </span>
                             <span className="font-medium text-gray-900">{item.pedidos?.braco || 'N/A'}</span>
                           </div>
                        </div>
                        
                        {/* Botões de Ação */}
                        <div className="flex space-x-2 ml-4">
                          <div className="flex space-x-1">
                            {currentStatus !== 'pendente' && (
                              <Button 
                                onClick={() => handleStatusChange(item.id, 'pendente')}
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Pendente
                              </Button>
                            )}
                            {currentStatus !== 'iniciado' && (
                              <Button 
                                onClick={() => handleStatusChange(item.id, 'iniciado')}
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                              >
                                Iniciar
                              </Button>
                            )}
                            {currentStatus !== 'supervisao' && (
                              <Button 
                                onClick={() => handleStatusChange(item.id, 'supervisao')}
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                Supervisão
                              </Button>
                            )}
                            {currentStatus !== 'finalizado' && (
                              <Button 
                                onClick={() => handleStatusChange(item.id, 'finalizado')}
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
                              >
                                Finalizar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modal de Fotos do Pedido */}
      <PedidoPhotosModal
        isOpen={pedidoPhotosModal.isOpen}
        onClose={() => setPedidoPhotosModal({ isOpen: false, pedidoId: null })}
        pedidoId={pedidoPhotosModal.pedidoId}
      />
    </DashboardLayout>
  );
};

export default Producao;
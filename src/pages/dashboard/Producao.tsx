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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Producao = () => {
  const { toast } = useToast();
  const { selectedStore, isAdmin } = useAuth();
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [pedidoItens, setPedidoItens] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState('marcenaria');
  const [carregando, setCarregando] = useState(true);
  const [statusItems, setStatusItems] = useState<{[key: string]: StatusProducao}>({});
  const [pedidoPhotosModal, setPedidoPhotosModal] = useState<{ isOpen: boolean; pedidoId: string | null; pedidoItemId: string | null }>({
    isOpen: false,
    pedidoId: null,
    pedidoItemId: null,
  });

  useEffect(() => {
    carregarItensProducao();
  }, [abaAtiva, selectedStore]);

  const carregarItensProducao = async () => {
    try {
      setCarregando(true);
      const dados = await producaoService.getByEtapa(abaAtiva as ItemProducao['etapa'], selectedStore);
      const dadosOrdenados = [...dados].sort((a, b) => {
        const diasA = calcularDiasRestantes(a.pedidos?.data_previsao_entrega);
        const diasB = calcularDiasRestantes(b.pedidos?.data_previsao_entrega);
        if (diasA === null && diasB === null) return 0;
        if (diasA === null) return 1;
        if (diasB === null) return -1;
        return diasA - diasB;
      });
      setItensProducao(dadosOrdenados);

      // Carregar itens de pedido (produtos) por IDs de itens_producao
      const pedidoItemIds = Array.from(new Set(dadosOrdenados.map(d => d.pedido_item_id).filter(Boolean))) as string[];
      if (pedidoItemIds.length > 0) {
        const { data: itens, error } = await supabase
          .from('pedido_itens')
          .select('*')
          .in('id', pedidoItemIds)
          .order('sequencia', { ascending: true });
        if (!error && Array.isArray(itens)) {
          setPedidoItens(itens);
        } else {
          setPedidoItens([]);
        }
      } else {
        setPedidoItens([]);
      }
      
      // Inicializar status dos itens baseado no banco
      const initialStatus: {[key: string]: StatusProducao} = {};
      dadosOrdenados.forEach(item => {
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

  const getStatusBadgeVariant = (status: StatusProducao) => {
    const variants = {
      'pendente': 'destructive',
      'iniciado': 'secondary',
      'supervisao': 'outline',
      'finalizado': 'default'
    } as const;
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: StatusProducao) => getStatusText(status);

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatarDataEntrega = (data: string | null | undefined) => {
    if (!data) return 'Sem data';
    const dt = new Date(data);
    if (isNaN(dt.getTime())) return 'Sem data';
    return dt.toLocaleDateString('pt-BR');
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

  const getEtapaLabel = (etapa: string) => {
    const labels = {
      'marcenaria': 'Marcenaria',
      'corte_costura': 'Corte e Costura',
      'espuma': 'Espuma',
      'bancada': 'Bancada',
      'tecido': 'Tecido'
    } as const;
    return labels[etapa as keyof typeof labels] || etapa;
  };

  const renderEtapaBadge = (etapa: string) => (
    <Badge variant="outline" className="flex items-center gap-1.5">
      {getIconeEtapa(etapa)}
      <span className="text-[11px] uppercase tracking-wide">{getEtapaLabel(etapa)}</span>
    </Badge>
  );

  const renderStatusButtons = (itemId: string, status: StatusProducao) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full mt-2">
      <Button
        size="lg"
        variant={status === 'pendente' ? 'default' : 'outline'}
        className={`h-14 font-bold text-sm uppercase ${status === 'pendente' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-gray-500'}`}
        onClick={() => handleStatusChange(itemId, 'pendente')}
      >
        <Clock className="w-5 h-5 mr-2" /> PENDENTE
      </Button>
      <Button
        size="lg"
        variant={status === 'iniciado' ? 'default' : 'outline'}
        className={`h-14 font-bold text-sm uppercase ${status === 'iniciado' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-none' : 'text-gray-500'}`}
        onClick={() => handleStatusChange(itemId, 'iniciado')}
      >
        <Loader2 className="w-5 h-5 mr-2" /> INICIAR
      </Button>
      <Button
        size="lg"
        variant={status === 'supervisao' ? 'default' : 'outline'}
        className={`h-14 font-bold text-sm uppercase ${status === 'supervisao' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-500'}`}
        onClick={() => handleStatusChange(itemId, 'supervisao')}
      >
        <Eye className="w-5 h-5 mr-2" /> REVISÃO
      </Button>
      <Button
        size="lg"
        variant={status === 'finalizado' ? 'default' : 'outline'}
        className={`h-14 font-bold text-sm uppercase ${status === 'finalizado' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-500'}`}
        onClick={() => handleStatusChange(itemId, 'finalizado')}
      >
        <CheckCircle className="w-5 h-5 mr-2" /> PRONTO
      </Button>
    </div>
  );

  // Expandir cada item de produção diretamente para seu produto relacionado (sem duplicar por pedido)
  const itensExpandido = itensProducao
    .map((item) => {
      const pedidoItem = pedidoItens.find((pi) => pi.id === item.pedido_item_id);
      return { item, pedidoItem };
    })
    .filter(({ item, pedidoItem }) => {
      // Se houver pedidoItem, respeitar as etapas_necessarias do produto
      if (pedidoItem && Array.isArray(pedidoItem.etapas_necessarias)) {
        return pedidoItem.etapas_necessarias.includes(item.etapa);
      }
      // Caso não haja pedido_item vinculado, usar etapas do pedido (fallback)
      const pedidoEtapas = item.pedidos?.etapas_necessarias as string[] | undefined;
      if (Array.isArray(pedidoEtapas)) {
        return pedidoEtapas.includes(item.etapa);
      }
      // Sem metadados de etapas, não filtra (mantém visível)
      return true;
    });

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
              ) : itensExpandido.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum item em produção
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Não há itens na etapa de {etapa.replace('_', ' ')} no momento.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                itensExpandido.map(({ item, pedidoItem }, index) => {
                  const currentStatus = statusItems[item.id] || item.status || 'pendente';
                  const numeroPedido = item.pedidos?.numero_pedido ? String(item.pedidos.numero_pedido).padStart(3, '0') : 'N/A';
                  const sufixoSeq = pedidoItem?.sequencia && pedidoItem.sequencia > 1 ? `/${pedidoItem.sequencia}` : '';
                  const diasRestantes = calcularDiasRestantes(item.pedidos?.data_previsao_entrega);
                  const observacoes = pedidoItem?.observacoes || item.pedidos?.observacoes;
                  
                  return (
                    <Card key={`${item.id}-${pedidoItem?.id || 'seq1'}`} className="relative p-0 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-card border-2 border-gray-200">
                      
                      {/* Cabeçalho de Urgência (Visível e Claro) */}
                      {diasRestantes !== null && diasRestantes <= 5 && (
                        <div className={`w-full text-center text-white font-bold py-1.5 uppercase tracking-wider text-xs md:text-sm ${diasRestantes < 0 ? 'bg-red-600' : diasRestantes === 0 ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                          {diasRestantes < 0 ? `🚨 ATRASADO (${Math.abs(diasRestantes)} DIAS) 🚨` : diasRestantes === 0 ? `⚠️ ENTREGA HOJE ⚠️` : `⚠️ ENTREGA EM ${diasRestantes} DIAS`}
                        </div>
                      )}

                      <div className="p-4 md:p-6">
                        {/* Linha 1: Pedido e Botão de Fotos */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">#{numeroPedido}{sufixoSeq}</span>
                              <Badge variant={getStatusBadgeVariant(currentStatus)} className="uppercase px-2 py-1">{getStatusLabel(currentStatus)}</Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                              Cliente: <span className="font-bold text-gray-900 dark:text-white">{item.pedidos?.cliente_nome || 'N/A'}</span>
                            </p>
                          </div>
                          <Button 
                            variant="secondary" 
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm font-bold"
                            onClick={() => setPedidoPhotosModal({ isOpen: true, pedidoId: item.pedido_id, pedidoItemId: pedidoItem?.id || null })}
                          >
                            <Camera className="w-5 h-5 mr-2" /> FOTOS
                          </Button>
                        </div>

                        {/* Linha 2: Produto e Serviço (Destaque) */}
                        <div className="mb-4">
                          <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 uppercase">
                            {pedidoItem?.tipo_sofa || item.pedidos?.tipo_sofa || 'Produto N/A'}
                          </h3>
                          <p className="text-sm text-gray-500 font-bold uppercase mt-1">
                            Serviço: <span className="text-gray-800 dark:text-gray-200">{pedidoItem?.tipo_servico || item.pedidos?.tipo_servico || 'N/A'}</span>
                          </p>
                        </div>

                        {/* Bloco Cinza com a Ficha Técnica */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border border-gray-200 dark:border-gray-700 shadow-inner">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Espuma</span>
                            <span className="text-sm md:text-base font-black text-gray-900 dark:text-white">{pedidoItem?.espuma || item.pedidos?.espuma || '-'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tecido</span>
                            <span className="text-sm md:text-base font-black text-gray-900 dark:text-white">{pedidoItem?.tecido || item.pedidos?.tecido || '-'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Braço</span>
                            <span className="text-sm md:text-base font-black text-gray-900 dark:text-white">{pedidoItem?.braco || item.pedidos?.braco || '-'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pé</span>
                            <span className="text-sm md:text-base font-black text-gray-900 dark:text-white">{pedidoItem?.tipo_pe || item.pedidos?.tipo_pe || '-'}</span>
                          </div>
                        </div>

                        {/* Alerta de Observações (Destacado e visível para todos) */}
                        {observacoes && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg shadow-sm">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <span className="text-2xl">⚠️</span>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-black text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">Atenção Especial</h3>
                                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300 font-bold whitespace-pre-wrap">
                                  {observacoes}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rodapé: Botões de Status Gigantes */}
                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="mb-3">
                            {renderEtapaBadge(abaAtiva)}
                          </div>
                          {renderStatusButtons(item.id, currentStatus)}
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
        onClose={() => setPedidoPhotosModal({ isOpen: false, pedidoId: null, pedidoItemId: null })}
        pedidoId={pedidoPhotosModal.pedidoId!}
        pedidoItemId={pedidoPhotosModal.pedidoItemId}
      />
    </DashboardLayout>
  );
};

export default Producao;
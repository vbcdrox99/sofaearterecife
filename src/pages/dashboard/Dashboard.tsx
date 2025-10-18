import { useState, useEffect } from 'react';
import { 
  Package,
  Wrench,
  Hammer,
  Scissors,
  Shirt,
  ClipboardList,
  Eye,
  Edit,
  Calendar,
  FileText,
  Play,
  CheckCircle,
  Camera,
  Printer,
  CornerDownRight
} from 'lucide-react';
import { User } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePedidos } from '@/hooks/usePedidos';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { producaoService, ItemProducao, StatusProducao } from '@/lib/supabase';
import PedidoPhotosModal from '@/components/PedidoPhotosModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { pedidos } = usePedidos();
  const navigate = useNavigate();
  const { printRef, printCurrentView, isPrinting } = usePDFGenerator();
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [loadingProducao, setLoadingProducao] = useState(true);
  const [pedidoItens, setPedidoItens] = useState<any[]>([]);
  const [datasVisiveis, setDatasVisiveis] = useState<{[key: string]: boolean}>({});
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'novos' | 'iniciados' | 'finalizados'>('todos');
  const [filtroArea, setFiltroArea] = useState<'todos' | 'marcenaria' | 'corte_costura' | 'espuma' | 'bancada' | 'tecido'>('todos');
  const [pedidoPhotosModal, setPedidoPhotosModal] = useState<{ isOpen: boolean; pedidoId: string | null; pedidoItemId: string | null }>({
    isOpen: false,
    pedidoId: null,
    pedidoItemId: null,
  });

  useEffect(() => {
    carregarDadosProducao();
  }, []);

  const carregarDadosProducao = async () => {
    try {
      setLoadingProducao(true);
      const dados = await producaoService.getAll();
      setItensProducao(dados);
      // Carregar itens de pedido (produtos) para expandir em 443, 443/2, etc
      const pedidoIds = Array.from(new Set((dados || []).map(d => d.pedido_id))).filter(Boolean) as string[];
      if (pedidoIds.length > 0) {
        const { data: itens, error } = await supabase
          .from('pedido_itens')
          .select('*')
          .in('pedido_id', pedidoIds)
          .order('sequencia', { ascending: true });
        if (!error && Array.isArray(itens)) {
          setPedidoItens(itens);
        } else {
          setPedidoItens([]);
        }
      } else {
        setPedidoItens([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de produção:', error);
    } finally {
      setLoadingProducao(false);
    }
  };

  const getStatusColor = (status: StatusProducao) => {
    switch (status) {
      case 'pendente': return 'bg-red-500';
      case 'iniciado': return 'bg-yellow-500';
      case 'supervisao': return 'bg-blue-500';
      case 'finalizado': return 'bg-green-500';
      default: return 'bg-gray-400';
    };
  };

  const getStatusText = (status: StatusProducao) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'iniciado': return 'Iniciado';
      case 'supervisao': return 'Em Supervisão';
      case 'finalizado': return 'Finalizado';
      default: return 'Desconhecido';
    };
  };

  const getEtapaIcon = (etapa: string) => {
    switch (etapa) {
      case 'marcenaria': return Hammer;
      case 'corte_costura': return Scissors;
      case 'espuma': return Package;
      case 'bancada': return Wrench;
      case 'tecido': return Shirt;
      default: return Package;
    }
  };

  const getEtapaLabel = (etapa: string) => {
    switch (etapa) {
      case 'marcenaria': return 'Marcenaria';
      case 'corte_costura': return 'Corte e Costura';
      case 'espuma': return 'Espuma';
      case 'bancada': return 'Bancada';
      case 'tecido': return 'Tecido';
      default: return etapa;
    }
  };

  // Função para calcular dias restantes até a entrega
  const calcularDiasRestantes = (dataEntrega: string | null) => {
    if (!dataEntrega) return null;
    
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    const diffTime = entrega.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Função para determinar a cor de urgência
  const getCorUrgencia = (dataEntrega: string | null) => {
    const diasRestantes = calcularDiasRestantes(dataEntrega);
    
    if (diasRestantes === null) return 'bg-gray-300'; // Sem data
    if (diasRestantes <= 2) return 'bg-red-500'; // Vermelho - urgente
    if (diasRestantes <= 5) return 'bg-yellow-500'; // Amarelo - atenção
    if (diasRestantes <= 10) return 'bg-green-500'; // Verde - no prazo
    return 'bg-blue-500'; // Azul - muito tempo
  };

  // Função para obter texto de urgência
  const getTextoUrgencia = (dataEntrega: string | null) => {
    const diasRestantes = calcularDiasRestantes(dataEntrega);
    
    if (diasRestantes === null) return 'Sem data';
    if (diasRestantes < 0) return `${Math.abs(diasRestantes)} dias atrasado`;
    if (diasRestantes === 0) return 'Entrega hoje';
    if (diasRestantes === 1) return '1 dia restante';
    return `${diasRestantes} dias restantes`;
  };

  // Impressão nativa em A4 horizontal da visualização atual
  const handleGerarPDF = () => {
    const tituloBase =
      filtroAtivo === 'todos'
        ? 'Relatório de Todos os Pedidos'
        : filtroAtivo === 'novos'
        ? 'Relatório de Pedidos Novos'
        : filtroAtivo === 'iniciados'
        ? 'Relatório de Pedidos em Andamento'
        : 'Relatório de Pedidos Finalizados';

    const areaLabel = filtroArea === 'todos' ? 'GERAL/TODOS' : getEtapaLabel(filtroArea);
    const titulo = `${tituloBase} — Área: ${areaLabel}`;

    // Usa react-to-print para imprimir a tabela como está na tela
    printCurrentView(titulo);
  };

  const getIconeArea = (area: string) => {
    const commonClass = 'w-5 h-5 text-white';
    switch (area) {
      case 'marcenaria':
        return <Hammer className={commonClass} />;
      case 'corte_costura':
        return <Scissors className={commonClass} />;
      case 'espuma':
        return <Package className={commonClass} />;
      case 'bancada':
        return <Wrench className={commonClass} />;
      case 'tecido':
        return <Shirt className={commonClass} />;
      case 'todos':
      default:
        return <ClipboardList className={commonClass} />;
    }
  };

  const getCorArea = (area: string) => {
    switch (area) {
      case 'marcenaria':
        return '#8B4513'; // marrom madeira
      case 'corte_costura':
        return '#D94646'; // vermelho costura
      case 'espuma':
        return '#14B8A6'; // teal espuma
      case 'bancada':
        return '#6B7280'; // cinza bancada
      case 'tecido':
        return '#8B5CF6'; // roxo tecido
      case 'todos':
      default:
        return '#334155'; // slate para geral
    }
  };

  // Expandir pedidos por item (seq 1, 2, ...) para exibir 443 e 443/2
  const pedidosComProducao = pedidos.map(pedido => {
    const itensRelacionados = itensProducao.filter(item => item.pedido_id === pedido.id);
    return { pedido, itensProducao: itensRelacionados };
  })
  .filter(p => p.itensProducao.length > 0);

  const linhasExpandido = pedidosComProducao.flatMap(({ pedido, itensProducao }) => {
    const itensDoPedido = pedidoItens.filter(it => it.pedido_id === pedido.id);
    const base = (seq: number, itemId?: string, item?: any) => ({ pedido, itensProducao, seq, itemId, item });
    if (itensDoPedido.length === 0) {
      // Sem registros em pedido_itens: criar linha sintética seq 1 com ID único
      return [base(1, `synthetic-${pedido.id}-1`, undefined)];
    }
    return itensDoPedido.map((it: any) => base(it.sequencia ?? 1, it.id, it));
  })
  // Ordenar por urgência da entrega
  // Ordenar por data de entrega (mais urgentes primeiro)
  .sort((a, b) => {
    const diasA = calcularDiasRestantes(a.pedido.data_previsao_entrega);
    const diasB = calcularDiasRestantes(b.pedido.data_previsao_entrega);
    
    // Pedidos sem data vão para o final
    if (diasA === null && diasB === null) return 0;
    if (diasA === null) return 1;
    if (diasB === null) return -1;
    
    // Ordenar por urgência (menor número de dias primeiro)
    return diasA - diasB;
  });

  // Contadores para os filtros
  const pedidosNovos = pedidosComProducao.filter(p => 
    p.itensProducao.every(item => item.status === 'pendente')
  ).length;
  
  const pedidosIniciados = pedidosComProducao.filter(p => 
    p.itensProducao.some(item => item.status === 'iniciado' || item.status === 'supervisao') &&
    !p.itensProducao.every(item => item.status === 'finalizado')
  ).length;
  
  const pedidosFinalizados = pedidosComProducao.filter(p => 
    p.itensProducao.length > 0 && p.itensProducao.every(item => item.status === 'finalizado')
  ).length;

  // Filtrar pedidos baseado no filtro ativo
  let pedidosFiltrados = linhasExpandido.filter(({ pedido, itensProducao }) => {
    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'novos') {
      return itensProducao.every(item => item.status === 'pendente');
    }
    if (filtroAtivo === 'iniciados') {
      return itensProducao.some(item => item.status === 'iniciado' || item.status === 'supervisao') &&
             !itensProducao.every(item => item.status === 'finalizado');
    }
    if (filtroAtivo === 'finalizados') {
      return itensProducao.length > 0 && itensProducao.every(item => item.status === 'finalizado');
    }
    return true;
  });

  // Filtro por área de produção
  if (filtroArea !== 'todos') {
    pedidosFiltrados = pedidosFiltrados.filter(({ itensProducao }) =>
      itensProducao?.some(item => item.etapa === filtroArea)
    );
  }

  return (
    <DashboardLayout 
      title="Dashboard - Sofá e Arte"
      rightContent={
        <Card className="w-auto">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setFiltroAtivo('novos')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-blue-50 ${
                  filtroAtivo === 'novos' ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                }`}
              >
                <div className="p-1 bg-blue-100 rounded-full">
                  <FileText className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Novos</p>
                  <p className="text-xs font-bold text-blue-700">{pedidosNovos}</p>
                </div>
              </button>
              
              <button 
                onClick={() => setFiltroAtivo('iniciados')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-orange-50 ${
                  filtroAtivo === 'iniciados' ? 'bg-orange-50 ring-1 ring-orange-200' : ''
                }`}
              >
                <div className="p-1 bg-orange-100 rounded-full">
                  <Play className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Iniciados</p>
                  <p className="text-xs font-bold text-orange-700">{pedidosIniciados}</p>
                </div>
              </button>
              
              <button 
                onClick={() => setFiltroAtivo('finalizados')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-green-50 ${
                  filtroAtivo === 'finalizados' ? 'bg-green-50 ring-1 ring-green-200' : ''
                }`}
              >
                <div className="p-1 bg-green-100 rounded-full">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Finalizados</p>
                  <p className="text-xs font-bold text-green-700">{pedidosFinalizados}</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-8">
        {filtroAtivo !== 'todos' && (
          <div className="mb-4">
            <button 
              onClick={() => setFiltroAtivo('todos')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Mostrar todos os pedidos
            </button>
          </div>
        )}

        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span className="text-base">Status de Produção - Todos os Pedidos</span>
              </div>
              <Button
                onClick={handleGerarPDF}
                disabled={isPrinting || pedidosFiltrados.length === 0}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 no-print"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? 'Gerando...' : 'Gerar PDF'}</span>
              </Button>
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
                {/* Filtro por Área de Produção */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Filtro por área de produção</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {key: 'todos', label: 'GERAL/TODOS'},
                      {key: 'marcenaria', label: 'Marcenaria'},
                      {key: 'corte_costura', label: 'Corte Costura'},
                      {key: 'espuma', label: 'Espuma'},
                      {key: 'bancada', label: 'Bancada'},
                      {key: 'tecido', label: 'Tecido'},
                    ].map(({key, label}) => (
                      <Button
                        key={key}
                        variant={filtroArea === (key as typeof filtroArea) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroArea(key as typeof filtroArea)}
                        className="h-8"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Tabela de Pedidos */}
                <div ref={printRef} className="bg-white rounded-lg border border-gray-200 overflow-hidden print-table" data-table="pedidos-table">
                  {/* Cabeçalho de impressão (apenas no PDF) */}
                  <div className="hidden print:block">
                    <div className="px-4 py-3" style={{ backgroundColor: getCorArea(filtroArea) }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          {getIconeArea(filtroArea)}
                          <span className="text-base font-bold uppercase tracking-wide">Área: {filtroArea === 'todos' ? 'GERAL/TODOS' : getEtapaLabel(filtroArea)}</span>
                        </div>
                        <span className="text-xs text-white">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  {/* Cabeçalho da Tabela */}
                  <div className="overflow-x-auto">
                    {/* Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 min-w-[1200px]">
                      <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <div className="col-span-1">Nº Pedido</div>
                        <div className="col-span-1">Tipo</div>
                        <div className="col-span-1">Entrega</div>
                        <div className="col-span-1">Espuma</div>
                        <div className="col-span-1 print:col-span-2">Tecido</div>
                        <div className="col-span-1">Tipo Pé</div>
                        <div className="col-span-1">Braço</div>
                        <div className="col-span-3 print:col-span-2">Status Produção</div>
                        <div className="col-span-1 print-hide">Cliente</div>
                        <div className="col-span-1 print-hide">Ações</div>
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
                        pedidosFiltrados.map(({ pedido, itensProducao, seq, itemId, item }, index) => (
                          <div key={itemId || `${pedido.id}-${seq}-${index}` } className={`relative px-4 py-2 hover:bg-gray-50 transition-colors ${(seq && seq > 1) ? 'bg-gray-100' : 'bg-white'} ${
                            index !== pedidosFiltrados.length - 1 ? 'border-b border-gray-200' : ''
                          }`}>
                            {/* Barra de urgência na lateral esquerda */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCorUrgencia(pedido.data_previsao_entrega)} ${(seq && seq > 1) ? 'opacity-70' : ''}`}></div>
                            
                            <div className="grid grid-cols-12 gap-3 items-center">
                              {/* Número do Pedido + indicador de mesmo pedido (sub-item) */}
                              <div className="col-span-1">
                                <div className="flex items-center space-x-2">
                                  {(seq && seq > 1) ? (
                                    <CornerDownRight className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Package className="w-4 h-4 text-primary" />
                                  )}
                                  <span className="font-semibold text-sm">#{pedido.numero_pedido}{seq && seq > 1 ? `/${seq}` : ''}</span>
                                </div>
                              </div>

                              {/* Produto (Tipo de Sofá) - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 block truncate" title={(item?.tipo_sofa || pedido.tipo_sofa || 'N/A')}>
                                  {item?.tipo_sofa || pedido.tipo_sofa || 'N/A'}
                                </span>
                              </div>

                              {/* Data de Entrega */}
                              <div className="col-span-1">
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-900">
                                    {pedido.data_previsao_entrega ? 
                                      new Date(pedido.data_previsao_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) :
                                      'N/A'
                                    }
                                  </span>
                                  <span className={`text-xs font-medium ${
                                    calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 2 
                                      ? 'text-red-600' 
                                      : calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 5
                                      ? 'text-yellow-600'
                                      : 'text-gray-500'
                                  }`}>
                                    {getTextoUrgencia(pedido.data_previsao_entrega)}
                                  </span>
                                </div>
                              </div>

                              {/* Espuma - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 block truncate" title={(item?.espuma || pedido.espuma || 'D33')}>
                                  {item?.espuma || pedido.espuma || 'D33'}
                                </span>
                              </div>

                              {/* Tecido - por item */}
                              <div className="col-span-1 print:col-span-2 min-w-0">
                                <span className="text-sm text-gray-900 block truncate print:whitespace-normal print:break-words print:overflow-visible" title={(item?.tecido || pedido.tecido || 'Suede Premium')}>
                                  {item?.tecido || pedido.tecido || 'Suede Premium'}
                                </span>
                              </div>

                              {/* Tipo de Pé - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 block truncate" title={(item?.tipo_pe || pedido.tipo_pe || 'Madeira Escura')}>
                                  {item?.tipo_pe || pedido.tipo_pe || 'Madeira Escura'}
                                </span>
                              </div>

                              {/* Braço - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 block truncate" title={(item?.braco || pedido.braco || 'Reto')}>
                                  {item?.braco || pedido.braco || 'Reto'}
                                </span>
                              </div>


                              {/* Status de Produção (por produto) */}
                              <div className="col-span-3 print:col-span-2">
                                <div className="flex items-center space-x-1.5">
                                  {(itensProducao || [])
                                    .filter((ip) => {
                                      const pid = (ip as any)?.pedido_item_id ?? null;
                                      // Se há vínculo de item, mostrar apenas as etapas do produto correspondente.
                                      // Se não houver, manter compatibilidade exibindo todas as etapas do pedido.
                                      return pid == null ? true : pid === itemId;
                                    })
                                    .map((item) => {
                                      const IconComponent = getEtapaIcon(item.etapa);
                                      const currentStatus = item.status || 'pendente';

                                      return (
                                        <div key={item.id} className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200">
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

                              {/* Cliente (oculto na impressão) */}
                              <div className="col-span-1 print-hide">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button 
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                      title={pedido.cliente_nome}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Informações do Cliente
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Nome</p>
                                        <p className="text-sm font-medium">{pedido.cliente_nome || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Telefone</p>
                                        <p className="text-sm font-medium">{pedido.cliente_telefone || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{pedido.cliente_email || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Endereço</p>
                                        <p className="text-sm font-medium">{pedido.cliente_endereco || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>

                              {/* Ações (oculto na impressão) */}
                              <div className="col-span-1 print-hide">
                                <div className="flex items-center space-x-2">
                                  {/* Ícone para fotos */}
                                  <button
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Ver fotos do pedido"
                                    onClick={() => setPedidoPhotosModal({ isOpen: true, pedidoId: pedido.id, pedidoItemId: item?.id ?? null })}
                                  >
                                    <Camera className="w-4 h-4" />
                                  </button>

                                  {/* Ícone para editar pedido */}
                                  <button
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Editar pedido"
                                    onClick={() => navigate(`/dashboard/editar-pedido/${pedido.id}`)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  {/* Ícone para observações (prioriza observações do produto) */}
                                  {(item?.observacoes || pedido.observacoes) && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button
                                          className="text-gray-400 hover:text-gray-600 transition-colors"
                                          title={item?.observacoes || pedido.observacoes || ''}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>
                                            {item?.observacoes ? `Observações - Produto #${pedido.numero_pedido}${seq && seq > 1 ? `/${seq}` : ''}` : `Observações - Pedido #${pedido.numero_pedido}`}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                          <p className="text-gray-700">{item?.observacoes || pedido.observacoes}</p>
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
                                  
                                  {/* Ícone sem função removido */}
                                </div>
                              </div>
                            </div>
                            
                            {/* Datas expandidas */}
                              {datasVisiveis[pedido.id] && (
                              <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 rounded-lg p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                  {itensProducao.map((item) => (
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

export default Dashboard;
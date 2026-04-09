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
  CornerDownRight,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { User } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePedidos } from '@/hooks/usePedidos';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { producaoService, ItemProducao, StatusProducao } from '@/lib/supabase';
import PedidoPhotosModal from '@/components/PedidoPhotosModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { pedidos } = usePedidos();
  const { selectedStore, isAdmin, isGerente } = useAuth();
  const navigate = useNavigate();
  const { printRef, printCurrentView, isPrinting, generatePedidoPDF, generatePedidoClientePDF } = usePDFGenerator();
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [loadingProducao, setLoadingProducao] = useState(true);
  const [pedidoItens, setPedidoItens] = useState<any[]>([]);
  const [datasVisiveis, setDatasVisiveis] = useState<{ [key: string]: boolean }>({});
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'novos' | 'iniciados' | 'finalizados'>('todos');
  const [filtroArea, setFiltroArea] = useState<'todos' | 'marcenaria' | 'corte_costura' | 'espuma' | 'bancada' | 'tecido'>('todos');
  const [pedidoPhotosModal, setPedidoPhotosModal] = useState<{ isOpen: boolean; pedidoId: string | null; pedidoItemId: string | null }>({
    isOpen: false,
    pedidoId: null,
    pedidoItemId: null,
  });

  // Estado do modal de seleção de pedidos para PDF
  const [pdfModalAberto, setPdfModalAberto] = useState(false);
  const [pdfSelecionados, setPdfSelecionados] = useState<Set<string>>(new Set());
  const [pdfFiltroBusca, setPdfFiltroBusca] = useState('');
  const [pdfFiltroData, setPdfFiltroData] = useState('');

  useEffect(() => {
    carregarDadosProducao();
  }, [selectedStore]);

  const carregarDadosProducao = async () => {
    try {
      setLoadingProducao(true);
      const dados = await producaoService.getAll(selectedStore);
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

  // Impressão nativa em A4 horizontal da visualização atual (usando pedidos selecionados)
  const handleGerarPDF = () => {
    // Abre modal de seleção - pré-seleciona todos os visíveis
    const todosIds = new Set(pedidosFiltrados.map(({ pedido, seq }) => `${pedido.id}-${seq}`));
    setPdfSelecionados(todosIds);
    setPdfFiltroBusca('');
    setPdfFiltroData('');
    setPdfModalAberto(true);
  };

  const handleConfirmarGerarPDF = () => {
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

    setPdfModalAberto(false);
    // Usa react-to-print para imprimir a tabela como está na tela
    printCurrentView(titulo);
  };

  const getDiaSemana = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const formatDataCriacao = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const data = d.toLocaleDateString('pt-BR');
    const dia = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    // Capitalizar primeira letra
    return `${data} — ${dia.charAt(0).toUpperCase() + dia.slice(1)}`;
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
      title="Dashboard - Válleri"
      rightContent={
        <Card className="w-auto">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFiltroAtivo('novos')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${filtroAtivo === 'novos' ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' : ''
                  }`}
              >
                <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                  <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Novos</p>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{pedidosNovos}</p>
                </div>
              </button>

              <button
                onClick={() => setFiltroAtivo('iniciados')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 ${filtroAtivo === 'iniciados' ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800' : ''
                  }`}
              >
                <div className="p-1 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                  <Play className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Iniciados</p>
                  <p className="text-xs font-bold text-orange-700 dark:text-orange-300">{pedidosIniciados}</p>
                </div>
              </button>

              <button
                onClick={() => setFiltroAtivo('finalizados')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 ${filtroAtivo === 'finalizados' ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800' : ''
                  }`}
              >
                <div className="p-1 bg-green-100 dark:bg-green-900/40 rounded-full">
                  <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Finalizados</p>
                  <p className="text-xs font-bold text-green-700 dark:text-green-300">{pedidosFinalizados}</p>
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
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
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
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtro por área de produção</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'todos', label: 'GERAL/TODOS' },
                      { key: 'marcenaria', label: 'Marcenaria' },
                      { key: 'corte_costura', label: 'Corte Costura' },
                      { key: 'espuma', label: 'Espuma' },
                      { key: 'bancada', label: 'Bancada' },
                      { key: 'tecido', label: 'Tecido' },
                    ].map(({ key, label }) => (
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
                <div ref={printRef} className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border overflow-hidden print-table" data-table="pedidos-table">
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
                    <div className="bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border px-4 py-2 min-w-[1200px]">
                      <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="col-span-1">Nº Pedido</div>
                        <div className="col-span-1">Tipo</div>
                        <div className="col-span-1">Entrega</div>
                        <div className="col-span-1">Espuma</div>
                        <div className="col-span-1 print:col-span-2">Tecido</div>
                        <div className="col-span-1">Tipo Pé</div>
                        <div className="col-span-1">Braço</div>
                        <div className="col-span-1">Pagamento</div>
                        <div className="col-span-2 print:col-span-2">Status Produção</div>
                        <div className="col-span-1 print-hide">Cliente</div>
                        <div className="col-span-1 print-hide">Ações</div>
                      </div>
                    </div>

                    {/* Conteúdo da Tabela */}
                    <div className="divide-y divide-gray-200 dark:divide-border min-w-[1200px]">
                      {pedidosFiltrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {filtroAtivo === 'todos'
                            ? 'Nenhum pedido em produção encontrado.'
                            : `Nenhum pedido ${filtroAtivo} encontrado.`
                          }
                        </div>
                      ) : (
                        pedidosFiltrados.map(({ pedido, itensProducao, seq, itemId, item }, index) => (
                          <div key={itemId || `${pedido.id}-${seq}-${index}`} className={`relative px-4 py-2 hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors ${(seq && seq > 1) ? 'bg-gray-100 dark:bg-muted' : 'bg-white dark:bg-card'} ${index !== pedidosFiltrados.length - 1 ? 'border-b border-gray-200 dark:border-border' : ''
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
                                  <span className="font-semibold text-sm">#{String(pedido.numero_pedido).padStart(3, '0')}{seq && seq > 1 ? `/${seq}` : ''}</span>
                                </div>
                              </div>

                              {/* Produto (Tipo de Sofá) - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate" title={(item?.tipo_sofa || pedido.tipo_sofa || 'N/A')}>
                                  {item?.tipo_sofa || pedido.tipo_sofa || 'N/A'}
                                </span>
                              </div>

                              {/* Data de Entrega */}
                              <div className="col-span-1">
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {pedido.data_previsao_entrega ?
                                      new Date(pedido.data_previsao_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) :
                                      'N/A'
                                    }
                                  </span>
                                  <span className={`text-xs font-medium ${calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 2
                                    ? 'text-red-600 dark:text-red-400'
                                    : calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 5
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {getTextoUrgencia(pedido.data_previsao_entrega)}
                                  </span>
                                </div>
                              </div>

                              {/* Espuma - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate" title={(item?.espuma || pedido.espuma || 'D33')}>
                                  {item?.espuma || pedido.espuma || 'D33'}
                                </span>
                              </div>

                              {/* Tecido - por item */}
                              <div className="col-span-1 print:col-span-2 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate print:whitespace-normal print:break-words print:overflow-visible" title={(item?.tecido || pedido.tecido || 'Suede Premium')}>
                                  {item?.tecido || pedido.tecido || 'Suede Premium'}
                                </span>
                              </div>

                              {/* Tipo de Pé - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate" title={(item?.tipo_pe || pedido.tipo_pe || 'Madeira Escura')}>
                                  {item?.tipo_pe || pedido.tipo_pe || 'Madeira Escura'}
                                </span>
                              </div>

                              {/* Braço - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate" title={(item?.braco || pedido.braco || 'Reto')}>
                                  {item?.braco || pedido.braco || 'Reto'}
                                </span>
                              </div>

                              {/* Forma de Pagamento */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate" title={pedido.forma_pagamento || 'N/A'}>
                                  {pedido.forma_pagamento || 'N/A'}
                                </span>
                              </div>

                              {/* Status de Produção (por produto) */}
                              <div className="col-span-2 print:col-span-2">
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
                                        <div key={item.id} className="flex items-center space-x-1 bg-gray-50 dark:bg-muted rounded-lg px-2 py-1.5 border border-gray-200 dark:border-border">
                                          <IconComponent className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                          <div
                                            className={`w-2 h-2 rounded-full ${currentStatus === 'pendente' ? 'bg-red-500' :
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
                                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

                                    {/* Menu para gerar PDF (duas opções) */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          className="text-gray-400 hover:text-red-600 transition-colors"
                                          title="Gerar PDF"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => generatePedidoPDF(pedido.id)}>
                                          Ordem de Serviço
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => generatePedidoClientePDF(pedido.id)}>
                                          Pedido do Cliente
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Removido: botão pdfmake, seguimos com gerador SVG */}

                                    {/* Ícone para editar pedido */}
                                    {(isAdmin || isGerente) && (
                                      <button
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Editar pedido"
                                        onClick={() => navigate(`/dashboard/editar-pedido/${pedido.id}`)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    )}

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
                                              {item?.observacoes ? `Observações - Produto #${String(pedido.numero_pedido).padStart(3, '0')}${seq && seq > 1 ? `/${seq}` : ''}` : `Observações - Pedido #${String(pedido.numero_pedido).padStart(3, '0')}`}
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

      {/* Modal de Seleção de Pedidos para PDF */}
      <Dialog open={pdfModalAberto} onOpenChange={setPdfModalAberto}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Selecionar Pedidos para o PDF
            </DialogTitle>
          </DialogHeader>

          {/* Filtros */}
          <div className="flex gap-3 mt-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por Nº pedido..."
                value={pdfFiltroBusca}
                onChange={(e) => setPdfFiltroBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              type="date"
              value={pdfFiltroData}
              onChange={(e) => setPdfFiltroData(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              title="Filtrar por data de criação"
            />
          </div>

          {/* Controles de seleção */}
          {(() => {
            const listaFiltrada = pedidosFiltrados.filter(({ pedido, seq }) => {
              const chave = `${pedido.id}-${seq}`;
              const numPedido = String(pedido.numero_pedido ? String(pedido.numero_pedido).padStart(3, '0') : '').toLowerCase();
              const buscaOk = pdfFiltroBusca === '' || numPedido.includes(pdfFiltroBusca.toLowerCase());
              if (!buscaOk) return false;
              if (pdfFiltroData) {
                const dataCriacao = pedido.created_at ? pedido.created_at.split('T')[0] : '';
                if (dataCriacao !== pdfFiltroData) return false;
              }
              return true;
            });
            const todosIds = listaFiltrada.map(({ pedido, seq }) => `${pedido.id}-${seq}`);
            const todosSelecionados = todosIds.length > 0 && todosIds.every(id => pdfSelecionados.has(id));

            return (
              <>
                <div className="flex items-center justify-between py-1">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                    onClick={() => {
                      if (todosSelecionados) {
                        setPdfSelecionados(prev => {
                          const n = new Set(prev);
                          todosIds.forEach(id => n.delete(id));
                          return n;
                        });
                      } else {
                        setPdfSelecionados(prev => {
                          const n = new Set(prev);
                          todosIds.forEach(id => n.add(id));
                          return n;
                        });
                      }
                    }}
                  >
                    {todosSelecionados
                      ? <><CheckSquare className="w-4 h-4" /> Desmarcar todos</>
                      : <><Square className="w-4 h-4" /> Selecionar todos</>}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {pdfSelecionados.size} de {listaFiltrada.length} selecionados
                  </span>
                </div>

                {/* Lista de pedidos */}
                <div className="overflow-y-auto flex-1 border rounded-md divide-y">
                  {listaFiltrada.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido encontrado</div>
                  ) : (
                    listaFiltrada.map(({ pedido, seq, itensProducao: ips }) => {
                      const chave = `${pedido.id}-${seq}`;
                      const selecionado = pdfSelecionados.has(chave);
                      const statusGlobal = ips.every(i => i.status === 'finalizado')
                        ? 'Finalizado'
                        : ips.some(i => i.status === 'iniciado' || i.status === 'supervisao')
                          ? 'Em andamento'
                          : 'Novo';
                      const statusColor = statusGlobal === 'Finalizado'
                        ? 'text-green-600'
                        : statusGlobal === 'Em andamento'
                          ? 'text-yellow-600'
                          : 'text-blue-600';

                      return (
                        <label
                          key={chave}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors ${selecionado ? 'bg-primary/5' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => {
                              setPdfSelecionados(prev => {
                                const n = new Set(prev);
                                selecionado ? n.delete(chave) : n.add(chave);
                                return n;
                              });
                            }}
                            className="mt-0.5 accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">
                                #{String(pedido.numero_pedido).padStart(3, '0')}{seq > 1 ? `/${seq}` : ''}
                              </span>
                              <span className={`text-xs font-medium ${statusColor}`}>{statusGlobal}</span>
                            </div>
                            {isAdmin && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {pedido.cliente_nome || 'Cliente não informado'}
                              </div>
                            )}
                            {pedido.created_at && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Criado em: {formatDataCriacao(pedido.created_at)}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}

          {/* Rodapé do modal */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setPdfModalAberto(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmarGerarPDF}
              disabled={pdfSelecionados.size === 0 || isPrinting}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Gerando...' : `Gerar PDF (${pdfSelecionados.size})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
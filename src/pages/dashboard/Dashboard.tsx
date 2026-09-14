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
  Square,
  Trash2,
  Tag
} from 'lucide-react';
import { User } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePedidos } from '@/hooks/usePedidos';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { producaoService, ItemProducao, StatusProducao } from '@/lib/supabase';
import PedidoPhotosModal from '@/components/PedidoPhotosModal';
import PDFPreviewModal from '@/components/dashboard/PDFPreviewModal';
import ModalFichaTecnica from '@/components/dashboard/ModalFichaTecnica';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { pedidos, apagarPedido } = usePedidos();
  const { selectedStore, userStores, isAdmin, isGerente, isFuncionario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { printRef, printCurrentView, isPrinting, generatePedidoPDF, generatePedidoClientePDF } = usePDFGenerator();
  const [pedidoExcluir, setPedidoExcluir] = useState<string | null>(null);
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [loadingProducao, setLoadingProducao] = useState(true);
  const [pedidoItens, setPedidoItens] = useState<any[]>([]);
  const [datasVisiveis, setDatasVisiveis] = useState<{ [key: string]: boolean }>({});
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'novos' | 'iniciados' | 'finalizados' | 'ficha_pendente'>('todos');
  const [filtroArea, setFiltroArea] = useState<'todos' | 'marcenaria' | 'corte_costura' | 'espuma' | 'bancada' | 'tecido'>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [pedidoPhotosModal, setPedidoPhotosModal] = useState<{ isOpen: boolean; pedidoId: string | null; pedidoItemId: string | null }>({
    isOpen: false,
    pedidoId: null,
    pedidoItemId: null,
  });

  // Estado do modal de Ficha Técnica rápida
  const [modalFichaAberta, setModalFichaAberta] = useState(false);
  const [pedidoFichaSelecionado, setPedidoFichaSelecionado] = useState<{ id: string; numero?: string | number } | null>(null);

  // Estado do modal de seleção de pedidos para PDF
  const [pdfModalAberto, setPdfModalAberto] = useState(false);
  const [pdfSelecionados, setPdfSelecionados] = useState<Set<string>>(new Set());

  // Estado do diálogo de impressão automática ao finalizar pedido
  const [dialogImprimirAberto, setDialogImprimirAberto] = useState(false);
  const [pedidoPromptInfo, setPedidoPromptInfo] = useState<{ id: string; numero: string | number } | null>(null);

  useEffect(() => {
    if (location.state?.novoPedidoCriadoId) {
      setPedidoPromptInfo({
        id: location.state.novoPedidoCriadoId,
        numero: location.state.numeroPedido || '',
      });
      setDialogImprimirAberto(true);
      // Limpa o state do router para evitar reabertura involuntária ao dar refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Estado para manter hora atual e reavaliar pedidos recentes (< 1h) a cada minuto
  const [horaAtual, setHoraAtual] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Estado do modal de pré-visualização de PDF
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
    fileName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    url: null,
    title: '',
    fileName: '',
    isLoading: false,
  });

  const handlePreviewOS = async (pedidoId: string) => {
    setPdfPreview({
      isOpen: true,
      url: null,
      title: 'Gerando Ordem de Serviço...',
      fileName: 'ordem-de-servico.pdf',
      isLoading: true,
    });
    try {
      const res = await generatePedidoPDF(pedidoId, false);
      if (res) {
        setPdfPreview({
          isOpen: true,
          url: res.blobUrl,
          title: res.title,
          fileName: res.fileName,
          isLoading: false,
        });
      } else {
        setPdfPreview(prev => ({ ...prev, isOpen: false, isLoading: false }));
      }
    } catch (err) {
      console.error('Erro ao gerar pré-visualização da OS:', err);
      setPdfPreview(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handlePreviewCliente = async (pedidoId: string, isOrcamento: boolean) => {
    const rotulo = isOrcamento ? 'Orçamento' : 'Pedido do Cliente';
    setPdfPreview({
      isOpen: true,
      url: null,
      title: `Gerando ${rotulo}...`,
      fileName: `${isOrcamento ? 'orcamento' : 'pedido-cliente'}.pdf`,
      isLoading: true,
    });
    try {
      const res = await generatePedidoClientePDF(pedidoId, isOrcamento, false);
      if (res) {
        setPdfPreview({
          isOpen: true,
          url: res.blobUrl,
          title: res.title,
          fileName: res.fileName,
          isLoading: false,
        });
      } else {
        setPdfPreview(prev => ({ ...prev, isOpen: false, isLoading: false }));
      }
    } catch (err) {
      console.error(`Erro ao gerar pré-visualização de ${rotulo}:`, err);
      setPdfPreview(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const handleClosePdfPreview = () => {
    if (pdfPreview.url) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview({
      isOpen: false,
      url: null,
      title: '',
      fileName: '',
      isLoading: false,
    });
  };

  // Restaura os elementos escondidos manualmente após a impressão terminar
  useEffect(() => {
    if (!isPrinting) {
      document.querySelectorAll('.force-hide-print').forEach(el => {
        el.classList.remove('force-hide-print');
        (el as HTMLElement).style.display = '';
      });
    }
  }, [isPrinting]);

  const [pdfFiltroBusca, setPdfFiltroBusca] = useState('');
  const [pdfFiltroData, setPdfFiltroData] = useState('');
  const [pdfFiltroStatus, setPdfFiltroStatus] = useState('todos');

  useEffect(() => {
    carregarDadosProducao();
  }, [selectedStore, userStores, isAdmin]);

  const carregarDadosProducao = async () => {
    try {
      setLoadingProducao(true);
      const dados = await producaoService.getAll(selectedStore, isAdmin ? undefined : userStores);
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

  // Helper para obter os Detalhes do Produto (digitados à mão na criação do pedido)
  // com fallback para pedidos antigos que usavam campos individuais
  const getDetalhesProduto = (item?: any, pedido?: any) => {
    if (item?.observacoes && item.observacoes.trim()) return item.observacoes.trim();
    if (item?.detalhes && item.detalhes.trim()) return item.detalhes.trim();
    const legado = [
      item?.espuma || pedido?.espuma,
      item?.tecido || pedido?.tecido,
      item?.tipo_pe || pedido?.tipo_pe,
      item?.braco || pedido?.braco,
    ].filter(Boolean).join(' • ');
    if (legado) return legado;
    if (pedido?.observacoes && pedido.observacoes.trim()) return pedido.observacoes.trim();
    return '-';
  };

  // Helper para verificar se a Ficha Técnica de um item está pendente
  const isFichaPendente = (item?: any) => {
    if (!item) return false;
    return !item.tecido || !item.tipo_pe || !item.espuma || !item.braco || !item.dimensoes;
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
    setPdfFiltroStatus('todos');
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
    
    // Ocultação forçada e síncrona no DOM para evitar falhas do React to Print
    if (pdfSelecionados.size > 0) {
      document.querySelectorAll('[data-print-chave]').forEach(row => {
        const chave = row.getAttribute('data-print-chave');
        if (chave && !pdfSelecionados.has(chave)) {
          row.classList.add('force-hide-print');
          (row as HTMLElement).style.display = 'none';
        }
      });
    }

    // Usa react-to-print para imprimir a tabela
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

  // Função para verificar se o pedido foi criado há menos de 1 hora
  const UMA_HORA_MS = 60 * 60 * 1000;
  const isPedidoRecente = (createdAt?: string) => {
    if (!createdAt) return false;
    const time = new Date(createdAt).getTime();
    if (isNaN(time)) return false;
    const diff = horaAtual - time;
    return diff >= 0 && diff < UMA_HORA_MS;
  };

  const linhasExpandido = pedidosComProducao.flatMap(({ pedido, itensProducao }) => {
    const itensDoPedido = pedidoItens.filter(it => it.pedido_id === pedido.id);
    const base = (seq: number, itemId?: string, item?: any) => ({ pedido, itensProducao, seq, itemId, item });
    if (itensDoPedido.length === 0) {
      // Sem registros em pedido_itens: criar linha sintética seq 1 com ID único
      return [base(1, `synthetic-${pedido.id}-1`, undefined)];
    }
    return itensDoPedido.map((it: any) => base(it.sequencia ?? 1, it.id, it));
  })
    // Ordenar: pedidos criados há menos de 1 hora ficam fixados no topo.
    // Após 1 hora, voltam à ordenação padrão por data de entrega (mais urgentes primeiro).
    .sort((a, b) => {
      const aRecente = isPedidoRecente(a.pedido.created_at);
      const bRecente = isPedidoRecente(b.pedido.created_at);

      if (aRecente && !bRecente) return -1;
      if (!aRecente && bRecente) return 1;
      if (aRecente && bRecente) {
        // Se ambos foram criados na última hora, o mais novo fica no topo
        const timeA = new Date(a.pedido.created_at).getTime();
        const timeB = new Date(b.pedido.created_at).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (a.seq || 1) - (b.seq || 1);
      }

      // Ordenar por urgência da entrega (mais urgentes primeiro)
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

  const pedidosFichaPendente = linhasExpandido.filter(({ item }) => isFichaPendente(item)).length;

  // Filtrar pedidos baseado no filtro ativo
  let pedidosFiltrados = linhasExpandido.filter(({ pedido, itensProducao, item }) => {
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
    if (filtroAtivo === 'ficha_pendente') {
      return isFichaPendente(item);
    }
    return true;
  });

  // Filtro por área de produção
  if (filtroArea !== 'todos') {
    pedidosFiltrados = pedidosFiltrados.filter(({ itensProducao }) =>
      itensProducao?.some(item => item.etapa === filtroArea)
    );
  }

  // Busca Inteligente (Global Search)
  if (termoBusca) {
    const termo = termoBusca.toLowerCase();
    pedidosFiltrados = pedidosFiltrados.filter(({ pedido, item }) => {
      const matchPedido = String(pedido.numero_pedido).includes(termo);
      const matchCliente = (pedido as any).cliente_nome?.toLowerCase().includes(termo) || false;
      const matchSofa = (item?.descricao || item?.tipo_sofa || pedido.tipo_sofa || '').toLowerCase().includes(termo);
      const matchDetalhes = getDetalhesProduto(item, pedido).toLowerCase().includes(termo);
      const matchPagamento = (pedido.forma_pagamento || '').toLowerCase().includes(termo);
      return matchPedido || matchCliente || matchSofa || matchDetalhes || matchPagamento;
    });
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

              <button
                onClick={() => setFiltroAtivo('ficha_pendente')}
                className={`flex items-center space-x-1 p-1 rounded-md transition-all duration-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 ${filtroAtivo === 'ficha_pendente' ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800' : ''
                  }`}
                title="Filtrar pedidos com Ficha Técnica pendente"
              >
                <div className="p-1 bg-amber-100 dark:bg-amber-900/40 rounded-full">
                  <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Ficha Pendente</p>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{pedidosFichaPendente}</p>
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
                {/* Filtro por Área de Produção e Busca */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2 flex-1">
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

                  {/* Barra de Busca Global */}
                  <div className="relative w-full md:w-80 md:ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar pedido, produto, cliente..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-9 h-9 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm w-full"
                    />
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
                  <div className="overflow-x-auto max-h-[75vh] overflow-y-auto relative print:overflow-visible print:max-h-none">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border px-3 py-2 min-w-[1400px] shadow-sm print:static print:shadow-none">
                      <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <div className="col-span-1">Nº Pedido</div>
                        <div className="col-span-1">Tipo</div>
                        <div className="col-span-1">Entrega</div>
                        <div className="col-span-4 print:col-span-4">Detalhes</div>
                        <div className="col-span-1">Pagamento</div>
                        <div className="col-span-2 print:col-span-2">Status Produção</div>
                        <div className="col-span-1 print-hide">Cliente</div>
                        <div className="col-span-1 print-hide">Ações</div>
                      </div>
                    </div>

                    {/* Conteúdo da Tabela */}
                    <div className="divide-y divide-gray-200 dark:divide-border min-w-[1400px]">
                      {pedidosFiltrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {filtroAtivo === 'todos'
                            ? 'Nenhum pedido em produção encontrado.'
                            : `Nenhum pedido ${filtroAtivo} encontrado.`
                          }
                        </div>
                      ) : (
                        pedidosFiltrados.map(({ pedido, itensProducao, seq, itemId, item }, index, arr) => {
                          return (
                          <div data-print-chave={`${pedido.id}-${seq}`} key={itemId || `${pedido.id}-${seq}-${index}`} className={`relative px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors ${(seq && seq > 1) ? 'bg-gray-100 dark:bg-muted' : 'bg-white dark:bg-card'} ${index !== arr.length - 1 ? 'border-b border-gray-200 dark:border-border' : ''}`}>
                            {/* Barra de urgência na lateral esquerda */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCorUrgencia(pedido.data_previsao_entrega)} ${(seq && seq > 1) ? 'opacity-70' : ''}`}></div>

                            <div className="grid grid-cols-12 gap-3 items-center">
                              {/* Número do Pedido + indicador de mesmo pedido (sub-item) */}
                              <div className="col-span-1">
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                    {(seq && seq > 1) ? (
                                      <CornerDownRight className="w-4 h-4 text-primary shrink-0" />
                                    ) : (
                                      <Package className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                    <span className="font-semibold text-sm">#{String(pedido.numero_pedido).padStart(3, '0')}{seq && seq > 1 ? `/${seq}` : ''}</span>
                                    {(!seq || seq === 1) && selectedStore === 'todas' && (
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${
                                          pedido.loja === 'loja_3'
                                            ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900'
                                            : pedido.loja === 'loja_2'
                                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900'
                                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900'
                                        }`}
                                        title={pedido.loja === 'loja_3' ? 'Loja Tamarineira' : pedido.loja === 'loja_2' ? 'Loja Boa Viagem' : 'Loja Aragão'}
                                      >
                                        {pedido.loja === 'loja_3' ? 'Tamarineira' : pedido.loja === 'loja_2' ? 'Boa Viagem' : 'Aragão'}
                                      </span>
                                    )}
                                    {(!seq || seq === 1) && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        (pedido as any).tipo_pedido === 'orcamento' 
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' 
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                                      }`}>
                                        {(pedido as any).tipo_pedido === 'orcamento' ? 'ORÇ' : 'PED'}
                                      </span>
                                    )}
                                    {(!seq || seq === 1) && isPedidoRecente(pedido.created_at) && (
                                      <span
                                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900 flex items-center gap-1 shadow-xs"
                                        title="Pedido recente fixado no topo por 1 hora"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                        Recente
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Produto (Tipo de Sofá) - por item */}
                              <div className="col-span-1 min-w-0">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate" title={(item?.descricao || item?.tipo_sofa || pedido.tipo_sofa || 'N/A')}>
                                  {item?.descricao || item?.tipo_sofa || pedido.tipo_sofa || 'N/A'}
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
                                  <span className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 2
                                    ? 'text-red-600 dark:text-red-400 print:text-black print:font-bold'
                                    : calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 5
                                      ? 'text-yellow-600 dark:text-yellow-400 print:text-black print:font-semibold'
                                      : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {calcularDiasRestantes(pedido.data_previsao_entrega) !== null && calcularDiasRestantes(pedido.data_previsao_entrega)! <= 5 && (
                                      <span className="hidden print:inline">⚠️</span>
                                    )}
                                    {getTextoUrgencia(pedido.data_previsao_entrega)}
                                  </span>
                                </div>
                              </div>

                              {/* Detalhes do Produto (reúne Espuma, Tecido, Tipo de Pé e Braço digitados à mão) */}
                              <div className="col-span-4 print:col-span-4 min-w-0 flex items-center justify-between gap-2">
                                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate print:whitespace-normal print:break-words print:overflow-visible" title={getDetalhesProduto(item, pedido)}>
                                  {getDetalhesProduto(item, pedido)}
                                </span>
                                {item && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPedidoFichaSelecionado({ id: pedido.id, numero: pedido.numero_pedido });
                                      setModalFichaAberta(true);
                                    }}
                                    className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer print:hidden ${
                                      isFichaPendente(item)
                                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    }`}
                                    title={isFichaPendente(item) ? "Ficha técnica pendente. Clique para preencher Pé, Tecido, Espuma, Braço e Dimensões" : "Ficha técnica completa. Clique para ver ou editar"}
                                  >
                                    <Tag className="w-3 h-3" />
                                    <span>{isFichaPendente(item) ? 'Ficha Pendente' : 'Ficha OK'}</span>
                                  </button>
                                )}
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
                                        <div key={item.id} className="flex items-center space-x-0.5 px-1 py-1" title={`${getEtapaLabel(item.etapa)}: ${getStatusText(currentStatus)}`}>
                                          <IconComponent className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                          <div
                                            className={`w-2 h-2 rounded-full shadow-sm print:border print:border-black ${currentStatus === 'pendente' ? 'bg-red-500' :
                                              currentStatus === 'iniciado' ? 'bg-yellow-500' :
                                                currentStatus === 'supervisao' ? 'bg-blue-500' :
                                                  currentStatus === 'finalizado' ? 'bg-green-500' :
                                                    'bg-gray-300 dark:bg-gray-600'
                                              }`}
                                          ></div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>

                              {/* Cliente (oculto na impressão) */}
                              <div className="col-span-1 print-hide flex items-center">
                                <Dialog>
                                    <DialogTrigger asChild>
                                      <button
                                        className="text-xs text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors truncate max-w-[90px] font-medium text-left"
                                        title={pedido.cliente_nome || 'Detalhes do Cliente'}
                                      >
                                        {pedido.cliente_nome ? pedido.cliente_nome.split(' ')[0] : 'Cliente'}
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
                              <div className="col-span-1 print-hide min-w-[130px]">
                                <div className="flex items-center space-x-1">
                                    {/* Ícone para fotos */}
                                    <button
                                      className="p-2 -m-2 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Ver fotos do pedido"
                                      onClick={() => setPedidoPhotosModal({ isOpen: true, pedidoId: pedido.id, pedidoItemId: item?.id ?? null })}
                                    >
                                      <Camera className="w-5 h-5 md:w-4 md:h-4" />
                                    </button>

                                    {/* Menu para gerar PDF (duas opções) */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          className="p-2 -m-2 text-gray-400 hover:text-red-600 transition-colors"
                                          title="Gerar PDF"
                                        >
                                          <FileText className="w-5 h-5 md:w-4 md:h-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handlePreviewOS(pedido.id)}>
                                          Ordem de Serviço
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handlePreviewCliente(pedido.id, false)}>
                                          Pedido do Cliente
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handlePreviewCliente(pedido.id, true)}>
                                          Orçamento
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Ícone para editar pedido */}
                                    {(isAdmin || isGerente || isFuncionario) && (
                                      <button
                                        className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Editar pedido"
                                        onClick={() => navigate(`/dashboard/editar-pedido/${pedido.id}`)}
                                      >
                                        <Edit className="w-5 h-5 md:w-4 md:h-4" />
                                      </button>
                                    )}

                                    {/* Ícone para abrir Ficha Técnica */}
                                    <button
                                      className={`p-2 -m-2 transition-colors ${item && isFichaPendente(item) ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-primary'}`}
                                      title={item && isFichaPendente(item) ? "Preencher Ficha Técnica (Pendente)" : "Ver / Editar Ficha Técnica"}
                                      onClick={() => {
                                        setPedidoFichaSelecionado({ id: pedido.id, numero: pedido.numero_pedido });
                                        setModalFichaAberta(true);
                                      }}
                                    >
                                      <Tag className="w-5 h-5 md:w-4 md:h-4" />
                                    </button>

                                    {/* Ícone para observações (prioriza observações do produto) */}
                                    {(item?.observacoes || pedido.observacoes) && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <button
                                            className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            title={item?.observacoes || pedido.observacoes || ''}
                                          >
                                            <Eye className="w-5 h-5 md:w-4 md:h-4" />
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
                                      className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors"
                                      title="Ver horários de início e término"
                                      onClick={() => setDatasVisiveis(prev => ({ ...prev, [pedido.id]: !prev[pedido.id] }))}
                                    >
                                      <Calendar className="w-5 h-5 md:w-4 md:h-4" />
                                    </button>

                                    {/* Botão de Excluir Pedido (Apenas Admin) */}
                                    {isAdmin && (
                                      <button
                                        className="p-2 -m-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Apagar pedido"
                                        onClick={() => setPedidoExcluir(pedido.id)}
                                      >
                                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                                      </button>
                                    )}
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
                        );
                      })
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
              title="Filtrar por data de entrega"
            />
          </div>

          {/* Quick Chips de Filtro */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'atrasados', label: 'Atrasados', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900' },
              { id: 'hoje', label: 'Para Hoje', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900' },
              { id: 'novos', label: 'Novos', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900' }
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setPdfFiltroStatus(chip.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${pdfFiltroStatus === chip.id ? 'bg-primary text-primary-foreground border-primary' : (chip.color || 'bg-background hover:bg-muted border-border')}`}
              >
                {chip.label}
              </button>
            ))}
            
            {pdfSelecionados.size > 0 && (
              <button
                onClick={() => setPdfSelecionados(new Set())}
                className="ml-auto px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" /> Limpar Seleção
              </button>
            )}
          </div>

          {/* Controles de seleção */}
          {(() => {
            const listaFiltrada = pedidosFiltrados.filter(({ pedido, seq, itensProducao: ips }) => {
              const chave = `${pedido.id}-${seq}`;
              const numPedido = String(pedido.numero_pedido ? String(pedido.numero_pedido).padStart(3, '0') : '').toLowerCase();
              const buscaOk = pdfFiltroBusca === '' || numPedido.includes(pdfFiltroBusca.toLowerCase());
              if (!buscaOk) return false;
              if (pdfFiltroData) {
                const dataEntrega = pedido.data_previsao_entrega ? pedido.data_previsao_entrega.split('T')[0] : '';
                if (dataEntrega !== pdfFiltroData) return false;
              }
              
              if (pdfFiltroStatus !== 'todos') {
                const statusGlobal = ips.every(i => i.status === 'finalizado')
                  ? 'Finalizado'
                  : ips.some(i => i.status === 'iniciado' || i.status === 'supervisao')
                    ? 'Em andamento'
                    : 'Novo';
                    
                if (pdfFiltroStatus === 'novos' && statusGlobal !== 'Novo') return false;
                if (pdfFiltroStatus === 'andamento' && statusGlobal !== 'Em andamento') return false;
                
                const diasRestantes = calcularDiasRestantes(pedido.data_previsao_entrega);
                if (pdfFiltroStatus === 'atrasados' && (diasRestantes === null || diasRestantes >= 0)) return false;
                if (pdfFiltroStatus === 'hoje' && diasRestantes !== 0) return false;
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
                <div className="overflow-y-auto flex-1 border rounded-md">
                  {listaFiltrada.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido encontrado</div>
                  ) : (
                    (() => {
                      let lastDate = '';
                      return [...listaFiltrada].sort((a, b) => {
                        const da = a.pedido.data_previsao_entrega || 'zzzz';
                        const db = b.pedido.data_previsao_entrega || 'zzzz';
                        return da.localeCompare(db);
                      }).map(({ pedido, seq, itensProducao: ips, item }) => {
                        const elements = [];
                        const currentDate = pedido.data_previsao_entrega ? pedido.data_previsao_entrega.split('T')[0] : 'sem-data';
                        
                        if (currentDate !== lastDate) {
                          lastDate = currentDate;
                          const dateLabel = currentDate === 'sem-data' ? 'Pedidos sem data de entrega' : `Entrega: ${formatDataCriacao(pedido.data_previsao_entrega)}`;
                          elements.push(
                            <div key={`header-${currentDate}`} className="bg-muted/60 px-4 py-2 text-xs font-bold text-muted-foreground uppercase sticky top-0 z-10 border-b border-t first:border-t-0 backdrop-blur-sm">
                              {dateLabel}
                            </div>
                          );
                        }

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

                      const labelNode = (
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
                              <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                                {pedido.cliente_nome || 'Cliente não informado'} <span className="text-gray-900 dark:text-gray-100 font-bold ml-1">• {pedido.tipo_sofa || 'Produto'}</span>
                              </div>
                            )}
                            <div className="text-xs mt-0.5 font-medium">
                              {pedido.data_previsao_entrega ? (
                                <span className="text-red-600 dark:text-red-400 font-bold">Entrega: {formatDataCriacao(pedido.data_previsao_entrega)}</span>
                              ) : (
                                <span className="text-muted-foreground">Sem data de entrega</span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                      elements.push(labelNode);
                      return elements;
                    })
                  })()
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

      {/* Modal de Exclusão de Pedido */}
      <Dialog open={pedidoExcluir !== null} onOpenChange={(open) => !open && setPedidoExcluir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Excluir Pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir permanentemente este pedido?
            </p>
            <p className="text-sm font-semibold text-red-600">
              Atenção: Esta ação não pode ser desfeita e todas as fotos e itens vinculados também serão apagados!
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPedidoExcluir(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (pedidoExcluir) {
                  await apagarPedido(pedidoExcluir);
                  setPedidoExcluir(null);
                }
              }}
            >
              Sim, excluir pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pré-visualização de PDF com opção de download */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={handleClosePdfPreview}
        pdfUrl={pdfPreview.url}
        title={pdfPreview.title}
        fileName={pdfPreview.fileName}
        isLoading={pdfPreview.isLoading}
      />

      {/* Dialog perguntando se deseja imprimir o pedido recém-finalizado */}
      <Dialog open={dialogImprimirAberto} onOpenChange={setDialogImprimirAberto}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Printer className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold">
              Deseja imprimir o pedido {pedidoPromptInfo?.numero ? `#${pedidoPromptInfo.numero}` : ''}?
            </DialogTitle>
            <p className="text-center text-xs text-muted-foreground">
              O pedido foi salvo com sucesso! Escolha o documento que deseja visualizar e imprimir agora, ou cancele para continuar no painel.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2.5 pt-4 pb-2">
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium hover:bg-muted/80 flex items-center gap-3 border-border px-4"
              onClick={() => {
                if (pedidoPromptInfo?.id) {
                  const id = pedidoPromptInfo.id;
                  setDialogImprimirAberto(false);
                  handlePreviewOS(id);
                }
              }}
            >
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="font-semibold text-xs">Ordem de Serviço</span>
                <span className="text-[10px] text-muted-foreground">Para linha de produção e acompanhamento</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium hover:bg-muted/80 flex items-center gap-3 border-border px-4"
              onClick={() => {
                if (pedidoPromptInfo?.id) {
                  const id = pedidoPromptInfo.id;
                  setDialogImprimirAberto(false);
                  handlePreviewCliente(id, false);
                }
              }}
            >
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="font-semibold text-xs">Pedido do Cliente</span>
                <span className="text-[10px] text-muted-foreground">Com dados de entrega, itens e pagamento</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12 text-sm font-medium hover:bg-muted/80 flex items-center gap-3 border-border px-4"
              onClick={() => {
                if (pedidoPromptInfo?.id) {
                  const id = pedidoPromptInfo.id;
                  setDialogImprimirAberto(false);
                  handlePreviewCliente(id, true);
                }
              }}
            >
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="font-semibold text-xs">Orçamento</span>
                <span className="text-[10px] text-muted-foreground">Versão de orçamento para apresentação</span>
              </div>
            </Button>
          </div>

          <div className="pt-2 border-t mt-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setDialogImprimirAberto(false)}
            >
              Cancelar (não imprimir agora)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Ficha Técnica */}
      <ModalFichaTecnica
        isOpen={modalFichaAberta}
        onClose={() => {
          setModalFichaAberta(false);
          setPedidoFichaSelecionado(null);
        }}
        pedidoId={pedidoFichaSelecionado?.id || null}
        numeroPedido={pedidoFichaSelecionado?.numero}
        onSuccess={() => {
          carregarDadosProducao();
        }}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
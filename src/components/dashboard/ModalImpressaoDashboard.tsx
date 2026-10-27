import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Printer,
  Calendar as CalendarIcon,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckSquare,
  Square,
  PlusCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { calcularDiasRestantes } from '@/lib/utils';
import type { ItemProducao } from '@/lib/supabase';

export interface LinhaDashboard {
  pedido: any;
  itensProducao: ItemProducao[];
  seq: number;
  itemId?: string;
  item?: any;
}

export interface ModalImpressaoDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  linhas: LinhaDashboard[];
  linhasIniciais?: LinhaDashboard[];
  filtroArea?: string;
  filtroAtivo?: string;
  selectedStore?: string | null;
  onConfirmarImpressao: (params: {
    selectedChaves: Set<string>;
    isPersonalizada: boolean;
    resumoFiltro: string;
  }) => void;
}

export const ModalImpressaoDashboard: React.FC<ModalImpressaoDashboardProps> = ({
  isOpen,
  onClose,
  linhas,
  filtroArea = 'todos',
  selectedStore,
  onConfirmarImpressao,
}) => {
  // Etapa: 1 = Filtros de Data & Status, 2 = Checklist / Seleção Individual
  const [etapa, setEtapa] = useState<1 | 2>(1);

  // Filtros da Etapa 1
  const [tipoFiltroData, setTipoFiltroData] = useState<'todos' | 'mes' | 'dias'>('todos');
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filtroStatusRapido, setFiltroStatusRapido] = useState<'todos' | 'atrasados' | 'hoje' | 'novos'>('todos');

  // Estados da Etapa 2
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [buscaItem, setBuscaItem] = useState<string>('');
  const [abaOrigem, setAbaOrigem] = useState<'periodo' | 'outras' | 'todos'>('periodo');
  const [filtroExtraStatus, setFiltroExtraStatus] = useState<string>('todos');
  const [filtroExtraMes, setFiltroExtraMes] = useState<string>('todos');

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      setEtapa(1);
      setTipoFiltroData('todos');
      setMesSelecionado('todos');
      setDateRange(undefined);
      setFiltroStatusRapido('todos');
      setBuscaItem('');
      setAbaOrigem('periodo');
      setFiltroExtraStatus('todos');
      setFiltroExtraMes('todos');
    }
  }, [isOpen]);

  // Base completa de linhas para a área selecionada
  const linhasBase = useMemo(() => {
    return linhas;
  }, [linhas]);

  // Lista dinâmica de meses com base nas entregas
  const mesesDisponiveis = useMemo(() => {
    const mapa = new Set<string>();
    linhasBase.forEach(({ pedido }) => {
      if (pedido.data_previsao_entrega) {
        const ym = pedido.data_previsao_entrega.slice(0, 7);
        if (ym.length === 7) mapa.add(ym);
      }
    });

    const ordenados = Array.from(mapa).sort();
    return ordenados.map(mesAno => {
      try {
        const [ano, mes] = mesAno.split('-');
        const d = new Date(Number(ano), Number(mes) - 1, 1);
        const nome = format(d, 'MMMM / yyyy', { locale: ptBR });
        return {
          valor: mesAno,
          label: nome.charAt(0).toUpperCase() + nome.slice(1),
        };
      } catch {
        return { valor: mesAno, label: mesAno };
      }
    });
  }, [linhasBase]);

  // Mês padrão para o calendário
  const mesPadraoCalendario = useMemo(() => {
    if (dateRange?.from) return dateRange.from;
    for (const { pedido } of linhasBase) {
      if (pedido.data_previsao_entrega) {
        const d = new Date(pedido.data_previsao_entrega);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  }, [dateRange, linhasBase]);

  // Helper para verificar status global da produção
  const getStatusGlobal = (ips: ItemProducao[]) => {
    if (!ips || ips.length === 0) return 'Novo';
    if (ips.every(i => i.status === 'finalizado')) return 'Finalizado';
    if (ips.some(i => i.status === 'iniciado' || i.status === 'supervisao')) return 'Em andamento';
    return 'Novo';
  };

  // Helper para verificar se a linha atende aos filtros de data
  const atendeFiltroData = (dataPrevisao?: string | null) => {
    if (tipoFiltroData === 'todos') return true;
    const dataStr = dataPrevisao ? dataPrevisao.split('T')[0] : '';

    if (tipoFiltroData === 'mes') {
      if (!mesSelecionado || mesSelecionado === 'todos') return true;
      return dataStr.startsWith(mesSelecionado);
    }

    if (tipoFiltroData === 'dias') {
      if (!dataStr) return false;
      if (!dateRange?.from) return true;
      const iniStr = format(dateRange.from, 'yyyy-MM-dd');
      const fimStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : iniStr;
      return dataStr >= iniStr && dataStr <= fimStr;
    }

    return true;
  };

  // Helper para verificar se a linha atende aos filtros de status
  const atendeFiltroStatus = (pedido: any, ips: ItemProducao[]) => {
    if (filtroStatusRapido === 'todos') return true;

    const diasRestantes = calcularDiasRestantes(pedido.data_previsao_entrega);
    const statusGlobal = getStatusGlobal(ips);

    if (filtroStatusRapido === 'atrasados') {
      return diasRestantes !== null && diasRestantes < 0;
    }
    if (filtroStatusRapido === 'hoje') {
      return diasRestantes !== null && diasRestantes === 0;
    }
    if (filtroStatusRapido === 'novos') {
      return statusGlobal === 'Novo';
    }

    return true;
  };

  // Linhas que atendem aos filtros da Etapa 1
  const linhasDoFiltro = useMemo(() => {
    return linhasBase.filter(({ pedido, itensProducao: ips }) => {
      return atendeFiltroData(pedido.data_previsao_entrega) && atendeFiltroStatus(pedido, ips);
    });
  }, [linhasBase, tipoFiltroData, mesSelecionado, dateRange, filtroStatusRapido]);

  // Set de chaves do filtro da Etapa 1
  const filtroChavesSet = useMemo(() => {
    return new Set(linhasDoFiltro.map(l => `${l.pedido.id}-${l.seq}`));
  }, [linhasDoFiltro]);

  // Linhas fora do filtro inicial
  const linhasOutras = useMemo(() => {
    return linhasBase.filter(l => !filtroChavesSet.has(`${l.pedido.id}-${l.seq}`));
  }, [linhasBase, filtroChavesSet]);

  // Avançar para a Etapa 2 inicializando todos os itens do filtro marcados
  const handleAvancarParaSelecao = () => {
    setSelectedIds(new Set(linhasDoFiltro.map(l => `${l.pedido.id}-${l.seq}`)));
    setBuscaItem('');
    setAbaOrigem('periodo');
    setEtapa(2);
  };

  // Voltar para a Etapa 1
  const handleVoltarEtapa1 = () => {
    setEtapa(1);
  };

  // Toggle individual
  const toggleItem = (chave: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });
  };

  // Marcar lista
  const marcarLista = (lista: LinhaDashboard[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      lista.forEach(l => next.add(`${l.pedido.id}-${l.seq}`));
      return next;
    });
  };

  // Desmarcar lista
  const desmarcarLista = (lista: LinhaDashboard[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      lista.forEach(l => next.delete(`${l.pedido.id}-${l.seq}`));
      return next;
    });
  };

  // Filtro de busca textual
  const filtrarPorTexto = (lista: LinhaDashboard[]) => {
    if (!buscaItem.trim()) return lista;
    const termo = buscaItem.toLowerCase().trim();
    return lista.filter(({ pedido, item }) => {
      const numPed = String(pedido.numero_pedido || '').toLowerCase();
      const cli = (pedido.cliente_nome || '').toLowerCase();
      const desc = (item?.descricao || item?.tipo_sofa || pedido.tipo_sofa || '').toLowerCase();
      const tec = (item?.tecido || pedido.tecido || '').toLowerCase();
      const obs = (item?.observacoes || pedido.observacoes || '').toLowerCase();
      return (
        numPed.includes(termo) ||
        cli.includes(termo) ||
        desc.includes(termo) ||
        tec.includes(termo) ||
        obs.includes(termo)
      );
    });
  };

  // Linhas exibidas na Etapa 2 de acordo com a aba ativa
  const linhasExibidasEtapa2 = useMemo(() => {
    if (abaOrigem === 'periodo') {
      return filtrarPorTexto(linhasDoFiltro);
    }
    if (abaOrigem === 'outras') {
      let lista = linhasOutras;
      if (filtroExtraStatus !== 'todos') {
        lista = lista.filter(({ pedido, itensProducao: ips }) => {
          const dias = calcularDiasRestantes(pedido.data_previsao_entrega);
          const st = getStatusGlobal(ips);
          if (filtroExtraStatus === 'atrasados') return dias !== null && dias < 0;
          if (filtroExtraStatus === 'hoje') return dias !== null && dias === 0;
          if (filtroExtraStatus === 'novos') return st === 'Novo';
          return true;
        });
      }
      if (filtroExtraMes !== 'todos') {
        lista = lista.filter(({ pedido }) => {
          return pedido.data_previsao_entrega && pedido.data_previsao_entrega.startsWith(filtroExtraMes);
        });
      }
      return filtrarPorTexto(lista);
    }
    return filtrarPorTexto(linhasBase);
  }, [abaOrigem, linhasDoFiltro, linhasOutras, linhasBase, buscaItem, filtroExtraStatus, filtroExtraMes]);

  // Resumo textual do filtro
  const getResumoFiltro = () => {
    const partes: string[] = [];
    if (filtroStatusRapido === 'atrasados') partes.push('Atrasados');
    else if (filtroStatusRapido === 'hoje') partes.push('Para Hoje');
    else if (filtroStatusRapido === 'novos') partes.push('Novos');
    else partes.push('Todos');

    if (tipoFiltroData === 'mes' && mesSelecionado !== 'todos') {
      const achado = mesesDisponiveis.find(m => m.valor === mesSelecionado);
      partes.push(achado ? achado.label : mesSelecionado);
    } else if (tipoFiltroData === 'dias' && dateRange?.from) {
      const ini = format(dateRange.from, 'dd/MM/yy');
      const fim = dateRange.to ? format(dateRange.to, 'dd/MM/yy') : ini;
      partes.push(`${ini} a ${fim}`);
    } else if (tipoFiltroData === 'todos') {
      partes.push('Todas as datas');
    }

    return partes.join(' • ');
  };

  // Confirmar e disparar impressão
  const handleConfirmar = (chaves: Set<string>) => {
    const isPersonalizada =
      chaves.size !== linhasDoFiltro.length ||
      linhasDoFiltro.some(l => !chaves.has(`${l.pedido.id}-${l.seq}`)) ||
      Array.from(chaves).some(k => !filtroChavesSet.has(k));

    onConfirmarImpressao({
      selectedChaves: chaves,
      isPersonalizada,
      resumoFiltro: getResumoFiltro(),
    });
  };

  // Disparar impressão direto da Etapa 1
  const handleImprimirDiretoEtapa1 = () => {
    const chaves = new Set(linhasDoFiltro.map(l => `${l.pedido.id}-${l.seq}`));
    handleConfirmar(chaves);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={`${
          etapa === 1 ? 'max-w-xl' : 'max-w-4xl'
        } w-[95vw] p-0 flex flex-col gap-0 max-h-[92vh] overflow-hidden bg-background transition-all duration-200`}
      >
        {/* ======================================================== */}
        {/* CABEÇALHO DO MODAL                                       */}
        {/* ======================================================== */}
        <DialogHeader className="px-5 py-3.5 pr-12 border-b flex-row items-center justify-between space-y-0 bg-muted/30 shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {etapa === 1
                    ? 'Gerar Relatório PDF da Produção'
                    : 'Seleção de Pedidos para o PDF'}
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-background shrink-0">
                  Etapa {etapa} de 2
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {etapa === 1
                  ? 'Filtre por data de entrega e status antes de gerar o documento'
                  : 'Marque ou desmarque os pedidos individualmente ou adicione extras'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ======================================================== */}
        {/* ETAPA 1: FILTROS DE DATA & STATUS                        */}
        {/* ======================================================== */}
        {etapa === 1 && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Filtro Rápido por Status / Urgência */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Filtrar por Status / Urgência:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'todos', label: 'Todos', icon: Sparkles, desc: 'Sem restrição' },
                  { id: 'atrasados', label: 'Atrasados', icon: AlertTriangle, desc: 'Prazo vencido' },
                  { id: 'hoje', label: 'Para Hoje', icon: Clock, desc: 'Entrega hoje' },
                  { id: 'novos', label: 'Novos', icon: CheckCircle2, desc: 'Aguardando início' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = filtroStatusRapido === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFiltroStatusRapido(item.id as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-2 border-primary bg-primary/15 ring-1 ring-primary/40 text-foreground font-bold shadow-sm'
                          : 'border-border/80 bg-card hover:bg-muted/70 text-foreground font-medium'
                      }`}
                    >
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-normal mt-0.5 truncate">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Filtro de Datas de Entrega (idêntico ao de compras de tecido) */}
            <div className="space-y-2 border-t pt-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                  Filtrar Data de Entrega:
                </label>

                {tipoFiltroData !== 'todos' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTipoFiltroData('todos');
                      setDateRange(undefined);
                      setMesSelecionado('todos');
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Ver todas as datas
                  </button>
                )}
              </div>

              {/* Abas Rápidas do Modo de Data */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTipoFiltroData('todos');
                    setDateRange(undefined);
                  }}
                  className={`py-2 px-2.5 rounded-md text-xs border text-center transition-all ${
                    tipoFiltroData === 'todos'
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                      : 'bg-card border-border/80 text-foreground font-semibold hover:bg-muted'
                  }`}
                >
                  Todas as Datas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoFiltroData('mes');
                    if (mesSelecionado === 'todos' && mesesDisponiveis.length > 0) {
                      setMesSelecionado(mesesDisponiveis[0].valor);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-md text-xs border text-center transition-all ${
                    tipoFiltroData === 'mes'
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                      : 'bg-card border-border/80 text-foreground font-semibold hover:bg-muted'
                  }`}
                >
                  Por Mês
                </button>

                <button
                  type="button"
                  onClick={() => setTipoFiltroData('dias')}
                  className={`py-2 px-2.5 rounded-md text-xs border text-center transition-all ${
                    tipoFiltroData === 'dias'
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                      : 'bg-card border-border/80 text-foreground font-semibold hover:bg-muted'
                  }`}
                >
                  📅 No Calendário
                </button>
              </div>

              {/* Modo: Por Mês */}
              {tipoFiltroData === 'mes' && (
                <div className="space-y-1 pt-1">
                  <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="h-9 text-xs font-medium bg-background">
                      <SelectValue placeholder="Selecione o mês desejado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os meses disponíveis</SelectItem>
                      {mesesDisponiveis.map(m => (
                        <SelectItem key={m.valor} value={m.valor}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Modo: Calendário Interativo */}
              {tipoFiltroData === 'dias' && (
                <div className="pt-2 space-y-2 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between px-1 text-xs">
                    <span className="font-semibold text-foreground">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>📅 De <strong>{format(dateRange.from, 'dd/MM/yyyy')}</strong> até <strong>{format(dateRange.to, 'dd/MM/yyyy')}</strong></>
                        ) : (
                          <>📅 Dia <strong>{format(dateRange.from, 'dd/MM/yyyy')}</strong></>
                        )
                      ) : (
                        <span className="text-muted-foreground">Clique no calendário para selecionar o(s) dia(s):</span>
                      )}
                    </span>

                    {dateRange?.from && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDateRange(undefined)}
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>

                  <div className="rounded-lg border bg-card p-2 shadow-xs w-full flex justify-center">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={ptBR}
                      defaultMonth={mesPadraoCalendario}
                      className="rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resumo da Etapa 1 */}
            <div className="rounded-lg bg-muted/40 border border-border/80 p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <span className="font-bold text-foreground block text-xs sm:text-sm">
                  {linhasDoFiltro.length} {linhasDoFiltro.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  Filtro: {getResumoFiltro()}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Na próxima etapa você poderá desmarcar pedidos ou adicionar extras de outras datas/status
                </span>
              </div>

              <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold text-xs sm:text-sm px-3 py-1 whitespace-nowrap shrink-0 inline-flex items-center rounded-md">
                {linhasDoFiltro.length} {linhasDoFiltro.length === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: CHECKLIST & SELEÇÃO INDIVIDUAL                  */}
        {/* ======================================================== */}
        {etapa === 2 && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Barra de Controles Rápidos da Etapa 2 */}
            <div className="p-4 border-b bg-muted/20 space-y-3 shrink-0">
              {/* Linha 1: Métricas e Ações Rápidas */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold px-2.5 py-1 bg-background shrink-0 whitespace-nowrap">
                    {selectedIds.size} de {linhasBase.length} selecionados
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => marcarLista(linhasExibidasEtapa2)}
                    className="h-8 text-xs gap-1.5 px-3 font-semibold bg-card text-foreground hover:bg-muted border-border"
                    title="Marcar todos os pedidos visíveis nesta lista"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    Marcar Visíveis
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => desmarcarLista(linhasExibidasEtapa2)}
                    className="h-8 text-xs gap-1.5 px-3 font-semibold bg-card text-foreground hover:bg-muted hover:text-destructive border-border"
                    title="Desmarcar pedidos visíveis nesta lista"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Desmarcar Visíveis
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      className="h-8 text-xs gap-1 px-2.5 text-muted-foreground hover:text-destructive"
                      title="Desmarcar todos os pedidos selecionados"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              {/* Linha 2: Busca e Abas de Origem */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Campo de Busca Rápida */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={buscaItem}
                    onChange={(e) => setBuscaItem(e.target.value)}
                    placeholder="Buscar por nº do pedido, cliente ou produto..."
                    className="h-8 text-xs pl-8 pr-7 bg-background"
                  />
                  {buscaItem && (
                    <button
                      type="button"
                      onClick={() => setBuscaItem('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Abas de Navegação (Do Filtro / Outros Pedidos / Todos) */}
                <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setAbaOrigem('periodo')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      abaOrigem === 'periodo'
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    Do Filtro ({linhasDoFiltro.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaOrigem('outras')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                      abaOrigem === 'outras'
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Outros Pedidos ({linhasOutras.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaOrigem('todos')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      abaOrigem === 'todos'
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    Todos ({linhasBase.length})
                  </button>
                </div>
              </div>

              {/* Filtros extras quando estiver na aba "Outros Pedidos" */}
              {abaOrigem === 'outras' && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="font-semibold text-foreground shrink-0">Filtrar extras:</span>

                  <Select value={filtroExtraStatus} onValueChange={setFiltroExtraStatus}>
                    <SelectTrigger className="h-7 text-xs w-[140px] bg-background">
                      <SelectValue placeholder="Status extra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="atrasados">Atrasados</SelectItem>
                      <SelectItem value="hoje">Para Hoje</SelectItem>
                      <SelectItem value="novos">Novos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroExtraMes} onValueChange={setFiltroExtraMes}>
                    <SelectTrigger className="h-7 text-xs flex-1 max-w-xs bg-background">
                      <SelectValue placeholder="Mês extra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os outros meses</SelectItem>
                      {mesesDisponiveis.map(m => (
                        <SelectItem key={m.valor} value={m.valor}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Lista com Rolagem dos Pedidos */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-border/60">
              {linhasExibidasEtapa2.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-1.5">
                  <p className="font-medium text-sm">Nenhum pedido encontrado nesta visualização.</p>
                  <p className="text-xs">
                    {buscaItem ? 'Tente buscar com outros termos.' : 'Alterne as abas ou ajuste os filtros acima.'}
                  </p>
                </div>
              ) : (
                linhasExibidasEtapa2.map(({ pedido, itensProducao: ips, seq, item }) => {
                  const chave = `${pedido.id}-${seq}`;
                  const isChecked = selectedIds.has(chave);
                  const isDoFiltro = filtroChavesSet.has(chave);

                  const statusGlobal = getStatusGlobal(ips);
                  const diasRestantes = calcularDiasRestantes(pedido.data_previsao_entrega);

                  return (
                    <div
                      key={chave}
                      onClick={() => toggleItem(chave)}
                      className={`py-3 px-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer select-none ${
                        isChecked
                          ? 'bg-primary/5 hover:bg-primary/10 border border-primary/20 my-1'
                          : 'hover:bg-muted/40 my-1 opacity-75'
                      }`}
                    >
                      {/* Checkbox interativo */}
                      <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(chave)}
                          aria-label={`Selecionar pedido #${pedido.numero_pedido}`}
                        />
                      </div>

                      {/* Informações Centrais do Item */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-foreground">
                            #{String(pedido.numero_pedido).padStart(3, '0')}{seq > 1 ? `/${seq}` : ''}
                          </span>

                          <span className="text-xs text-muted-foreground font-medium">
                            • {pedido.cliente_nome || 'Cliente não informado'}
                          </span>

                          {/* Status Global */}
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 h-4 font-semibold ${
                              statusGlobal === 'Finalizado'
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
                                : statusGlobal === 'Em andamento'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {statusGlobal}
                          </Badge>

                          {/* Urgência / Dias */}
                          {diasRestantes !== null && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-4 font-bold ${
                                diasRestantes < 0
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                  : diasRestantes === 0
                                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {diasRestantes < 0
                                ? `${Math.abs(diasRestantes)}d atrasado`
                                : diasRestantes === 0
                                  ? 'Hoje'
                                  : `${diasRestantes}d`}
                            </Badge>
                          )}

                          {/* Badge de Data de Entrega */}
                          {pedido.data_previsao_entrega ? (
                            <Badge
                              variant={isDoFiltro ? 'outline' : 'secondary'}
                              className={`text-[10px] px-1.5 py-0 h-4 font-normal gap-1 ${
                                !isDoFiltro ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold' : ''
                              }`}
                            >
                              <CalendarIcon className="w-2.5 h-2.5" />
                              Entrega: {format(new Date(pedido.data_previsao_entrega), 'dd/MM/yyyy')}
                              {!isDoFiltro && ' (Outra data / status)'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                              Sem data
                            </Badge>
                          )}

                          {pedido.loja && (
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              [{pedido.loja === 'loja_3' ? 'Tamarineira' : pedido.loja === 'loja_2' ? 'Boa Viagem' : 'Aragão'}]
                            </span>
                          )}
                        </div>

                        {/* Produto e Descrição */}
                        <div className="text-xs text-foreground font-semibold truncate">
                          {item?.descricao || item?.tipo_sofa || pedido.tipo_sofa || 'Produto'}
                          {item?.dimensoes && (
                            <span className="font-normal text-muted-foreground ml-1.5">
                              ({item.dimensoes}{item.profundidade_aberto ? ` • Aberto: ${item.profundidade_aberto}` : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* RODAPÉ DO MODAL (AÇÕES)                                  */}
        {/* ======================================================== */}
        <DialogFooter className="px-5 py-3.5 border-t bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full shrink-0">
          {etapa === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 px-4 text-xs font-semibold text-foreground hover:bg-muted shrink-0 order-2 sm:order-1"
              >
                Cancelar
              </Button>

              <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImprimirDiretoEtapa1}
                  disabled={linhasDoFiltro.length === 0}
                  className="h-9 px-3 text-xs gap-1.5 font-semibold text-foreground hover:bg-muted whitespace-nowrap shrink-0"
                  title="Gerar PDF de todos os pedidos filtrados sem abrir o checklist"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  Imprimir Agora (A4 Paisagem)
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAvancarParaSelecao}
                  disabled={linhasDoFiltro.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4 text-xs gap-1.5 shadow-sm whitespace-nowrap shrink-0"
                >
                  Avançar para Seleção ({linhasDoFiltro.length})
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVoltarEtapa1}
                className="h-9 px-3.5 text-xs gap-1.5 font-semibold text-foreground hover:bg-muted shrink-0 order-2 sm:order-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar (Filtros)
              </Button>

              <div className="flex items-center justify-end gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleConfirmar(selectedIds)}
                  disabled={selectedIds.size === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-5 text-xs gap-2 shadow-sm whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Agora ({selectedIds.size} pedidos • A4 Paisagem)
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalImpressaoDashboard;

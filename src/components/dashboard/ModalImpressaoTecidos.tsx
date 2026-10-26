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
  X,
  FileText,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckSquare,
  Square,
  PlusCircle,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { parseMetragem, formatMetros } from '@/lib/utils';

export interface TecidoItem {
  id: string;
  pedidoId: string;
  numeroPedido: number | string;
  clienteNome: string;
  produtoDescricao: string;
  tecido: string;
  metragemTecido: string;
  dimensoes: string;
  profundidadeAberto?: string;
  dataPrevisaoEntrega: string | null;
  statusPedido: string;
  loja?: string | null;
  observacoes?: string | null;
}

export interface TecidoAgrupado {
  tecido: string;
  itens: TecidoItem[];
  metragens: string[];
  totalMetrosCalculado: number;
  itensComMetragem: number;
  itensSemMetragem: number;
}

export interface ModalImpressaoTecidosProps {
  isOpen: boolean;
  onClose: () => void;
  itens: TecidoItem[];
  todosItens?: TecidoItem[];
  filtroStatus?: string;
  selectedStore?: string | null;
  initialTipo?: 'romaneio' | 'compras';
  onAplicarFiltroEImprimir: (params: {
    tipo: 'romaneio' | 'compras';
    tipoFiltroData: 'todos' | 'mes' | 'dias';
    mesSelecionado: string;
    dateRange: DateRange | undefined;
    itensFiltrados: TecidoItem[];
    agrupadosFiltrados: TecidoAgrupado[];
    isSelecaoPersonalizada?: boolean;
  }) => void;
}

export const ModalImpressaoTecidos: React.FC<ModalImpressaoTecidosProps> = ({
  isOpen,
  onClose,
  itens,
  todosItens,
  initialTipo = 'romaneio',
  onAplicarFiltroEImprimir,
}) => {
  // Etapa do Modal: 1 = Filtro de Data & Documento, 2 = Seleção Individual (Checklist)
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<'romaneio' | 'compras'>(initialTipo);
  const [tipoFiltroData, setTipoFiltroData] = useState<'todos' | 'mes' | 'dias'>('todos');
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Estados da Etapa 2 (Seleção Individual)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [buscaItem, setBuscaItem] = useState<string>('');
  const [abaOrigem, setAbaOrigem] = useState<'periodo' | 'outras' | 'todos'>('periodo');
  const [filtroMesExtra, setFiltroMesExtra] = useState<string>('todos');

  // Base completa de itens disponíveis para a loja/usuário
  const baseItens = useMemo(() => {
    return todosItens && todosItens.length > 0 ? todosItens : itens;
  }, [todosItens, itens]);

  // Resetar estados sempre que o modal for reaberto
  useEffect(() => {
    if (isOpen) {
      setEtapa(1);
      setTipo(initialTipo);
      setBuscaItem('');
      setAbaOrigem('periodo');
      setFiltroMesExtra('todos');
    }
  }, [isOpen, initialTipo]);

  // Lista de meses disponíveis dinamicamente com base nas datas de entrega
  const mesesDisponiveis = useMemo(() => {
    const mapa = new Set<string>();
    baseItens.forEach(item => {
      if (item.dataPrevisaoEntrega) {
        const ym = item.dataPrevisaoEntrega.slice(0, 7);
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
  }, [baseItens]);

  // Mês inicial padrão para abrir o calendário
  const mesPadraoCalendario = useMemo(() => {
    if (dateRange?.from) return dateRange.from;
    for (const it of baseItens) {
      if (it.dataPrevisaoEntrega) {
        const d = new Date(it.dataPrevisaoEntrega);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  }, [dateRange, baseItens]);

  // Itens do período selecionado na Etapa 1
  const itensDoPeriodo = useMemo(() => {
    return baseItens.filter(item => {
      if (tipoFiltroData === 'todos') return true;

      const dataStr = item.dataPrevisaoEntrega ? item.dataPrevisaoEntrega.slice(0, 10) : '';

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
    });
  }, [baseItens, tipoFiltroData, mesSelecionado, dateRange]);

  const periodoIdsSet = useMemo(() => {
    return new Set(itensDoPeriodo.map(i => i.id));
  }, [itensDoPeriodo]);

  // Itens de outras datas (fora do período selecionado)
  const itensOutrasDatas = useMemo(() => {
    return baseItens.filter(item => !periodoIdsSet.has(item.id));
  }, [baseItens, periodoIdsSet]);

  // Avançar para a Etapa 2 inicializando todos os itens do período marcados
  const handleAvancarParaSelecao = () => {
    setSelectedIds(new Set(itensDoPeriodo.map(i => i.id)));
    setBuscaItem('');
    setAbaOrigem('periodo');
    setEtapa(2);
  };

  // Voltar para a Etapa 1
  const handleVoltarEtapa1 = () => {
    setEtapa(1);
  };

  // Toggle individual de item
  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Marcar todos da lista fornecida
  const marcarLista = (lista: TecidoItem[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      lista.forEach(i => next.add(i.id));
      return next;
    });
  };

  // Desmarcar todos da lista fornecida
  const desmarcarLista = (lista: TecidoItem[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      lista.forEach(i => next.delete(i.id));
      return next;
    });
  };

  // Filtro de busca textual na Etapa 2
  const filtrarPorTexto = (lista: TecidoItem[]) => {
    if (!buscaItem.trim()) return lista;
    const termo = buscaItem.toLowerCase().trim();
    return lista.filter(item => {
      const numPed = String(item.numeroPedido).toLowerCase();
      const cli = (item.clienteNome || '').toLowerCase();
      const prod = (item.produtoDescricao || '').toLowerCase();
      const tec = (item.tecido || '').toLowerCase();
      const obs = (item.observacoes || '').toLowerCase();
      return (
        numPed.includes(termo) ||
        cli.includes(termo) ||
        prod.includes(termo) ||
        tec.includes(termo) ||
        obs.includes(termo)
      );
    });
  };

  // Itens exibidos de acordo com a aba ativa na Etapa 2
  const itensExibidosEtapa2 = useMemo(() => {
    if (abaOrigem === 'periodo') {
      return filtrarPorTexto(itensDoPeriodo);
    }
    if (abaOrigem === 'outras') {
      let lista = itensOutrasDatas;
      if (filtroMesExtra !== 'todos') {
        lista = lista.filter(i => i.dataPrevisaoEntrega && i.dataPrevisaoEntrega.startsWith(filtroMesExtra));
      }
      return filtrarPorTexto(lista);
    }
    return filtrarPorTexto(baseItens);
  }, [abaOrigem, itensDoPeriodo, itensOutrasDatas, baseItens, buscaItem, filtroMesExtra]);

  // Lista final dos itens atualmente selecionados
  const itensSelecionados = useMemo(() => {
    return baseItens.filter(item => selectedIds.has(item.id));
  }, [baseItens, selectedIds]);

  // Agrupamento por tecido apenas dos itens selecionados
  const agrupadosSelecionados: TecidoAgrupado[] = useMemo(() => {
    const mapa: { [tecido: string]: TecidoAgrupado } = {};

    itensSelecionados.forEach(item => {
      const chave = item.tecido || 'Sem Tecido Informado';
      if (!mapa[chave]) {
        mapa[chave] = {
          tecido: chave,
          itens: [],
          metragens: [],
          totalMetrosCalculado: 0,
          itensComMetragem: 0,
          itensSemMetragem: 0,
        };
      }
      mapa[chave].itens.push(item);
      if (item.metragemTecido && item.metragemTecido.trim()) {
        mapa[chave].metragens.push(item.metragemTecido.trim());
        const parsed = parseMetragem(item.metragemTecido);
        if (parsed !== null) {
          mapa[chave].totalMetrosCalculado += parsed;
        }
        mapa[chave].itensComMetragem += 1;
      } else {
        mapa[chave].itensSemMetragem += 1;
      }
    });

    return Object.values(mapa).sort((a, b) => b.itens.length - a.itens.length);
  }, [itensSelecionados]);

  // Total de metros dos itens selecionados
  const totalMetrosSelecionados = useMemo(() => {
    return agrupadosSelecionados.reduce((acc, g) => acc + g.totalMetrosCalculado, 0);
  }, [agrupadosSelecionados]);

  // Total de metros geral para o resumo da Etapa 1
  const totalMetrosPeriodo = useMemo(() => {
    let tot = 0;
    itensDoPeriodo.forEach(it => {
      if (it.metragemTecido) {
        const parsed = parseMetragem(it.metragemTecido);
        if (parsed) tot += parsed;
      }
    });
    return tot;
  }, [itensDoPeriodo]);

  // Disparar impressão
  const handleConfirmar = (itensFinais: TecidoItem[], agrupadosFinais: TecidoAgrupado[]) => {
    const isPersonalizada = 
      selectedIds.size !== itensDoPeriodo.length || 
      itensDoPeriodo.some(i => !selectedIds.has(i.id)) ||
      itensSelecionados.some(i => !periodoIdsSet.has(i.id));

    onAplicarFiltroEImprimir({
      tipo,
      tipoFiltroData,
      mesSelecionado,
      dateRange,
      itensFiltrados: itensFinais,
      agrupadosFiltrados: agrupadosFinais,
      isSelecaoPersonalizada: isPersonalizada,
    });
  };

  // Disparar impressão direto da Etapa 1 com todos os itens do período
  const handleImprimirDiretoEtapa1 = () => {
    // Monta agrupamento direto de itensDoPeriodo
    const mapa: { [tecido: string]: TecidoAgrupado } = {};
    itensDoPeriodo.forEach(item => {
      const chave = item.tecido || 'Sem Tecido Informado';
      if (!mapa[chave]) {
        mapa[chave] = {
          tecido: chave,
          itens: [],
          metragens: [],
          totalMetrosCalculado: 0,
          itensComMetragem: 0,
          itensSemMetragem: 0,
        };
      }
      mapa[chave].itens.push(item);
      if (item.metragemTecido && item.metragemTecido.trim()) {
        mapa[chave].metragens.push(item.metragemTecido.trim());
        const parsed = parseMetragem(item.metragemTecido);
        if (parsed !== null) mapa[chave].totalMetrosCalculado += parsed;
        mapa[chave].itensComMetragem += 1;
      } else {
        mapa[chave].itensSemMetragem += 1;
      }
    });
    const agrupados = Object.values(mapa).sort((a, b) => b.itens.length - a.itens.length);
    handleConfirmar(itensDoPeriodo, agrupados);
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
                    ? 'Imprimir Relatório de Tecidos' 
                    : `Seleção de Pedidos • ${tipo === 'romaneio' ? 'Romaneio de Corte' : 'Resumo de Compras'}`}
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-background shrink-0">
                  Etapa {etapa} de 2
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {etapa === 1
                  ? 'Escolha o tipo de documento e o filtro de datas desejado'
                  : 'Marque ou desmarque os pedidos individualmente para a impressão final'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ======================================================== */}
        {/* ETAPA 1: CONFIGURAÇÃO DE TIPO & DATAS                    */}
        {/* ======================================================== */}
        {etapa === 1 && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Escolha do Tipo de Documento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Tipo de Documento:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipo('romaneio')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    tipo === 'romaneio'
                      ? 'border-2 border-primary bg-primary/15 ring-1 ring-primary/40 text-foreground font-bold shadow-sm'
                      : 'border-border/80 bg-card hover:bg-muted/70 text-foreground font-medium'
                  }`}
                >
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${tipo === 'romaneio' ? 'text-primary' : 'text-foreground'}`}>
                    📋 Romaneio de Corte
                  </div>
                  <div className="text-[11px] text-muted-foreground font-normal mt-1 leading-snug">
                    Lista detalhada com checklist [✓]
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('compras')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    tipo === 'compras'
                      ? 'border-2 border-primary bg-primary/15 ring-1 ring-primary/40 text-foreground font-bold shadow-sm'
                      : 'border-border/80 bg-card hover:bg-muted/70 text-foreground font-medium'
                  }`}
                >
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${tipo === 'compras' ? 'text-primary' : 'text-foreground'}`}>
                    🛒 Resumo de Compras
                  </div>
                  <div className="text-[11px] text-muted-foreground font-normal mt-1 leading-snug">
                    Total de metros por tecido
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Filtro de Datas de Entrega */}
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

              {/* Opção 1: Por Mês */}
              {tipoFiltroData === 'mes' && (
                <div className="space-y-1 pt-1">
                  <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="h-9 text-xs font-medium">
                      <SelectValue placeholder="Selecione o mês" />
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

              {/* Opção 2: Calendário Visual Interativo */}
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
                  {itensDoPeriodo.length} {itensDoPeriodo.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Na próxima etapa você poderá desmarcar pedidos ou adicionar extras
                </span>
              </div>

              {totalMetrosPeriodo > 0 && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-3 py-1 whitespace-nowrap shrink-0 inline-flex items-center rounded-md shadow-xs">
                  {formatMetros(totalMetrosPeriodo)}
                </Badge>
              )}
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
                    {itensSelecionados.length} de {baseItens.length} selecionados
                  </Badge>
                  {totalMetrosSelecionados > 0 && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 shrink-0 whitespace-nowrap inline-flex items-center">
                      Total: {formatMetros(totalMetrosSelecionados)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => marcarLista(itensExibidosEtapa2)}
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
                    onClick={() => desmarcarLista(itensExibidosEtapa2)}
                    className="h-8 text-xs gap-1.5 px-3 font-semibold bg-card text-foreground hover:bg-muted hover:text-destructive border-border"
                    title="Desmarcar pedidos visíveis nesta lista"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Desmarcar Visíveis
                  </Button>
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
                    placeholder="Buscar por nº do pedido, cliente, produto ou tecido..."
                    className="h-8 text-xs pl-8 pr-7 bg-background"
                  />
                  {buscaItem && (
                    <button
                      type="button"
                      onClick={() => setBuscaItem('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Abas de Navegação (Do Período / Outras Datas / Todos) */}
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
                    Do Período ({itensDoPeriodo.length})
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
                    Outras Datas ({itensOutrasDatas.length})
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
                    Todos ({baseItens.length})
                  </button>
                </div>
              </div>

              {/* Se estiver na aba "Outras Datas", exibir seletor rápido para filtrar por outro mês */}
              {abaOrigem === 'outras' && (
                <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground shrink-0">Filtrar mês extra:</span>
                  <Select value={filtroMesExtra} onValueChange={setFiltroMesExtra}>
                    <SelectTrigger className="h-7 text-xs flex-1 max-w-xs bg-background">
                      <SelectValue placeholder="Selecione outro mês para adicionar" />
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
              {itensExibidosEtapa2.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-1.5">
                  <p className="font-medium text-sm">Nenhum pedido encontrado nesta visualização.</p>
                  <p className="text-xs">
                    {buscaItem ? 'Tente buscar com outros termos.' : 'Alterne as abas ou ajuste os filtros acima.'}
                  </p>
                </div>
              ) : (
                itensExibidosEtapa2.map(item => {
                  const isChecked = selectedIds.has(item.id);
                  const isDoPeriodo = periodoIdsSet.has(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
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
                          onCheckedChange={() => toggleItem(item.id)}
                          aria-label={`Selecionar pedido #${item.numeroPedido}`}
                        />
                      </div>

                      {/* Informações Centrais do Item */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-foreground">
                            #{item.numeroPedido}
                          </span>

                          <span className="text-xs text-muted-foreground font-medium">
                            • {item.clienteNome || 'Cliente não informado'}
                          </span>

                          {/* Badge de Data de Entrega */}
                          {item.dataPrevisaoEntrega ? (
                            <Badge 
                              variant={isDoPeriodo ? 'outline' : 'secondary'}
                              className={`text-[10px] px-1.5 py-0 h-4 font-normal gap-1 ${
                                !isDoPeriodo ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold' : ''
                              }`}
                            >
                              <CalendarIcon className="w-2.5 h-2.5" />
                              Entrega: {format(new Date(item.dataPrevisaoEntrega), 'dd/MM/yyyy')}
                              {!isDoPeriodo && ' (Outra data)'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                              Sem data
                            </Badge>
                          )}

                          {item.loja && (
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              [{item.loja}]
                            </span>
                          )}
                        </div>

                        {/* Produto e Dimensões */}
                        <div className="text-xs text-foreground font-semibold truncate">
                          {item.produtoDescricao}
                          {item.dimensoes && (
                            <span className="font-normal text-muted-foreground ml-1.5">
                              ({item.dimensoes}{item.profundidadeAberto ? ` • Aberto: ${item.profundidadeAberto}` : ''})
                            </span>
                          )}
                        </div>

                        {/* Tecido e Metragem */}
                        <div className="flex items-center gap-2 pt-0.5 text-xs flex-wrap">
                          <span className="inline-flex items-center gap-1 font-bold text-primary">
                            <Tag className="w-3 h-3" />
                            {item.tecido || 'Tecido não informado'}
                          </span>

                          {item.metragemTecido ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold py-0 h-5 whitespace-nowrap shrink-0">
                              {item.metragemTecido}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              (Metragem a definir)
                            </span>
                          )}

                          {item.observacoes && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-xs">
                              • Obs: {item.observacoes}
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
                  disabled={itensDoPeriodo.length === 0}
                  className="h-9 px-3 text-xs gap-1.5 font-semibold text-foreground hover:bg-muted whitespace-nowrap shrink-0"
                  title="Imprimir todos os pedidos do período selecionado sem abrir o checklist"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  Imprimir Agora (A4 Retrato)
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAvancarParaSelecao}
                  disabled={itensDoPeriodo.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-4 text-xs gap-1.5 shadow-sm whitespace-nowrap shrink-0"
                >
                  Avançar para Seleção ({itensDoPeriodo.length})
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
                Voltar (Datas)
              </Button>

              <div className="flex items-center justify-end gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleConfirmar(itensSelecionados, agrupadosSelecionados)}
                  disabled={itensSelecionados.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-5 text-xs gap-2 shadow-sm whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Agora ({itensSelecionados.length} pedidos • A4 Retrato)
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalImpressaoTecidos;

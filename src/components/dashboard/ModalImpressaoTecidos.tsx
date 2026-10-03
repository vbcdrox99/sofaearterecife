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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { 
  Printer, 
  Calendar as CalendarIcon, 
  X,
  FileText,
  RotateCcw
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
  }) => void;
}

export const ModalImpressaoTecidos: React.FC<ModalImpressaoTecidosProps> = ({
  isOpen,
  onClose,
  itens,
  initialTipo = 'romaneio',
  onAplicarFiltroEImprimir,
}) => {
  const [tipo, setTipo] = useState<'romaneio' | 'compras'>(initialTipo);
  const [tipoFiltroData, setTipoFiltroData] = useState<'todos' | 'mes' | 'dias'>('todos');
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setTipo(initialTipo);
    }
  }, [isOpen, initialTipo]);

  // Lista de meses disponíveis dinamicamente com base nas datas de entrega
  const mesesDisponiveis = useMemo(() => {
    const mapa = new Set<string>();
    itens.forEach(item => {
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
  }, [itens]);

  // Mês inicial padrão para abrir o calendário
  const mesPadraoCalendario = useMemo(() => {
    if (dateRange?.from) return dateRange.from;
    for (const it of itens) {
      if (it.dataPrevisaoEntrega) {
        const d = new Date(it.dataPrevisaoEntrega);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  }, [dateRange, itens]);

  // Itens filtrados pela data de entrega selecionada
  const itensFiltrados = useMemo(() => {
    return itens.filter(item => {
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
  }, [itens, tipoFiltroData, mesSelecionado, dateRange]);

  // Agrupamento por Tecido recalculado para o filtro ativo
  const agrupadosFiltrados: TecidoAgrupado[] = useMemo(() => {
    const mapa: { [tecido: string]: TecidoAgrupado } = {};

    itensFiltrados.forEach(item => {
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
  }, [itensFiltrados]);

  const totalMetrosGeral = useMemo(() => {
    return agrupadosFiltrados.reduce((acc, g) => acc + g.totalMetrosCalculado, 0);
  }, [agrupadosFiltrados]);

  const handleConfirmar = () => {
    onAplicarFiltroEImprimir({
      tipo,
      tipoFiltroData,
      mesSelecionado,
      dateRange,
      itensFiltrados,
      agrupadosFiltrados,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-[95vw] p-0 flex flex-col gap-0 max-h-[90vh] overflow-y-auto bg-background">
        {/* Cabeçalho do Modal */}
        <DialogHeader className="px-5 py-4 border-b flex-row items-center justify-between space-y-0 bg-muted/30 sticky top-0 z-10">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Imprimir Relatório de Tecidos
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Escolha o documento e filtre as datas desejadas
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Corpo de Configurações Diretas */}
        <div className="p-5 space-y-4">
          {/* 1. Escolha do Tipo de Documento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Tipo de Documento:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('romaneio')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  tipo === 'romaneio'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground font-medium'
                }`}
              >
                <div className="text-xs">📋 Romaneio de Corte</div>
                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                  Lista detalhada com checklist [✓]
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('compras')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  tipo === 'compras'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground font-medium'
                }`}
              >
                <div className="text-xs">🛒 Resumo de Compras</div>
                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
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
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Ver todas as datas
                </button>
              )}
            </div>

            {/* Abas Rápidas do Modo de Data */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTipoFiltroData('todos');
                  setDateRange(undefined);
                }}
                className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition-colors ${
                  tipoFiltroData === 'todos'
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
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
                className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition-colors ${
                  tipoFiltroData === 'mes'
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                Por Mês
              </button>

              <button
                type="button"
                onClick={() => setTipoFiltroData('dias')}
                className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition-colors ${
                  tipoFiltroData === 'dias'
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
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

            {/* Opção 2: Calendário Visual Interativo (Clica direto nos dias, sem digitar!) */}
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

          {/* Resumo Dinâmico do que será impresso */}
          <div className="rounded-lg bg-muted/40 border p-3 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground block">
                {itensFiltrados.length} {itensFiltrados.length === 1 ? 'peça selecionada' : 'peças selecionadas'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Padrão: <strong>A4 Retrato</strong> • 100% largura da folha
              </span>
            </div>

            {totalMetrosGeral > 0 && (
              <Badge className="bg-emerald-600 text-white font-bold text-xs py-1">
                {formatMetros(totalMetrosGeral)}
              </Badge>
            )}
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <DialogFooter className="px-5 py-3 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-between w-full sticky bottom-0 z-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmar}
            disabled={itensFiltrados.length === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 px-5 text-xs gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Agora (A4 Retrato)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalImpressaoTecidos;

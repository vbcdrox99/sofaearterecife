import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scissors, 
  Printer, 
  Search, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Package, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileText, 
  ExternalLink, 
  ChevronRight, 
  Eye, 
  Settings2, 
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ModalFichaTecnica from '@/components/dashboard/ModalFichaTecnica';
import ModalImpressaoTecidos, { 
  TecidoItem, 
  TecidoAgrupado 
} from '@/components/dashboard/ModalImpressaoTecidos';
import { parseMetragem, formatMetros } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPortal } from 'react-dom';
import type { DateRange } from 'react-day-picker';

const ListaTecidos = () => {
  const { toast } = useToast();
  const { selectedStore, userStores, isAdmin } = useAuth();
  const [itens, setItens] = useState<TecidoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroMetragem, setFiltroMetragem] = useState<string>('todos');
  const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'agrupado'>('pedidos');

  // Modal de edição de Ficha Técnica rápida
  const [modalFichaAberta, setModalFichaAberta] = useState(false);
  const [pedidoFichaSelecionado, setPedidoFichaSelecionado] = useState<{ id: string; numero?: string | number } | null>(null);

  // Estados de Configuração da Impressão / PDF
  const [modalImpressaoAberta, setModalImpressaoAberta] = useState(false);
  const [tipoImpressao, setTipoImpressao] = useState<'romaneio' | 'compras'>('romaneio');
  const [itensImpressao, setItensImpressao] = useState<TecidoItem[]>([]);
  const [agrupadosImpressao, setAgrupadosImpressao] = useState<TecidoAgrupado[]>([]);
  const [textoFiltroDataImpresso, setTextoFiltroDataImpresso] = useState<string>('');

  const carregarDados = async () => {
    try {
      setCarregando(true);
      let query = supabase
        .from('pedido_itens')
        .select(`
          id,
          pedido_id,
          descricao,
          tecido,
          metragem_tecido,
          dimensoes,
          observacoes,
          pedidos:pedido_id (
            id,
            numero_pedido,
            cliente_nome,
            data_previsao_entrega,
            status,
            loja
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const formatados: TecidoItem[] = [];

      (data || []).forEach((row: any) => {
        const ped = row.pedidos;
        if (!ped) return;

        // Filtro de loja do AuthContext
        if (!isAdmin) {
          if (userStores && userStores.length > 0 && ped.loja && !userStores.includes(ped.loja)) {
            return;
          }
        }
        if (selectedStore && selectedStore !== 'todas' && ped.loja && ped.loja !== selectedStore) {
          return;
        }

        // Apenas itens que tenham tecido ou metragem especificados
        const tecidoNome = (row.tecido || '').trim();
        const metragem = (row.metragem_tecido || '').trim();

        formatados.push({
          id: row.id,
          pedidoId: ped.id,
          numeroPedido: ped.numero_pedido || '-',
          clienteNome: ped.cliente_nome || 'Cliente não informado',
          produtoDescricao: row.descricao || 'Produto sem descrição',
          tecido: tecidoNome || 'Tecido não especificado',
          metragemTecido: metragem,
          dimensoes: row.dimensoes || '',
          dataPrevisaoEntrega: ped.data_previsao_entrega,
          statusPedido: ped.status || 'pendente',
          loja: ped.loja,
          observacoes: row.observacoes,
        });
      });

      setItens(formatados);
    } catch (err: any) {
      console.error('Erro ao carregar lista de tecidos:', err);
      toast({
        title: 'Erro ao carregar tecidos',
        description: err.message || 'Falha ao buscar itens do pedido.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [selectedStore, userStores, isAdmin]);

  // Itens filtrados pela busca e filtros
  const itensFiltrados = useMemo(() => {
    return itens.filter(item => {
      // Filtro de busca
      if (busca) {
        const term = busca.toLowerCase();
        const numOk = String(item.numeroPedido).toLowerCase().includes(term);
        const cliOk = item.clienteNome.toLowerCase().includes(term);
        const prodOk = item.produtoDescricao.toLowerCase().includes(term);
        const tecOk = item.tecido.toLowerCase().includes(term);
        const metOk = item.metragemTecido.toLowerCase().includes(term);
        if (!numOk && !cliOk && !prodOk && !tecOk && !metOk) return false;
      }

      // Filtro de status
      if (filtroStatus !== 'todos' && item.statusPedido !== filtroStatus) {
        return false;
      }

      // Filtro de metragem
      if (filtroMetragem === 'com_metragem' && !item.metragemTecido) return false;
      if (filtroMetragem === 'sem_metragem' && !!item.metragemTecido) return false;

      return true;
    });
  }, [itens, busca, filtroStatus, filtroMetragem]);

  // Agrupamento por Tecido com cálculo de metragem consolidada
  const agrupadosPorTecido: TecidoAgrupado[] = useMemo(() => {
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

  // Estatísticas
  const totalItens = itensFiltrados.length;
  const comMetragem = itensFiltrados.filter(i => !!i.metragemTecido).length;
  const semMetragem = totalItens - comMetragem;
  const totalTiposTecido = agrupadosPorTecido.length;
  const totalMetrosGeral = useMemo(() => {
    return agrupadosPorTecido.reduce((acc, g) => acc + g.totalMetrosCalculado, 0);
  }, [agrupadosPorTecido]);

  // Abertura do modal de impressão com tipo contextual
  const handleAbrirImpressao = (tipoPadrao: 'romaneio' | 'compras' = 'romaneio') => {
    setTipoImpressao(tipoPadrao);
    setItensImpressao(itensFiltrados);
    setAgrupadosImpressao(agrupadosPorTecido);
    setTextoFiltroDataImpresso('');
    setModalImpressaoAberta(true);
  };

  // Callback ao aplicar filtro e disparar impressão no padrão A4 Retrato limpo
  const handleAplicarFiltroEImprimir = (params: {
    tipo: 'romaneio' | 'compras';
    tipoFiltroData: 'todos' | 'mes' | 'dias';
    mesSelecionado: string;
    dateRange: DateRange | undefined;
    itensFiltrados: TecidoItem[];
    agrupadosFiltrados: TecidoAgrupado[];
  }) => {
    setTipoImpressao(params.tipo);
    setItensImpressao(params.itensFiltrados);
    setAgrupadosImpressao(params.agrupadosFiltrados);

    let textoFiltro = '';
    if (params.tipoFiltroData === 'mes' && params.mesSelecionado !== 'todos') {
      try {
        const [ano, mes] = params.mesSelecionado.split('-');
        const d = new Date(Number(ano), Number(mes) - 1, 1);
        const nomeMes = format(d, 'MMMM / yyyy', { locale: ptBR });
        textoFiltro = `Mês: ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}`;
      } catch {
        textoFiltro = `Mês: ${params.mesSelecionado}`;
      }
    } else if (params.tipoFiltroData === 'dias' && params.dateRange?.from) {
      const ini = format(params.dateRange.from, 'dd/MM/yyyy');
      if (params.dateRange.to) {
        const fim = format(params.dateRange.to, 'dd/MM/yyyy');
        textoFiltro = `Período: ${ini} a ${fim}`;
      } else {
        textoFiltro = `Data: ${ini}`;
      }
    }

    setTextoFiltroDataImpresso(textoFiltro);

    // 1. Fecha o modal de configuração
    setModalImpressaoAberta(false);

    // 2. Remove temporariamente a classe 'dark' para que a impressão nunca saia com fundo preto!
    const htmlElem = document.documentElement;
    const eraDark = htmlElem.classList.contains('dark');
    if (eraDark) {
      htmlElem.classList.remove('dark');
    }

    // 3. Dispara a impressão nativa após a transição do DOM
    setTimeout(() => {
      window.print();
      // 4. Restaura o tema escuro
      if (eraDark) {
        htmlElem.classList.add('dark');
      }
    }, 250);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_producao':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">Em Produção</Badge>;
      case 'concluido':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Concluído</Badge>;
      case 'entregue':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">Entregue</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* ========================================================== */}
        {/* CABEÇALHO & AÇÕES (Oculto na impressão)                    */}
        {/* ========================================================== */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Scissors className="w-7 h-7 text-primary" />
              Lista de Compra de Tecidos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Controle unificado de metragens e pedidos de tecidos para compras e corte
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={carregando}
              className="gap-2 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              onClick={() => handleAbrirImpressao(abaAtiva === 'agrupado' ? 'compras' : 'romaneio')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-md px-5"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </Button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* CARDS DE RESUMO (Oculto na impressão)                     */}
        {/* ========================================================== */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/60 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de Peças</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalItens}</p>
              </div>
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Package className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Metragem Definida</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{comMetragem}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Metragem Pendente</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{semMetragem}</p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipos de Tecido</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalTiposTecido}</p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================== */}
        {/* BARRA DE FILTROS & BUSCA (Oculto na impressão)             */}
        {/* ========================================================== */}
        <Card className="no-print border-border/70 shadow-xs">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nº pedido, cliente, produto ou tecido..."
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Filtro Status Pedido */}
              <div className="w-full md:w-48">
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="h-10 text-xs font-medium">
                    <SelectValue placeholder="Status do Pedido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="em_producao">Em Produção</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Metragem */}
              <div className="w-full md:w-52">
                <Select value={filtroMetragem} onValueChange={setFiltroMetragem}>
                  <SelectTrigger className="h-10 text-xs font-medium">
                    <SelectValue placeholder="Filtro de Metragem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Peças</SelectItem>
                    <SelectItem value="com_metragem">Com Metragem Preenchida</SelectItem>
                    <SelectItem value="sem_metragem">Metragem Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================== */}
        {/* TELA INTERATIVA: ABAS DE VISUALIZAÇÃO (Oculto na impressão)*/}
        {/* ========================================================== */}
        <div className="no-print">
          <Tabs value={abaAtiva} onValueChange={(v) => setAbaAtiva(v as any)} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="grid grid-cols-2 w-full sm:w-80">
                <TabsTrigger value="pedidos" className="text-xs font-semibold gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Por Pedido ({itensFiltrados.length})
                </TabsTrigger>
                <TabsTrigger value="agrupado" className="text-xs font-semibold gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Por Tecido ({agrupadosPorTecido.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA 1: LISTAGEM DETALHADA POR PEDIDO */}
            <TabsContent value="pedidos" className="space-y-4">
              <Card className="border-border/70 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                        <th className="py-3.5 px-4">Pedido #</th>
                        <th className="py-3.5 px-4">Produto</th>
                        <th className="py-3.5 px-4">Tecido</th>
                        <th className="py-3.5 px-4 text-center">Metragem</th>
                        <th className="py-3.5 px-4">Dimensões</th>
                        <th className="py-3.5 px-4">Entrega</th>
                        <th className="py-3.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {carregando ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-muted-foreground">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                            Carregando lista de tecidos...
                          </td>
                        </tr>
                      ) : itensFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-muted-foreground">
                            <Scissors className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                            Nenhum tecido encontrado com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        itensFiltrados.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            {/* Pedido */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-foreground text-sm">
                                  #{item.numeroPedido}
                                </span>
                                {getStatusBadge(item.statusPedido)}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px] mt-0.5">
                                {item.clienteNome}
                              </p>
                            </td>

                            {/* Produto */}
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-foreground text-xs sm:text-sm">
                                {item.produtoDescricao}
                              </p>
                              {item.loja && (
                                <span className="text-[10px] text-muted-foreground/80 font-medium">
                                  Loja: {item.loja}
                                </span>
                              )}
                            </td>

                            {/* Tecido */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-primary text-sm">
                                {item.tecido}
                              </span>
                            </td>

                            {/* Metragem */}
                            <td className="py-3.5 px-4 text-center">
                              {item.metragemTecido ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold px-2.5 py-1 text-xs">
                                  {item.metragemTecido}
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPedidoFichaSelecionado({ id: item.pedidoId, numero: item.numeroPedido });
                                    setModalFichaAberta(true);
                                  }}
                                  className="h-7 text-[11px] text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 gap-1 px-2"
                                >
                                  + Informar Metragem
                                </Button>
                              )}
                            </td>

                            {/* Dimensões */}
                            <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                              {item.dimensoes || '—'}
                            </td>

                            {/* Previsão de Entrega */}
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {item.dataPrevisaoEntrega ? (
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                  {format(new Date(item.dataPrevisaoEntrega), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>

                            {/* Ações */}
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPedidoFichaSelecionado({ id: item.pedidoId, numero: item.numeroPedido });
                                  setModalFichaAberta(true);
                                }}
                                className="h-8 text-xs font-semibold gap-1 hover:text-primary"
                                title="Abrir Ficha Técnica"
                              >
                                Ficha Técnica
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* ABA 2: RESUMO AGRUPADO POR TECIDO */}
            <TabsContent value="agrupado" className="space-y-4">
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border/70">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalTiposTecido} tecidos cadastrados</span>
                  {totalMetrosGeral > 0 && (
                    <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                      • Total Estimado: {totalMetrosGeral.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}m
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAbrirImpressao('compras')}
                  className="h-8 text-xs gap-1.5 font-bold shadow-xs hover:bg-primary/10 hover:text-primary"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Resumo de Compras
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agrupadosPorTecido.map((grp, gIdx) => (
                  <Card key={gIdx} className="border-border/70 shadow-xs hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Scissors className="w-4 h-4 text-primary shrink-0" />
                          <CardTitle className="text-base font-bold text-foreground truncate">
                            {grp.tecido}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {grp.totalMetrosCalculado > 0 && (
                            <Badge className="bg-emerald-600 text-white font-black text-xs">
                              {grp.totalMetrosCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m
                            </Badge>
                          )}
                          <Badge variant="secondary" className="font-bold text-xs">
                            {grp.itens.length} {grp.itens.length === 1 ? 'peça' : 'peças'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {/* Metragens Informadas */}
                      {grp.metragens.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                            Metragens informadas para compra:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {grp.metragens.map((m, mIdx) => (
                              <Badge key={mIdx} className="bg-emerald-600 text-white font-bold text-[11px]">
                                {m}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pedidos que usam esse tecido */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Pedidos vinculados:
                        </span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {grp.itens.map((it) => (
                            <div
                              key={it.id}
                              className="text-xs p-2 rounded-md bg-muted/40 flex items-center justify-between hover:bg-muted/60 transition-colors"
                            >
                              <div className="min-w-0">
                                <span className="font-extrabold text-foreground">Pedido #{it.numeroPedido}</span>
                                <span className="text-muted-foreground ml-1.5">({it.produtoDescricao})</span>
                              </div>
                              <div className="shrink-0 font-bold text-primary ml-2">
                                {it.metragemTecido || <span className="text-amber-500 font-normal text-[11px]">Pendente</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

          </Tabs>
        </div>

      </div>

      {/* Modal de Ficha Técnica rápida */}
      <ModalFichaTecnica
        isOpen={modalFichaAberta}
        onClose={() => {
          setModalFichaAberta(false);
          setPedidoFichaSelecionado(null);
        }}
        pedidoId={pedidoFichaSelecionado?.id || null}
        numeroPedido={pedidoFichaSelecionado?.numero}
        onSuccess={() => {
          carregarDados();
        }}
      />

      {/* Modal de Configuração de Impressão com Filtro de Data */}
      <ModalImpressaoTecidos
        isOpen={modalImpressaoAberta}
        onClose={() => setModalImpressaoAberta(false)}
        itens={itensFiltrados}
        filtroStatus={filtroStatus}
        selectedStore={selectedStore}
        initialTipo={tipoImpressao}
        onAplicarFiltroEImprimir={handleAplicarFiltroEImprimir}
      />

      {/* ========================================================== */}
      {/* ÁREA EXCLUSIVA DE IMPRESSÃO NATIVA (RENDERIZADA NO BODY)   */}
      {/* (Garante 100% da largura útil sem ser contida pela sidebar)*/}
      {/* ========================================================== */}
      {typeof document !== 'undefined' && createPortal(
        <div id="print-relatorio-portal" className="portal-print-relatorio">
          {/* Cabeçalho do Romaneio de Tecidos */}
          <div className="border-b-2 border-black pb-2 mb-3 flex justify-between items-start w-full">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider text-black">
                  VÁLLERI • SOFÁ & ARTE
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 text-black font-black uppercase">
                  {tipoImpressao === 'romaneio' ? 'ROMANEIO DE CORTE' : 'LISTA DE COMPRAS'}
                </span>
              </div>
              <h1 className="text-base font-black uppercase tracking-tight text-black mt-0.5">
                {tipoImpressao === 'compras' 
                  ? 'LISTA OFICIAL DE COMPRA DE TECIDOS' 
                  : 'ROMANEIO DE COMPRA E CORTE DE TECIDOS'}
              </h1>
              <p className="text-[9px] text-neutral-800 mt-0.5">
                {tipoImpressao === 'compras'
                  ? 'Consolidado de tecidos e metragens para compras junto aos fornecedores'
                  : 'Controle de conferência, corte e metragens para linha de produção'}
                {selectedStore && selectedStore !== 'todas' && ` • Loja: ${selectedStore}`}
                {textoFiltroDataImpresso && ` • ${textoFiltroDataImpresso}`}
              </p>
            </div>

            <div className="text-right text-[9px] text-neutral-800 leading-tight">
              <p><strong>Emissão:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              <p><strong>Total de Peças:</strong> {(itensImpressao.length > 0 ? itensImpressao : itensFiltrados).length}</p>
              {totalMetrosGeral > 0 && (
                <p className="font-black text-black mt-0.5">
                  Total Estimado: {(agrupadosImpressao.length > 0 ? agrupadosImpressao : agrupadosPorTecido)
                    .reduce((acc, g) => acc + g.totalMetrosCalculado, 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}m
                </p>
              )}
            </div>
          </div>

          {/* TABELA 1: ROMANEIO DETALHADO POR PEÇA (A4 RETRATO) */}
          {tipoImpressao === 'romaneio' && (
            <div className="w-full">
              <table className="print-table w-full text-left border-collapse">
                <colgroup>
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-neutral-100 text-black font-bold">
                    <th className="text-center">[ ✓ ]</th>
                    <th className="text-center">Pedido #</th>
                    <th className="text-center">Entrega</th>
                    <th>Tecido / Cor</th>
                    <th className="text-center">Metragem</th>
                    <th>Produto / Cliente</th>
                    <th>Obs / Conferência</th>
                  </tr>
                </thead>
                <tbody>
                  {(itensImpressao.length > 0 ? itensImpressao : itensFiltrados).map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-neutral-50' : 'bg-white'}>
                      {/* Checkbox alinhado ao topo */}
                      <td className="text-center align-top">
                        <div className="w-3.5 h-3.5 border border-black rounded-xs mx-auto mt-0.5" />
                      </td>

                      {/* Pedido # */}
                      <td className="font-bold text-black text-center align-top whitespace-nowrap">
                        #{item.numeroPedido}
                        {item.loja && (
                          <span className="block text-[7.5px] font-normal text-neutral-600">
                            {item.loja}
                          </span>
                        )}
                      </td>

                      {/* Entrega */}
                      <td className="text-center align-top text-black whitespace-nowrap font-medium">
                        {item.dataPrevisaoEntrega
                          ? format(new Date(item.dataPrevisaoEntrega), 'dd/MM/yyyy')
                          : '—'}
                      </td>

                      {/* Tecido / Cor */}
                      <td className="font-bold text-black align-top leading-tight">
                        {item.tecido}
                      </td>

                      {/* Metragem */}
                      <td className="text-center align-top font-bold text-black">
                        {item.metragemTecido ? (
                          <span className="font-black inline-block px-1 py-0.5 bg-neutral-100 rounded border border-neutral-300 text-black">
                            {item.metragemTecido}
                          </span>
                        ) : (
                          <div className="text-center">
                            <div className="w-11 h-3.5 border-b border-dashed border-neutral-600 mx-auto mt-0.5" />
                            <span className="text-[7px] text-neutral-500 block">definir</span>
                          </div>
                        )}
                      </td>

                      {/* Produto & Cliente */}
                      <td className="align-top">
                        <p className="font-bold text-black leading-tight">{item.produtoDescricao}</p>
                        <p className="text-[8px] text-neutral-600 leading-tight">{item.clienteNome}</p>
                        {item.dimensoes && (
                          <p className="text-[7.5px] text-neutral-500 font-medium leading-tight mt-0.5">
                            Tam: {item.dimensoes}
                          </p>
                        )}
                      </td>

                      {/* Observações */}
                      <td className="align-top text-[8px] text-neutral-800 leading-tight">
                        {item.observacoes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABELA 2: RESUMO CONSOLIDADO POR TECIDO (Lista de Compras) */}
          {tipoImpressao === 'compras' && (
            <div className="w-full">
              <div className="mb-2">
                <h2 className="text-xs font-black uppercase text-black">
                  Resumo de Tecidos para Compras e Cotação
                </h2>
                <p className="text-[8.5px] text-neutral-700">
                  Agrupamento oficial com a soma estimada de metros por tecido
                </p>
              </div>

              <table className="print-table w-full text-left border-collapse">
                <colgroup>
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '30%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-neutral-100 text-black font-bold">
                    <th className="text-center">[ ✓ ]</th>
                    <th>Tecido / Especificação</th>
                    <th className="text-center">Peças</th>
                    <th className="text-center">Metragem Total</th>
                    <th>Pedidos Vinculados</th>
                  </tr>
                </thead>
                <tbody>
                  {(agrupadosImpressao.length > 0 ? agrupadosImpressao : agrupadosPorTecido).map((grp, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-neutral-50' : 'bg-white'}>
                      <td className="text-center align-top">
                        <div className="w-3.5 h-3.5 border border-black rounded-xs mx-auto mt-0.5" />
                      </td>
                      <td className="align-top font-black text-black">
                        {grp.tecido}
                      </td>
                      <td className="text-center align-top font-bold text-black">
                        {grp.itens.length} {grp.itens.length === 1 ? 'peça' : 'peças'}
                      </td>
                      <td className="text-center align-top font-black text-black">
                        {grp.totalMetrosCalculado > 0 ? (
                          <span className="px-1 py-0.5 bg-neutral-100 text-black border border-neutral-400 rounded font-black">
                            {formatMetros(grp.totalMetrosCalculado)}
                          </span>
                        ) : grp.metragens.length > 0 ? (
                          grp.metragens.join(' + ')
                        ) : (
                          <div className="w-12 h-3.5 border-b border-dashed border-neutral-600 mx-auto mt-0.5" />
                        )}
                        {grp.itensSemMetragem > 0 && grp.totalMetrosCalculado > 0 && (
                          <span className="block text-[7px] font-normal text-neutral-600 mt-0.5">
                            (+ {grp.itensSemMetragem} sem metragem)
                          </span>
                        )}
                      </td>
                      <td className="text-[8.5px] text-neutral-800 align-top leading-tight">
                        {grp.itens.map(it => `#${it.numeroPedido}`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé de Assinatura / Conferência */}
          <div className="mt-6 pt-3 border-t border-neutral-400 grid grid-cols-2 gap-8 text-[9px] text-neutral-800 w-full">
            <div>
              <p className="font-bold text-black">Responsável pelas Compras:</p>
              <div className="border-b border-neutral-500 w-full mt-5" />
              <p className="text-[7.5px] text-neutral-600 mt-0.5">Nome legível e assinatura</p>
            </div>
            <div>
              <p className="font-bold text-black">Conferência no Recebimento / Corte:</p>
              <div className="border-b border-neutral-500 w-full mt-5" />
              <div className="flex justify-between text-[7.5px] text-neutral-600 mt-0.5">
                <span>Data: _____/_____/_________</span>
                <span>Status: [  ] Aprovado  [  ] Divergência</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Estilos Globais de Impressão (Fundo 100% Branco e A4 Retrato Total) */}
      <style>{`
        /* Em tela normal, esconder o portal de impressão */
        .portal-print-relatorio {
          display: none !important;
        }

        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 8mm 8mm 8mm !important;
          }

          /* Oculta completamente o app normal do #root para desvincular da sidebar */
          #root,
          .no-print,
          nav,
          header,
          aside,
          button,
          [role="dialog"],
          [data-radix-portal],
          .fixed {
            display: none !important;
          }

          /* Forçar Light Mode e fundo 100% branco para todo o documento impresso */
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            color-scheme: light !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Exibe o portal direto no body ocupando 100% da folha */
          .portal-print-relatorio {
            display: block !important;
            position: static !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          .print-table {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }

          .print-table thead {
            display: table-header-group !important;
          }

          .print-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }

          .print-table th {
            background-color: #f3f4f6 !important;
            background: #f3f4f6 !important;
            border: 1px solid #374151 !important;
            font-weight: 800 !important;
            color: #000000 !important;
            padding: 4px 6px !important;
            font-size: 9px !important;
            text-transform: uppercase !important;
            word-wrap: break-word !important;
          }

          .print-table td {
            border: 1px solid #9ca3af !important;
            vertical-align: top !important;
            color: #000000 !important;
            padding: 3.5px 6px !important;
            font-size: 8.5px !important;
            line-height: 1.25 !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }

          .print-table tr:nth-child(even) td {
            background-color: #f9fafb !important;
            background: #f9fafb !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ListaTecidos;

import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  Search,
  Filter,
  Store as StoreIcon,
  User,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  ArrowRight,
  Clock,
  FileText,
  Shield,
  RotateCcw,
  CheckCircle2,
  Layers
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PedidoLog {
  id: string;
  pedido_id: string;
  numero_pedido: number | null;
  loja: string | null;
  cliente_nome: string | null;
  acao: 'criado' | 'editado' | 'excluido';
  user_id: string | null;
  user_nome: string | null;
  user_role: string | null;
  alteracoes: Record<string, any>;
  created_at: string;
}

const STORE_LABELS: Record<string, string> = {
  loja_1: "Aragão",
  loja_2: "Boa Viagem",
  loja_3: "Tamarineira",
  todas: "Todas as Lojas",
};

const FIELD_LABELS: Record<string, string> = {
  valor_total: "Valor Total",
  cliente_nome: "Nome do Cliente",
  cliente_telefone: "Telefone",
  cliente_endereco: "Endereço",
  descricao_sofa: "Descrição / Produto",
  observacoes: "Observações",
  status: "Status do Pedido",
  data_previsao_entrega: "Previsão de Entrega",
  frete: "Valor do Frete",
  forma_pagamento: "Forma de Pagamento",
  desconto_valor: "Valor do Desconto",
  desconto_tipo: "Tipo de Desconto",
  loja: "Loja",
  prioridade: "Prioridade",
  tipo_pedido: "Tipo de Pedido",
  tecido: "Tecido",
  espuma: "Espuma",
};

const formatValue = (key: string, val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  
  if (key === 'valor_total' || key === 'frete' || key === 'desconto_valor') {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }
  }

  if (key === 'loja') {
    return STORE_LABELS[val] || val;
  }

  if (key === 'status') {
    const statusMap: Record<string, string> = {
      aguardando_producao: 'Aguardando Produção',
      em_producao: 'Em Produção',
      finalizado: 'Finalizado',
      em_entrega: 'Em Entrega',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return statusMap[val] || val;
  }

  if (key === 'data_previsao_entrega' && typeof val === 'string') {
    try {
      const parsed = parseISO(val);
      if (isValid(parsed)) {
        return format(parsed, 'dd/MM/yyyy');
      }
    } catch {
      return val;
    }
  }

  if (typeof val === 'object') {
    return JSON.stringify(val);
  }

  return String(val);
};

export default function LogsAuditoria() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState<'todos' | 'criado' | 'editado' | 'excluido'>('todos');
  const [filtroLoja, setFiltroLoja] = useState<string>('todas');
  const [selectedLog, setSelectedLog] = useState<PedidoLog | null>(null);

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<PedidoLog[]>({
    queryKey: ['pedidos_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;
      return (data || []) as unknown as PedidoLog[];
    },
    enabled: isAdmin,
    refetchInterval: 15000, // Atualização periódica automática
  });

  // Guardião de Rota
  if (authLoading) {
    return (
      <DashboardLayout title="Histórico de Logs">
        <div className="flex items-center justify-center min-h-[400px]">
          <Clock className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filtragem dos logs em memória
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtro por Ação
      if (filtroAcao !== 'todos' && log.acao !== filtroAcao) {
        return false;
      }

      // Filtro por Loja
      if (filtroLoja !== 'todas' && log.loja !== filtroLoja) {
        return false;
      }

      // Filtro por Termo de Busca
      if (termoBusca.trim()) {
        const query = termoBusca.toLowerCase().trim();
        const numStr = log.numero_pedido ? String(log.numero_pedido).toLowerCase() : '';
        const clienteStr = log.cliente_nome ? log.cliente_nome.toLowerCase() : '';
        const userStr = log.user_nome ? log.user_nome.toLowerCase() : '';
        const alteracoesStr = JSON.stringify(log.alteracoes || {}).toLowerCase();

        return (
          numStr.includes(query) ||
          clienteStr.includes(query) ||
          userStr.includes(query) ||
          alteracoesStr.includes(query)
        );
      }

      return true;
    });
  }, [logs, filtroAcao, filtroLoja, termoBusca]);

  // Contadores para os Cards de Métricas
  const contadores = useMemo(() => {
    const total = logs.length;
    const criados = logs.filter(l => l.acao === 'criado').length;
    const editados = logs.filter(l => l.acao === 'editado').length;
    const excluidos = logs.filter(l => l.acao === 'excluido').length;
    return { total, criados, editados, excluidos };
  }, [logs]);

  const renderAcaoBadge = (acao: PedidoLog['acao']) => {
    switch (acao) {
      case 'criado':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
            <PlusCircle className="w-3 h-3" />
            Criado
          </Badge>
        );
      case 'editado':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold">
            <Edit3 className="w-3 h-3" />
            Editado
          </Badge>
        );
      case 'excluido':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 gap-1 font-semibold">
            <Trash2 className="w-3 h-3" />
            Excluído
          </Badge>
        );
    }
  };

  const renderResumoAlteracoes = (log: PedidoLog) => {
    if (log.acao === 'criado') {
      const valor = log.alteracoes?.valor_total
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(log.alteracoes.valor_total)
        : null;
      return (
        <span className="text-xs text-muted-foreground">
          Novo pedido cadastrado {valor ? `no valor de ${valor}` : ''}
        </span>
      );
    }

    if (log.acao === 'excluido') {
      return (
        <span className="text-xs text-destructive font-medium">
          Pedido removido do sistema
        </span>
      );
    }

    // Edição: lista de campos modificados
    const chaves = Object.keys(log.alteracoes || {});
    if (chaves.length === 0) {
      return <span className="text-xs text-muted-foreground">Edição registrada</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 max-w-[380px]">
        {chaves.slice(0, 3).map((campo) => {
          const info = log.alteracoes[campo];
          const label = FIELD_LABELS[campo] || campo;
          const deStr = info?.de !== undefined ? formatValue(campo, info.de) : null;
          const paraStr = info?.para !== undefined ? formatValue(campo, info.para) : null;

          return (
            <span
              key={campo}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] font-medium border text-foreground"
              title={`${label}: de ${deStr} para ${paraStr}`}
            >
              <span>{label}:</span>
              {deStr !== null && <span className="line-through text-muted-foreground">{deStr}</span>}
              <ArrowRight className="w-2.5 h-2.5 text-primary shrink-0" />
              <span className="text-primary font-semibold">{paraStr}</span>
            </span>
          );
        })}
        {chaves.length > 3 && (
          <span className="text-[11px] text-muted-foreground font-medium">
            +{chaves.length - 3} {chaves.length - 3 === 1 ? 'outro' : 'outros'}
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Histórico de Logs">
      <div className="container mx-auto max-w-7xl py-6 space-y-6">
        
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Histórico de Auditoria e Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe todas as criações, alterações de valores, dados e exclusões em tempo real.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 self-start sm:self-auto"
          >
            <RotateCcw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            Atualizar Logs
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total de Ações</p>
                <p className="text-2xl font-bold mt-1">{contadores.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Pedidos Criados</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{contadores.criados}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PlusCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Edições Feitas</p>
                <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{contadores.editados}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Edit3 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Exclusões</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{contadores.excluidos}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              
              {/* Campo de Busca */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nº do pedido, cliente ou colaborador..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Filtro por Loja */}
              <div className="md:col-span-3">
                <Select value={filtroLoja} onValueChange={setFiltroLoja}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por Loja" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Lojas</SelectItem>
                    <SelectItem value="loja_1">Aragão</SelectItem>
                    <SelectItem value="loja_2">Boa Viagem</SelectItem>
                    <SelectItem value="loja_3">Tamarineira</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de Ação */}
              <div className="md:col-span-3 flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                {(['todos', 'criado', 'editado', 'excluido'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroAcao(tipo)}
                    className={cn(
                      "flex-1 py-1 text-xs font-medium rounded-md capitalize transition-all",
                      filtroAcao === tipo
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tipo === 'todos' ? 'Todos' : tipo}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Registros de Auditoria</CardTitle>
                <CardDescription>
                  Exibindo {filteredLogs.length} registro(s) ordenados cronologicamente do mais recente ao mais antigo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[170px]">Data & Hora</TableHead>
                      <TableHead className="w-[100px]">Ação</TableHead>
                      <TableHead className="w-[100px]">Pedido</TableHead>
                      <TableHead className="w-[130px]">Loja</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Alterações Realizadas</TableHead>
                      <TableHead className="w-[80px] text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const dataFormatada = (() => {
                        try {
                          return format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
                        } catch {
                          return log.created_at;
                        }
                      })();

                      return (
                        <TableRow key={log.id} className="hover:bg-muted/40">
                          {/* Data e Hora */}
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {dataFormatada}
                          </TableCell>

                          {/* Badge de Ação */}
                          <TableCell>
                            {renderAcaoBadge(log.acao)}
                          </TableCell>

                          {/* Número do Pedido */}
                          <TableCell>
                            <span className="font-bold text-sm">
                              #{log.numero_pedido ? String(log.numero_pedido).padStart(3, '0') : '—'}
                            </span>
                            {log.cliente_nome && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                                {log.cliente_nome}
                              </p>
                            )}
                          </TableCell>

                          {/* Loja */}
                          <TableCell>
                            <span className="text-xs font-medium">
                              {log.loja ? (STORE_LABELS[log.loja] || log.loja) : '—'}
                            </span>
                          </TableCell>

                          {/* Colaborador */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">
                                {log.user_nome || 'Sistema'}
                              </span>
                              {log.user_role && log.user_role !== 'sistema' && (
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  {log.user_role}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Resumo das Alterações */}
                          <TableCell>
                            {renderResumoAlteracoes(log)}
                          </TableCell>

                          {/* Botão Ver Detalhes */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="Ver detalhes completos das alterações"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-12 text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-medium">Nenhum registro de log encontrado para os filtros selecionados.</p>
                <p className="text-xs text-muted-foreground">Tente limpar a busca ou selecionar outra loja.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhamento do Log */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <DialogTitle>Detalhamento do Registro de Auditoria</DialogTitle>
            </div>
            <DialogDescription>
              Visualize os valores anteriores e os novos valores registrados nesta ação.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-5 pt-2">
              
              {/* Header do Card com Informações do Log */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/60 border text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pedido:</span>
                  <span className="font-bold text-sm">
                    #{selectedLog.numero_pedido ? String(selectedLog.numero_pedido).padStart(3, '0') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Loja:</span>
                  <span className="font-medium text-foreground">
                    {selectedLog.loja ? (STORE_LABELS[selectedLog.loja] || selectedLog.loja) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Ação:</span>
                  <div className="mt-0.5">{renderAcaoBadge(selectedLog.acao)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Colaborador:</span>
                  <span className="font-semibold text-foreground">
                    {selectedLog.user_nome || 'Sistema'}
                  </span>
                </div>
              </div>

              {/* Se for Edição, tabela de Antes e Depois */}
              {selectedLog.acao === 'editado' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Campos Modificados ({Object.keys(selectedLog.alteracoes || {}).length})
                  </h4>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead className="w-[140px]">Campo</TableHead>
                          <TableHead>Valor Anterior</TableHead>
                          <TableHead>Novo Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedLog.alteracoes || {}).map(([campo, diff]: [string, any]) => {
                          const label = FIELD_LABELS[campo] || campo;
                          const deStr = diff?.de !== undefined ? formatValue(campo, diff.de) : '—';
                          const paraStr = diff?.para !== undefined ? formatValue(campo, diff.para) : '—';

                          return (
                            <TableRow key={campo} className="text-xs">
                              <TableCell className="font-medium text-foreground">
                                {label}
                              </TableCell>
                              <TableCell className="text-muted-foreground line-through bg-red-500/5">
                                {deStr}
                              </TableCell>
                              <TableCell className="font-semibold text-primary bg-emerald-500/5">
                                {paraStr}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Se for Criação, resumo dos dados inseridos */}
              {selectedLog.acao === 'criado' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dados Cadastrados Inicialmente
                  </h4>
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-2 text-xs">
                    {Object.entries(selectedLog.alteracoes || {}).map(([campo, valor]) => (
                      <div key={campo} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground">{FIELD_LABELS[campo] || campo}:</span>
                        <span className="font-medium">{formatValue(campo, valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Se for Exclusão */}
              {selectedLog.acao === 'excluido' && (
                <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-500/10 text-xs space-y-2 text-red-700 dark:text-red-300">
                  <p className="font-semibold">Este pedido foi completamente excluído do banco de dados.</p>
                  <div className="space-y-1">
                    <p>Cliente: {selectedLog.cliente_nome || '—'}</p>
                    <p>Número: #{selectedLog.numero_pedido || '—'}</p>
                    <p>Loja: {selectedLog.loja ? (STORE_LABELS[selectedLog.loja] || selectedLog.loja) : '—'}</p>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground text-right font-mono">
                ID do Log: {selectedLog.id}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

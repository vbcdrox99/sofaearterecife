import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Play, Pause, RotateCcw, Hammer, Scissors, Package, Wrench, Shirt, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { producaoService, ItemProducao } from '@/lib/supabase';

// Interfaces movidas para supabase.ts

// Dados fictícios removidos - agora usando dados reais do banco

const Producao = () => {
  const { toast } = useToast();
  const [itensProducao, setItensProducao] = useState<ItemProducao[]>([]);
  const [abaAtiva, setAbaAtiva] = useState('marcenaria');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarItensProducao();
  }, [abaAtiva]);

  const carregarItensProducao = async () => {
    try {
      setCarregando(true);
      const dados = await producaoService.getByEtapa(abaAtiva as ItemProducao['etapa']);
      setItensProducao(dados);
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

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      'baixa': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'urgente': 'bg-red-100 text-red-800'
    };
    return colors[prioridade as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (concluida: boolean) => {
    return concluida 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (concluida: boolean) => {
    return concluida 
      ? <CheckCircle className="w-4 h-4 text-green-600" />
      : <Clock className="w-4 h-4 text-gray-600" />;
  };

  const calcularProgressoItem = (item: ItemProducao) => {
    return item.concluida ? 100 : 0;
  };

  const handleAcaoEtapa = async (acao: string, itemId: string) => {
    try {
      if (acao === 'Concluir') {
        await producaoService.marcarConcluida(itemId);
        toast({
          title: 'Etapa Concluída',
          description: 'A etapa foi marcada como concluída com sucesso.',
        });
      } else if (acao === 'Reabrir') {
        await producaoService.marcarPendente(itemId);
        toast({
          title: 'Etapa Reaberta',
          description: 'A etapa foi marcada como pendente novamente.',
        });
      }
      
      // Recarregar dados
      await carregarItensProducao();
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a etapa.',
        variant: 'destructive',
      });
    }
  };

  const filtrarItensPorEtapa = (etapa: ItemProducao['etapa']) => {
    if (!itensProducao || !Array.isArray(itensProducao)) {
      return [];
    }
    return itensProducao.filter(item => item.etapa === etapa);
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
    <DashboardLayout
      title="Controle de Produção"
      description="Acompanhar o progresso da produção de sofás"
    >
      <div className="space-y-6">
        {/* Resumo da Produção */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Itens na Etapa</p>
                  <p className="text-2xl font-bold">{itensProducao.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {getIconeEtapa(abaAtiva)}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold">
                    {itensProducao ? itensProducao.filter(item => item.concluida).length : 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {itensProducao ? itensProducao.filter(item => !item.concluida).length : 0}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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

          <TabsContent value="marcenaria" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Setor de Marcenaria</h3>
              {carregando ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Carregando itens...</p>
                  </CardContent>
                </Card>
              ) : itensProducao.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum item na marcenaria no momento
                  </CardContent>
                </Card>
              ) : (
                itensProducao.map((item, index) => {
                  const progresso = calcularProgressoItem(item);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg">{item.pedidos?.numero_pedido || 'N/A'}</CardTitle>
                              <Badge className={getStatusColor(item.concluida)}>
                                {item.concluida ? 'Concluída' : 'Pendente'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              <strong>Cliente:</strong> {item.pedidos?.cliente_nome || 'N/A'}
                            </p>
                            <p className="text-muted-foreground">
                              <strong>Produto:</strong> {item.pedidos?.tipo_sofa || 'N/A'}
                            </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <span className="font-semibold">{item.concluida ? 'Concluída' : 'Pendente'}</span>
                              </div>
                              <Progress value={progresso} className="w-32" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Etapa</p>
                                <p className="font-medium">{item.etapa?.charAt(0).toUpperCase() + item.etapa?.slice(1).replace('_', ' ') || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Previsão Entrega</p>
                                <p className="font-medium">
                                  {item.pedidos?.data_previsao_entrega 
                                    ? new Date(item.pedidos.data_previsao_entrega).toLocaleDateString('pt-BR')
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Conclusão</p>
                                <p className="font-medium">
                                  {item.data_conclusao 
                                    ? new Date(item.data_conclusao).toLocaleDateString('pt-BR')
                                    : 'Não concluída'
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Observações */}
                            {item.observacoes && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm"><strong>Observações:</strong> {item.observacoes}</p>
                              </div>
                            )}

                            {/* Etapas de Produção */}
                            <div>
                              <h4 className="font-semibold mb-3">Etapas de Produção</h4>
                              <div className="space-y-3">
                                {(item.etapas || []).filter(etapa => etapa.nome === 'Montagem da Estrutura').map((etapa) => (
                                  <div key={etapa.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3 flex-1">
                                      {getStatusEtapaIcon(etapa.status)}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium">{etapa.nome}</span>
                                          <Badge className={getStatusEtapaColor(etapa.status)} variant="secondary">
                                            {etapa.status.replace('_', ' ').charAt(0).toUpperCase() + etapa.status.replace('_', ' ').slice(1)}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          <strong>Responsável:</strong> {etapa.responsavel} • 
                                          <strong>Tempo:</strong> {etapa.tempoGasto}h / {etapa.tempoEstimado}h
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {etapa.status === 'pendente' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAcaoEtapa('Iniciar', etapa.id, item.numeroPedido)}
                                        >
                                          <Play className="w-4 h-4" />
                                        </Button>
                                      )}
                                      {etapa.status === 'em_andamento' && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAcaoEtapa('Pausar', etapa.id, item.numeroPedido)}
                                          >
                                            <Pause className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleAcaoEtapa('Finalizar', etapa.id, item.numeroPedido)}
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                      {etapa.status === 'pausada' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAcaoEtapa('Retomar', etapa.id, item.numeroPedido)}
                                        >
                                          <RotateCcw className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="corte_costura" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Setor de Corte e Costura</h3>
              {filtrarItensPorEtapa('corte_costura').length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum item no corte e costura no momento
                  </CardContent>
                </Card>
              ) : (
                filtrarItensPorEtapa('corte_costura').map((item, index) => {
                  const progresso = calcularProgressoItem(item);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-lg">#{item.numero_pedido}</CardTitle>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status === 'em_producao' ? 'Em Produção' : 
                                   item.status === 'concluido' ? 'Concluído' : 
                                   item.status === 'entregue' ? 'Entregue' : 'Pendente'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                <strong>Cliente:</strong> {item.cliente_nome}
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Produto:</strong> {item.tipo_sofa}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">Progresso:</span>
                                <span className="font-semibold">{progresso}%</span>
                              </div>
                              <Progress value={progresso} className="w-32" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Etapa</p>
                                <p className="font-medium">{item.etapa}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Previsão</p>
                                <p className="font-medium">{item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Conclusão</p>
                                <p className="font-medium">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Pendente'}</p>
                              </div>
                            </div>

                            {/* Observações */}
                            {item.observacoes && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm"><strong>Observações:</strong> {item.observacoes}</p>
                              </div>
                            )}

                            {/* Etapas de Produção */}
                            <div>
                              <h4 className="font-semibold mb-3">Etapas de Produção</h4>
                              <div className="space-y-3">
                                {(item.etapas || []).filter(etapa => etapa.nome === 'Corte do Tecido/Couro').map((etapa) => (
                                  <div key={etapa.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3 flex-1">
                                      {getStatusEtapaIcon(etapa.status)}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium">{etapa.nome}</span>
                                          <Badge className={getStatusEtapaColor(etapa.status)} variant="secondary">
                                            {etapa.status.replace('_', ' ').charAt(0).toUpperCase() + etapa.status.replace('_', ' ').slice(1)}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          <strong>Responsável:</strong> {etapa.responsavel} • 
                                          <strong>Tempo:</strong> {etapa.tempoGasto}h / {etapa.tempoEstimado}h
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {etapa.status === 'pendente' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAcaoEtapa('Iniciar', etapa.id, item.numeroPedido)}
                                        >
                                          <Play className="w-4 h-4" />
                                        </Button>
                                      )}
                                      {etapa.status === 'em_andamento' && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAcaoEtapa('Pausar', etapa.id, item.numeroPedido)}
                                          >
                                            <Pause className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleAcaoEtapa('Finalizar', etapa.id, item.numeroPedido)}
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                      {etapa.status === 'pausada' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAcaoEtapa('Retomar', etapa.id, item.numeroPedido)}
                                        >
                                          <RotateCcw className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="espuma" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Setor de Espuma - Estofamento</h3>
              {carregando ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Carregando itens...</span>
                </div>
              ) : itensProducao.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum item no setor de espuma no momento
                  </CardContent>
                </Card>
              ) : (
                itensProducao.map((item, index) => {
                  const progresso = calcularProgressoItem(item);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-lg">#{item.numero_pedido}</CardTitle>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status === 'em_producao' ? 'Em Produção' : 
                                   item.status === 'concluido' ? 'Concluído' : 
                                   item.status === 'entregue' ? 'Entregue' : 'Pendente'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                <strong>Cliente:</strong> {item.cliente_nome}
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Produto:</strong> {item.tipo_sofa}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">Progresso:</span>
                                <span className="font-semibold">{progresso}%</span>
                              </div>
                              <Progress value={progresso} className="w-32" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Etapa</p>
                              <p className="font-medium">{item.etapa}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Previsão</p>
                              <p className="font-medium">{item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Conclusão</p>
                              <p className="font-medium">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Pendente'}</p>
                            </div>
                          </div>

                            {/* Observações */}
                            {item.observacoes && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm"><strong>Observações:</strong> {item.observacoes}</p>
                              </div>
                            )}

                            {/* Ações da Etapa */}
                            <div className="flex items-center gap-2">
                              {item.status === 'pendente' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcaoEtapa('Iniciar', item.id, `#${item.numero_pedido}`)}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Iniciar Etapa
                                </Button>
                              )}
                              {item.status === 'em_producao' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAcaoEtapa('Pausar', item.id, `#${item.numero_pedido}`)}
                                  >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pausar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcaoEtapa('Finalizar', item.id, `#${item.numero_pedido}`)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Finalizar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="bancada" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Setor de Bancada - Acabamento Final</h3>
              {carregando ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Carregando itens...</span>
                </div>
              ) : itensProducao.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum item na bancada no momento
                  </CardContent>
                </Card>
              ) : (
                itensProducao.map((item, index) => {
                  const progresso = calcularProgressoItem(item);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-lg">#{item.numero_pedido}</CardTitle>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status === 'em_producao' ? 'Em Produção' : 
                                   item.status === 'concluido' ? 'Concluído' : 
                                   item.status === 'entregue' ? 'Entregue' : 'Pendente'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                <strong>Cliente:</strong> {item.cliente_nome}
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Produto:</strong> {item.tipo_sofa}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">Progresso:</span>
                                <span className="font-semibold">{progresso}%</span>
                              </div>
                              <Progress value={progresso} className="w-32" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Etapa</p>
                                <p className="font-medium">{item.etapa}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Previsão</p>
                                <p className="font-medium">{item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Conclusão</p>
                                <p className="font-medium">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Pendente'}</p>
                              </div>
                            </div>

                            {/* Observações */}
                            {item.observacoes && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm"><strong>Observações:</strong> {item.observacoes}</p>
                              </div>
                            )}

                            {/* Ações da Etapa */}
                            <div>
                              <h4 className="font-semibold mb-3">Ações da Etapa</h4>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcaoEtapa(item.id, 'iniciar')}
                                  disabled={item.status === 'concluido'}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Iniciar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcaoEtapa(item.id, 'pausar')}
                                  disabled={item.status !== 'em_producao'}
                                >
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pausar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcaoEtapa(item.id, 'finalizar')}
                                  disabled={item.status === 'concluido'}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Finalizar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="tecido" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Setor de Tecido - Controle de Qualidade</h3>
              {carregando ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Carregando itens...</span>
                </div>
              ) : itensProducao.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum item no controle de qualidade no momento
                  </CardContent>
                </Card>
              ) : (
                itensProducao.map((item, index) => {
                  const progresso = calcularProgressoItem(item);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-lg">#{item.numero_pedido}</CardTitle>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status === 'em_producao' ? 'Em Produção' : 
                                   item.status === 'concluido' ? 'Concluído' : 
                                   item.status === 'entregue' ? 'Entregue' : 'Pendente'}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                <strong>Cliente:</strong> {item.cliente_nome}
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Produto:</strong> {item.tipo_sofa}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground">Progresso:</span>
                                <span className="font-semibold">{progresso}%</span>
                              </div>
                              <Progress value={progresso} className="w-32" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Informações Gerais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Etapa</p>
                                <p className="font-medium">{item.etapa}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Previsão</p>
                                <p className="font-medium">{item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Conclusão</p>
                                <p className="font-medium">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Pendente'}</p>
                              </div>
                            </div>

                            {/* Observações */}
                            {item.observacoes && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm"><strong>Observações:</strong> {item.observacoes}</p>
                              </div>
                            )}

                            {/* Ações da Etapa */}
                            <div>
                              <h4 className="font-semibold mb-3">Ações da Etapa</h4>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcaoEtapa(item.id, 'iniciar')}
                                  disabled={item.status === 'concluido'}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Iniciar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcaoEtapa(item.id, 'pausar')}
                                  disabled={item.status !== 'em_producao'}
                                >
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pausar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcaoEtapa(item.id, 'finalizar')}
                                  disabled={item.status === 'concluido'}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Finalizar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Lista de Itens em Produção - Visão Geral */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Visão Geral - Todos os Itens</h3>
          {itensProducao.map((item, index) => {
            const progresso = calcularProgressoItem(item);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">#{item.numero_pedido}</CardTitle>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status === 'em_producao' ? 'Em Produção' : 
                             item.status === 'concluido' ? 'Concluído' : 
                             item.status === 'entregue' ? 'Entregue' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          <strong>Cliente:</strong> {item.cliente_nome}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Produto:</strong> {item.tipo_sofa}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground">Progresso:</span>
                          <span className="font-semibold">{progresso}%</span>
                        </div>
                        <Progress value={progresso} className="w-32" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Informações Gerais */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Etapa</p>
                          <p className="font-medium">{item.etapa}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Previsão</p>
                          <p className="font-medium">{item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conclusão</p>
                          <p className="font-medium">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Pendente'}</p>
                        </div>
                      </div>

                      {/* Observações */}
                      {item.observacoes && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm"><strong>Observações:</strong> {item.observacoes}</p>
                        </div>
                      )}

                      {/* Ações da Etapa */}
                      <div>
                        <h4 className="font-semibold mb-3">Ações da Etapa</h4>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleAcaoEtapa(item.id, 'iniciar')}
                            disabled={item.status === 'concluido' || item.status === 'entregue'}
                          >
                            Iniciar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcaoEtapa(item.id, 'pausar')}
                            disabled={item.status !== 'em_producao'}
                          >
                            Pausar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcaoEtapa(item.id, 'finalizar')}
                            disabled={item.status === 'concluido' || item.status === 'entregue'}
                          >
                            Finalizar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcaoEtapa(item.id, 'retomar')}
                            disabled={item.status !== 'pausado'}
                          >
                            Retomar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Producao;
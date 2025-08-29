import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface EtapaProducao {
  id: string;
  nome: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'pausada';
  tempoEstimado: number; // em horas
  tempoGasto: number; // em horas
  responsavel: string;
}

interface ItemProducao {
  id: string;
  numeroPedido: string;
  clienteNome: string;
  tipoSofa: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataInicio: string;
  dataPrevisaoTermino: string;
  etapas: EtapaProducao[];
  observacoes: string;
}

const itensProducaoFicticios: ItemProducao[] = [
  {
    id: '1',
    numeroPedido: 'PED-2024-001',
    clienteNome: 'Maria Silva Santos',
    tipoSofa: 'Sofá 3 Lugares - Couro Marrom',
    prioridade: 'alta',
    dataInicio: '2024-01-20',
    dataPrevisaoTermino: '2024-02-15',
    observacoes: 'Cliente solicitou acabamento especial nas costuras',
    etapas: [
      {
        id: '1-1',
        nome: 'Corte do Tecido/Couro',
        status: 'concluida',
        tempoEstimado: 4,
        tempoGasto: 3.5,
        responsavel: 'João Silva'
      },
      {
        id: '1-2',
        nome: 'Montagem da Estrutura',
        status: 'concluida',
        tempoEstimado: 8,
        tempoGasto: 7.5,
        responsavel: 'Carlos Santos'
      },
      {
        id: '1-3',
        nome: 'Estofamento',
        status: 'em_andamento',
        tempoEstimado: 12,
        tempoGasto: 8,
        responsavel: 'Ana Costa'
      },
      {
        id: '1-4',
        nome: 'Acabamento Final',
        status: 'pendente',
        tempoEstimado: 6,
        tempoGasto: 0,
        responsavel: 'Pedro Lima'
      },
      {
        id: '1-5',
        nome: 'Controle de Qualidade',
        status: 'pendente',
        tempoEstimado: 2,
        tempoGasto: 0,
        responsavel: 'Lucia Ferreira'
      }
    ]
  },
  {
    id: '2',
    numeroPedido: 'PED-2024-006',
    clienteNome: 'Carlos Eduardo Santos',
    tipoSofa: 'Sofá 4 Lugares - Suede Verde',
    prioridade: 'media',
    dataInicio: '2024-01-25',
    dataPrevisaoTermino: '2024-02-28',
    observacoes: 'Verificar disponibilidade do tecido verde escuro',
    etapas: [
      {
        id: '2-1',
        nome: 'Corte do Tecido/Couro',
        status: 'em_andamento',
        tempoEstimado: 5,
        tempoGasto: 2,
        responsavel: 'João Silva'
      },
      {
        id: '2-2',
        nome: 'Montagem da Estrutura',
        status: 'pendente',
        tempoEstimado: 10,
        tempoGasto: 0,
        responsavel: 'Carlos Santos'
      },
      {
        id: '2-3',
        nome: 'Estofamento',
        status: 'pendente',
        tempoEstimado: 14,
        tempoGasto: 0,
        responsavel: 'Ana Costa'
      },
      {
        id: '2-4',
        nome: 'Acabamento Final',
        status: 'pendente',
        tempoEstimado: 7,
        tempoGasto: 0,
        responsavel: 'Pedro Lima'
      },
      {
        id: '2-5',
        nome: 'Controle de Qualidade',
        status: 'pendente',
        tempoEstimado: 2,
        tempoGasto: 0,
        responsavel: 'Lucia Ferreira'
      }
    ]
  }
];

const Producao = () => {
  const { toast } = useToast();
  const [itensProducao] = useState<ItemProducao[]>(itensProducaoFicticios);

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      'baixa': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'urgente': 'bg-red-100 text-red-800'
    };
    return colors[prioridade as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusEtapaColor = (status: string) => {
    const colors = {
      'pendente': 'bg-gray-100 text-gray-800',
      'em_andamento': 'bg-blue-100 text-blue-800',
      'concluida': 'bg-green-100 text-green-800',
      'pausada': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusEtapaIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'em_andamento':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'pausada':
        return <Pause className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const calcularProgressoGeral = (etapas: EtapaProducao[]) => {
    const totalEtapas = etapas.length;
    const etapasConcluidas = etapas.filter(etapa => etapa.status === 'concluida').length;
    const etapasEmAndamento = etapas.filter(etapa => etapa.status === 'em_andamento').length;
    
    return Math.round(((etapasConcluidas + (etapasEmAndamento * 0.5)) / totalEtapas) * 100);
  };

  const calcularTempoTotal = (etapas: EtapaProducao[]) => {
    const tempoEstimado = etapas.reduce((total, etapa) => total + etapa.tempoEstimado, 0);
    const tempoGasto = etapas.reduce((total, etapa) => total + etapa.tempoGasto, 0);
    return { tempoEstimado, tempoGasto };
  };

  const handleAcaoEtapa = (acao: string, etapaId: string, itemId: string) => {
    toast({
      title: `${acao} Executado`,
      description: `Ação "${acao}" executada para a etapa ${etapaId} do item ${itemId}. (Demonstração)`,
    });
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
                  <p className="text-sm font-medium text-muted-foreground">Em Produção</p>
                  <p className="text-2xl font-bold">{itensProducao.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Etapas Concluídas</p>
                  <p className="text-2xl font-bold">
                    {itensProducao.reduce((total, item) => 
                      total + item.etapas.filter(etapa => etapa.status === 'concluida').length, 0
                    )}
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
                  <p className="text-sm font-medium text-muted-foreground">Atrasos</p>
                  <p className="text-2xl font-bold text-red-600">0</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Itens em Produção */}
        <div className="space-y-6">
          {itensProducao.map((item, index) => {
            const progresso = calcularProgressoGeral(item.etapas);
            const { tempoEstimado, tempoGasto } = calcularTempoTotal(item.etapas);
            
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
                          <CardTitle className="text-lg">{item.numeroPedido}</CardTitle>
                          <Badge className={getPrioridadeColor(item.prioridade)}>
                            {item.prioridade.charAt(0).toUpperCase() + item.prioridade.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          <strong>Cliente:</strong> {item.clienteNome}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Produto:</strong> {item.tipoSofa}
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
                          <p className="text-sm text-muted-foreground">Início</p>
                          <p className="font-medium">{new Date(item.dataInicio).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Previsão</p>
                          <p className="font-medium">{new Date(item.dataPrevisaoTermino).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tempo</p>
                          <p className="font-medium">{tempoGasto}h / {tempoEstimado}h</p>
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
                          {item.etapas.map((etapa) => (
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
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Producao;
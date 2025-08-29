import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, CheckCircle, Phone, Calendar, Navigation, Package } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EntregaItem {
  id: string;
  numeroPedido: string;
  clienteNome: string;
  clienteTelefone: string;
  tipoSofa: string;
  valor: number;
  enderecoCompleto: string;
  bairro: string;
  cidade: string;
  cep: string;
  status: 'agendada' | 'em_rota' | 'tentativa_entrega' | 'entregue' | 'reagendada';
  dataAgendamento: string;
  horarioAgendamento: string;
  entregador: string;
  veiculo: string;
  observacoes: string;
  tentativasEntrega: number;
  dataEntrega?: string;
  assinatura?: string;
  fotos?: string[];
}

const entregasFicticias: EntregaItem[] = [
  {
    id: '1',
    numeroPedido: 'PED-2024-003',
    clienteNome: 'Ana Paula Costa',
    clienteTelefone: '(81) 99999-1234',
    tipoSofa: 'Sofá 2 Lugares - Veludo Azul',
    valor: 1800.00,
    enderecoCompleto: 'Rua das Flores, 123, Apt 501',
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    cep: '51020-000',
    status: 'agendada',
    dataAgendamento: '2024-02-15',
    horarioAgendamento: '14:00',
    entregador: 'Carlos Silva',
    veiculo: 'Caminhão - ABC-1234',
    observacoes: 'Entregar no período da tarde. Porteiro 24h. Apartamento no 5º andar.',
    tentativasEntrega: 0
  },
  {
    id: '2',
    numeroPedido: 'PED-2024-004',
    clienteNome: 'Roberto Ferreira',
    clienteTelefone: '(81) 98888-5678',
    tipoSofa: 'Sofá Reclinável - Couro Preto',
    valor: 4500.00,
    enderecoCompleto: 'Av. Conselheiro Aguiar, 456, Casa',
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    cep: '51021-000',
    status: 'entregue',
    dataAgendamento: '2024-02-05',
    horarioAgendamento: '09:00',
    entregador: 'João Santos',
    veiculo: 'Caminhão - DEF-5678',
    observacoes: 'Entrega realizada com sucesso. Cliente muito satisfeito com o produto.',
    tentativasEntrega: 1,
    dataEntrega: '2024-02-05',
    assinatura: 'Roberto Ferreira',
    fotos: ['entrega1.jpg', 'entrega2.jpg']
  },
  {
    id: '3',
    numeroPedido: 'PED-2024-009',
    clienteNome: 'Fernanda Lima',
    clienteTelefone: '(81) 97777-0000',
    tipoSofa: 'Sofá com Chaise - Linho Bege',
    valor: 2800.00,
    enderecoCompleto: 'Rua do Sol, 789, Casa 2',
    bairro: 'Casa Forte',
    cidade: 'Recife',
    cep: '52060-000',
    status: 'em_rota',
    dataAgendamento: '2024-02-14',
    horarioAgendamento: '10:30',
    entregador: 'Pedro Costa',
    veiculo: 'Van - GHI-9012',
    observacoes: 'Saiu para entrega às 09:30. Previsão de chegada: 10:30.',
    tentativasEntrega: 0
  },
  {
    id: '4',
    numeroPedido: 'PED-2024-010',
    clienteNome: 'Marcos Oliveira',
    clienteTelefone: '(81) 96666-1111',
    tipoSofa: 'Sofá 3 Lugares - Tecido Cinza',
    valor: 2400.00,
    enderecoCompleto: 'Rua da Paz, 321, Apt 203',
    bairro: 'Espinheiro',
    cidade: 'Recife',
    cep: '52020-000',
    status: 'tentativa_entrega',
    dataAgendamento: '2024-02-13',
    horarioAgendamento: '15:00',
    entregador: 'Carlos Silva',
    veiculo: 'Caminhão - ABC-1234',
    observacoes: 'Cliente não estava em casa. Tentativa de contato realizada.',
    tentativasEntrega: 1
  },
  {
    id: '5',
    numeroPedido: 'PED-2024-011',
    clienteNome: 'Juliana Santos',
    clienteTelefone: '(81) 95555-2222',
    tipoSofa: 'Sofá de Canto - Veludo Verde',
    valor: 3200.00,
    enderecoCompleto: 'Av. Norte, 654, Cobertura',
    bairro: 'Aflitos',
    cidade: 'Recife',
    cep: '52050-000',
    status: 'reagendada',
    dataAgendamento: '2024-02-16',
    horarioAgendamento: '16:00',
    entregador: 'João Santos',
    veiculo: 'Caminhão - DEF-5678',
    observacoes: 'Reagendada a pedido do cliente. Nova data: 16/02 às 16:00.',
    tentativasEntrega: 1
  }
];

const Entrega = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [entregas] = useState<EntregaItem[]>(entregasFicticias);

  const getStatusLabel = (status: string) => {
    const labels = {
      'agendada': 'Agendada',
      'em_rota': 'Em Rota',
      'tentativa_entrega': 'Tentativa de Entrega',
      'entregue': 'Entregue',
      'reagendada': 'Reagendada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'agendada': 'bg-blue-100 text-blue-800',
      'em_rota': 'bg-orange-100 text-orange-800',
      'tentativa_entrega': 'bg-yellow-100 text-yellow-800',
      'entregue': 'bg-green-100 text-green-800',
      'reagendada': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendada':
        return <Calendar className="w-4 h-4" />;
      case 'em_rota':
        return <Navigation className="w-4 h-4" />;
      case 'tentativa_entrega':
        return <Clock className="w-4 h-4" />;
      case 'entregue':
        return <CheckCircle className="w-4 h-4" />;
      case 'reagendada':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const filteredEntregas = entregas.filter(entrega => {
    if (statusFilter === 'todos') return true;
    return entrega.status === statusFilter;
  });

  const handleAcao = (acao: string, entregaId: string) => {
    toast({
      title: `${acao} Executado`,
      description: `Ação "${acao}" executada para a entrega ${entregaId}. (Demonstração)`,
    });
  };

  const estatisticas = {
    total: entregas.length,
    agendadas: entregas.filter(e => e.status === 'agendada').length,
    emRota: entregas.filter(e => e.status === 'em_rota').length,
    entregues: entregas.filter(e => e.status === 'entregue').length,
    tentativas: entregas.filter(e => e.status === 'tentativa_entrega').length
  };

  return (
    <DashboardLayout
      title="Controle de Entregas"
      description="Gerenciar e acompanhar entregas de produtos"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{estatisticas.total}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agendadas</p>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.agendadas}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Rota</p>
                  <p className="text-2xl font-bold text-orange-600">{estatisticas.emRota}</p>
                </div>
                <Navigation className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.entregues}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tentativas</p>
                  <p className="text-2xl font-bold text-yellow-600">{estatisticas.tentativas}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="agendada">Agendadas</SelectItem>
                  <SelectItem value="em_rota">Em Rota</SelectItem>
                  <SelectItem value="tentativa_entrega">Tentativa de Entrega</SelectItem>
                  <SelectItem value="entregue">Entregues</SelectItem>
                  <SelectItem value="reagendada">Reagendadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Entregas */}
        <div className="space-y-6">
          {filteredEntregas.map((entrega, index) => (
            <motion.div
              key={entrega.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{entrega.numeroPedido}</CardTitle>
                        <Badge className={getStatusColor(entrega.status)}>
                          {getStatusIcon(entrega.status)}
                          <span className="ml-1">{getStatusLabel(entrega.status)}</span>
                        </Badge>
                        {entrega.tentativasEntrega > 0 && (
                          <Badge variant="outline">
                            {entrega.tentativasEntrega} tentativa(s)
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        <strong>Cliente:</strong> {entrega.clienteNome}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Produto:</strong> {entrega.tipoSofa}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        R$ {entrega.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entrega.dataAgendamento).toLocaleDateString('pt-BR')} às {entrega.horarioAgendamento}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Informações de Entrega */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Endereço de Entrega
                          </h4>
                          <div className="space-y-2">
                            <p className="font-medium">{entrega.enderecoCompleto}</p>
                            <p className="text-sm text-muted-foreground">
                              {entrega.bairro}, {entrega.cidade}
                            </p>
                            <p className="text-sm text-muted-foreground">CEP: {entrega.cep}</p>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            Contato
                          </h4>
                          <p className="font-medium">{entrega.clienteTelefone}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            Informações da Entrega
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <strong>Entregador:</strong> {entrega.entregador}
                            </p>
                            <p className="text-sm">
                              <strong>Veículo:</strong> {entrega.veiculo}
                            </p>
                            <p className="text-sm">
                              <strong>Data/Hora:</strong> {new Date(entrega.dataAgendamento).toLocaleDateString('pt-BR')} às {entrega.horarioAgendamento}
                            </p>
                            {entrega.dataEntrega && (
                              <p className="text-sm">
                                <strong>Entregue em:</strong> {new Date(entrega.dataEntrega).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {entrega.status === 'entregue' && entrega.assinatura && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              Entrega Confirmada
                            </h4>
                            <p className="text-sm">
                              <strong>Assinatura:</strong> {entrega.assinatura}
                            </p>
                            {entrega.fotos && entrega.fotos.length > 0 && (
                              <p className="text-sm mt-1">
                                <strong>Fotos:</strong> {entrega.fotos.length} arquivo(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Observações</h4>
                      <p className="text-sm">{entrega.observacoes}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2">
                      {entrega.status === 'agendada' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcao('Iniciar Rota', entrega.numeroPedido)}
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Iniciar Rota
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcao('Reagendar', entrega.numeroPedido)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Reagendar
                          </Button>
                        </>
                      )}
                      
                      {entrega.status === 'em_rota' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcao('Confirmar Entrega', entrega.numeroPedido)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Entrega
                        </Button>
                      )}
                      
                      {entrega.status === 'tentativa_entrega' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcao('Nova Tentativa', entrega.numeroPedido)}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Nova Tentativa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcao('Reagendar', entrega.numeroPedido)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Reagendar
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcao('Contatar Cliente', entrega.numeroPedido)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Contatar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcao('Ver no Mapa', entrega.numeroPedido)}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Ver no Mapa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {filteredEntregas.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma entrega encontrada com os filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Entrega;
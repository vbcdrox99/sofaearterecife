import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Eye, FileText, Star, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ControleQualidade {
  aprovado: boolean;
  observacoes: string;
  responsavel: string;
  dataAvaliacao: string;
  nota: number; // 1-5
}

interface ProdutoFinalizado {
  id: string;
  numeroPedido: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  tipoSofa: string;
  valor: number;
  dataFinalizacao: string;
  controleQualidade: ControleQualidade;
  statusEntrega: 'aguardando_retirada' | 'pronto_entrega' | 'em_transporte' | 'entregue';
  enderecoEntrega: string;
  observacoesEntrega: string;
  fotos: string[];
}

const produtosFinalizadosFicticios: ProdutoFinalizado[] = [
  {
    id: '1',
    numeroPedido: 'PED-2024-003',
    clienteNome: 'Ana Paula Costa',
    clienteTelefone: '(81) 99999-1234',
    clienteEmail: 'ana.costa@email.com',
    tipoSofa: 'Sofá 2 Lugares - Veludo Azul',
    valor: 1800.00,
    dataFinalizacao: '2024-02-08',
    controleQualidade: {
      aprovado: true,
      observacoes: 'Produto em perfeitas condições. Acabamento impecável.',
      responsavel: 'Lucia Ferreira',
      dataAvaliacao: '2024-02-08',
      nota: 5
    },
    statusEntrega: 'pronto_entrega',
    enderecoEntrega: 'Rua das Flores, 123 - Boa Viagem, Recife/PE',
    observacoesEntrega: 'Entregar no período da manhã. Porteiro 24h.',
    fotos: ['foto1.jpg', 'foto2.jpg', 'foto3.jpg']
  },
  {
    id: '2',
    numeroPedido: 'PED-2024-004',
    clienteNome: 'Roberto Ferreira',
    clienteTelefone: '(81) 98888-5678',
    clienteEmail: 'roberto.ferreira@email.com',
    tipoSofa: 'Sofá Reclinável - Couro Preto',
    valor: 4500.00,
    dataFinalizacao: '2024-02-05',
    controleQualidade: {
      aprovado: true,
      observacoes: 'Mecanismo de reclinação funcionando perfeitamente. Couro de alta qualidade.',
      responsavel: 'Lucia Ferreira',
      dataAvaliacao: '2024-02-05',
      nota: 5
    },
    statusEntrega: 'entregue',
    enderecoEntrega: 'Av. Conselheiro Aguiar, 456 - Boa Viagem, Recife/PE',
    observacoesEntrega: 'Entrega realizada com sucesso. Cliente muito satisfeito.',
    fotos: ['foto4.jpg', 'foto5.jpg']
  },
  {
    id: '3',
    numeroPedido: 'PED-2024-007',
    clienteNome: 'Mariana Oliveira',
    clienteTelefone: '(81) 97777-9012',
    clienteEmail: 'mariana.oliveira@email.com',
    tipoSofa: 'Sofá de Canto - Tecido Bege',
    valor: 3100.00,
    dataFinalizacao: '2024-02-10',
    controleQualidade: {
      aprovado: true,
      observacoes: 'Pequeno ajuste necessário no encaixe do canto. Corrigido com sucesso.',
      responsavel: 'Lucia Ferreira',
      dataAvaliacao: '2024-02-10',
      nota: 4
    },
    statusEntrega: 'aguardando_retirada',
    enderecoEntrega: 'Cliente irá retirar na loja',
    observacoesEntrega: 'Cliente confirmou retirada para o dia 15/02.',
    fotos: ['foto6.jpg', 'foto7.jpg', 'foto8.jpg']
  },
  {
    id: '4',
    numeroPedido: 'PED-2024-008',
    clienteNome: 'Paulo Santos',
    clienteTelefone: '(81) 96666-3456',
    clienteEmail: 'paulo.santos@email.com',
    tipoSofa: 'Sofá 3 Lugares - Linho Cinza',
    valor: 2200.00,
    dataFinalizacao: '2024-02-12',
    controleQualidade: {
      aprovado: false,
      observacoes: 'Pequena mancha detectada no tecido. Necessário limpeza especializada.',
      responsavel: 'Lucia Ferreira',
      dataAvaliacao: '2024-02-12',
      nota: 3
    },
    statusEntrega: 'aguardando_retirada',
    enderecoEntrega: 'Rua do Sol, 789 - Casa Forte, Recife/PE',
    observacoesEntrega: 'Aguardando correção do problema identificado no controle de qualidade.',
    fotos: ['foto9.jpg']
  }
];

const Finalizados = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [produtos] = useState<ProdutoFinalizado[]>(produtosFinalizadosFicticios);

  const getStatusEntregaLabel = (status: string) => {
    const labels = {
      'aguardando_retirada': 'Aguardando Retirada',
      'pronto_entrega': 'Pronto para Entrega',
      'em_transporte': 'Em Transporte',
      'entregue': 'Entregue'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusEntregaColor = (status: string) => {
    const colors = {
      'aguardando_retirada': 'bg-yellow-100 text-yellow-800',
      'pronto_entrega': 'bg-blue-100 text-blue-800',
      'em_transporte': 'bg-orange-100 text-orange-800',
      'entregue': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getNotaStars = (nota: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < nota ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const filteredProdutos = produtos.filter(produto => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'aprovados') return produto.controleQualidade.aprovado;
    if (statusFilter === 'reprovados') return !produto.controleQualidade.aprovado;
    return produto.statusEntrega === statusFilter;
  });

  const handleAcao = (acao: string, produtoId: string) => {
    toast({
      title: `${acao} Executado`,
      description: `Ação "${acao}" executada para o produto ${produtoId}. (Demonstração)`,
    });
  };

  return (
    <DashboardLayout
      title="Produtos Finalizados"
      description="Gerenciar produtos finalizados e controle de qualidade"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Finalizados</p>
                  <p className="text-2xl font-bold">{produtos.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {produtos.filter(p => p.controleQualidade.aprovado).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendências</p>
                  <p className="text-2xl font-bold text-red-600">
                    {produtos.filter(p => !p.controleQualidade.aprovado).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold">
                    {produtos.filter(p => p.statusEntrega === 'entregue').length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-blue-600" />
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
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aprovados">Aprovados no CQ</SelectItem>
                  <SelectItem value="reprovados">Pendências no CQ</SelectItem>
                  <SelectItem value="aguardando_retirada">Aguardando Retirada</SelectItem>
                  <SelectItem value="pronto_entrega">Pronto para Entrega</SelectItem>
                  <SelectItem value="em_transporte">Em Transporte</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <div className="space-y-6">
          {filteredProdutos.map((produto, index) => (
            <motion.div
              key={produto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{produto.numeroPedido}</CardTitle>
                        <Badge className={getStatusEntregaColor(produto.statusEntrega)}>
                          {getStatusEntregaLabel(produto.statusEntrega)}
                        </Badge>
                        {produto.controleQualidade.aprovado ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprovado CQ
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pendência CQ
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        <strong>Cliente:</strong> {produto.clienteNome}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Produto:</strong> {produto.tipoSofa}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        R$ {produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Finalizado em {new Date(produto.dataFinalizacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Controle de Qualidade */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Controle de Qualidade
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Avaliação</p>
                          <div className="flex items-center gap-2">
                            {getNotaStars(produto.controleQualidade.nota)}
                            <span className="text-sm font-medium">({produto.controleQualidade.nota}/5)</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Responsável</p>
                          <p className="font-medium">{produto.controleQualidade.responsavel}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Observações</p>
                        <p className="text-sm">{produto.controleQualidade.observacoes}</p>
                      </div>
                    </div>

                    {/* Informações de Entrega */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Informações de Entrega
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Endereço</p>
                          <p className="font-medium">{produto.enderecoEntrega}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Observações</p>
                          <p className="text-sm">{produto.observacoesEntrega}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contato do Cliente */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-3">Contato do Cliente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{produto.clienteTelefone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{produto.clienteEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcao('Visualizar Fotos', produto.numeroPedido)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Fotos ({produto.fotos.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcao('Gerar Relatório', produto.numeroPedido)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Relatório
                      </Button>
                      {produto.statusEntrega !== 'entregue' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcao('Preparar Entrega', produto.numeroPedido)}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Preparar Entrega
                        </Button>
                      )}
                      {produto.statusEntrega === 'pronto_entrega' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcao('Iniciar Entrega', produto.numeroPedido)}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Iniciar Entrega
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {filteredProdutos.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum produto encontrado com os filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Finalizados;
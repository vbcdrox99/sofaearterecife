import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Phone, MapPin, Package, Calendar, DollarSign, Mail, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  clienteEndereco: string;
  numeroPedido: string;
  dataEntrega: string;
  descricao: string;
  tipoSofa: string;
  cor: string;
  dimensoes: string;
  observacoes: string;
  espuma: string;
  tecido: string;
  braco: string;
  tipoPe: string;
  valorTotal: string;
  valorPago: string;
  prioridade: string;
}

const NovoPedido = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clienteNome: '',
    clienteEmail: '',
    clienteTelefone: '',
    clienteEndereco: '',
    numeroPedido: '',
    dataEntrega: '',
    descricao: '',
    tipoSofa: '',
    cor: '',
    dimensoes: '',
    observacoes: '',
    espuma: '',
    tecido: '',
    braco: '',
    tipoPe: '',
    valorTotal: '',
    valorPago: '',
    prioridade: 'media'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gerar número do pedido automaticamente
  useEffect(() => {
    const numeroPedido = generatePedidoNumber();
    setFormData(prev => ({ ...prev, numeroPedido }));
  }, []);

  const generatePedidoNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PED${year}${month}${day}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!formData.clienteNome || !formData.clienteEmail || !formData.clienteTelefone) {
        throw new Error('Preencha todos os campos obrigatórios do cliente');
      }

      if (!formData.numeroPedido || !formData.dataEntrega || !formData.descricao) {
        throw new Error('Preencha todos os dados do pedido');
      }

      if (!formData.tipoSofa || !formData.cor || !formData.dimensoes) {
        throw new Error('Preencha o tipo, cor e dimensões do sofá');
      }

      if (!formData.espuma || !formData.tecido || !formData.braco || !formData.tipoPe) {
        throw new Error('Preencha todas as especificações do produto');
      }

      if (!formData.valorTotal) {
        throw new Error('Preencha as informações comerciais');
      }

      const valorTotal = parseFloat(formData.valorTotal);
      const valorPago = parseFloat(formData.valorPago) || 0;

      // Verificar se o usuário está autenticado
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Inserir pedido no Supabase
      const { data, error } = await supabase
        .from('pedidos')
        .insert([
          {
            numero_pedido: formData.numeroPedido,
            cliente_nome: formData.clienteNome,
            cliente_email: formData.clienteEmail,
            cliente_telefone: formData.clienteTelefone,
            cliente_endereco: formData.clienteEndereco,
            data_previsao_entrega: formData.dataEntrega,
            descricao_sofa: formData.descricao,
            tipo_sofa: formData.tipoSofa,
            cor: formData.cor,
            dimensoes: formData.dimensoes,
            observacoes: formData.observacoes,
            espuma: formData.espuma,
            tecido: formData.tecido,
            braco: formData.braco,
            tipo_pe: formData.tipoPe,
            valor_total: valorTotal,
            valor_pago: valorPago,
            prioridade: formData.prioridade,
            status: 'pendente',
            created_by: user.id
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Pedido Criado com Sucesso!",
        description: `Pedido ${formData.numeroPedido} foi cadastrado no sistema.`,
      });

      // Reset form
      setFormData({
        clienteNome: '',
        clienteEmail: '',
        clienteTelefone: '',
        clienteEndereco: '',
        numeroPedido: generatePedidoNumber(),
        dataEntrega: '',
        descricao: '',
        tipoSofa: '',
        cor: '',
        dimensoes: '',
        observacoes: '',
        espuma: '',
        tecido: '',
        braco: '',
        tipoPe: '',
        valorTotal: '',
        valorPago: '',
        prioridade: 'media'
      });

      // Redirecionar para a lista de pedidos após 2 segundos
      setTimeout(() => {
        navigate('/dashboard/pedidos');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: "Erro ao Criar Pedido",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Novo Pedido"
      description="Cadastrar novo pedido de sofá personalizado"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteNome">Nome Completo</Label>
                <Input
                  id="clienteNome"
                  value={formData.clienteNome}
                  onChange={(e) => handleInputChange('clienteNome', e.target.value)}
                  placeholder="Ex: Maria Silva Santos"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteTelefone">Telefone</Label>
                <Input
                  id="clienteTelefone"
                  value={formData.clienteTelefone}
                  onChange={(e) => handleInputChange('clienteTelefone', e.target.value)}
                  placeholder="(81) 99999-9999"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteEmail">E-mail</Label>
                <Input
                  id="clienteEmail"
                  type="email"
                  value={formData.clienteEmail}
                  onChange={(e) => handleInputChange('clienteEmail', e.target.value)}
                  placeholder="cliente@email.com"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clienteEndereco">Endereço Completo</Label>
                <Input
                  id="clienteEndereco"
                  value={formData.clienteEndereco}
                  onChange={(e) => handleInputChange('clienteEndereco', e.target.value)}
                  placeholder="Rua, número, bairro, cidade - CEP"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Dados do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroPedido">Número do Pedido</Label>
                <Input
                  id="numeroPedido"
                  value={formData.numeroPedido}
                  onChange={(e) => handleInputChange('numeroPedido', e.target.value)}
                  placeholder="Ex: PED240101001"
                  required
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="dataEntrega">Data de Entrega</Label>
                 <Input
                   id="dataEntrega"
                   type="date"
                   value={formData.dataEntrega}
                   onChange={(e) => handleInputChange('dataEntrega', e.target.value)}
                   lang="pt-BR"
                   required
                 />
               </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição detalhada do pedido"
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoSofa">Tipo de Sofá</Label>
                <Select onValueChange={(value) => handleInputChange('tipoSofa', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de sofá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2_LUGARES">2 Lugares</SelectItem>
                    <SelectItem value="3_LUGARES">3 Lugares</SelectItem>
                    <SelectItem value="CHAISE">Chaise</SelectItem>
                    <SelectItem value="CANTO">Canto</SelectItem>
                    <SelectItem value="RECLINAVEL">Reclinável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  value={formData.cor}
                  onChange={(e) => handleInputChange('cor', e.target.value)}
                  placeholder="Cor do sofá"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensoes">Dimensões</Label>
                <Input
                  id="dimensoes"
                  value={formData.dimensoes}
                  onChange={(e) => handleInputChange('dimensoes', e.target.value)}
                  placeholder="Ex: 2,10m x 0,90m x 0,85m"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre o pedido"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="espuma">Espuma</Label>
                <Select onValueChange={(value) => handleInputChange('espuma', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de espuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D33">D33</SelectItem>
                    <SelectItem value="D30">D30</SelectItem>
                    <SelectItem value="REFORCO">Reforço</SelectItem>
                    <SelectItem value="TROCA">Troca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tecido">Tecido</Label>
                <Input
                  id="tecido"
                  value={formData.tecido}
                  onChange={(e) => handleInputChange('tecido', e.target.value)}
                  placeholder="Especificação do tecido"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="braco">Braço</Label>
                <Select onValueChange={(value) => handleInputChange('braco', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de braço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PADRAO">Padrão</SelectItem>
                    <SelectItem value="BR_SLIM">BR Slim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoPe">Tipo de Pé</Label>
                <Select onValueChange={(value) => handleInputChange('tipoPe', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de pé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PADRAO">Padrão</SelectItem>
                    <SelectItem value="METALON">Metalon</SelectItem>
                    <SelectItem value="PE_GASPAR">Pé Gaspar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informações Comerciais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                <Input
                  id="valorTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorTotal}
                  onChange={(e) => handleInputChange('valorTotal', e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorPago">Valor Pago (R$)</Label>
                <Input
                  id="valorPago"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorPago}
                  onChange={(e) => handleInputChange('valorPago', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/dashboard/pedidos')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Pedido
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default NovoPedido;
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Phone, MapPin, Package, Calendar, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const NovoPedido = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteTelefone: '',
    clienteEndereco: '',
    tipoSofa: '',
    cor: '',
    tecido: '',
    dimensoes: '',
    observacoes: '',
    dataPrevisaoEntrega: '',
    valorOrcamento: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Pedido Criado!",
      description: "Pedido de demonstração criado com sucesso. (Dados fictícios)",
    });
    // Reset form
    setFormData({
      clienteNome: '',
      clienteTelefone: '',
      clienteEndereco: '',
      tipoSofa: '',
      cor: '',
      tecido: '',
      dimensoes: '',
      observacoes: '',
      dataPrevisaoEntrega: '',
      valorOrcamento: ''
    });
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

          {/* Especificações do Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Especificações do Sofá
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoSofa">Tipo de Sofá</Label>
                <Select onValueChange={(value) => handleInputChange('tipoSofa', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-lugares">Sofá 2 Lugares</SelectItem>
                    <SelectItem value="3-lugares">Sofá 3 Lugares</SelectItem>
                    <SelectItem value="4-lugares">Sofá 4 Lugares</SelectItem>
                    <SelectItem value="canto">Sofá de Canto</SelectItem>
                    <SelectItem value="chaise">Sofá com Chaise</SelectItem>
                    <SelectItem value="reclinavel">Sofá Reclinável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor Principal</Label>
                <Select onValueChange={(value) => handleInputChange('cor', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bege">Bege</SelectItem>
                    <SelectItem value="marrom">Marrom</SelectItem>
                    <SelectItem value="preto">Preto</SelectItem>
                    <SelectItem value="cinza">Cinza</SelectItem>
                    <SelectItem value="azul">Azul</SelectItem>
                    <SelectItem value="verde">Verde</SelectItem>
                    <SelectItem value="vermelho">Vermelho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tecido">Tipo de Tecido</Label>
                <Select onValueChange={(value) => handleInputChange('tecido', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tecido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="couro">Couro Natural</SelectItem>
                    <SelectItem value="couro-sintetico">Couro Sintético</SelectItem>
                    <SelectItem value="linho">Linho</SelectItem>
                    <SelectItem value="veludo">Veludo</SelectItem>
                    <SelectItem value="suede">Suede</SelectItem>
                    <SelectItem value="chenille">Chenille</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensoes">Dimensões (L x P x A)</Label>
                <Input
                  id="dimensoes"
                  value={formData.dimensoes}
                  onChange={(e) => handleInputChange('dimensoes', e.target.value)}
                  placeholder="Ex: 200cm x 90cm x 85cm"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações Especiais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Detalhes adicionais, preferências do cliente, etc."
                  rows={3}
                />
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
                <Label htmlFor="valorOrcamento">Valor do Orçamento (R$)</Label>
                <Input
                  id="valorOrcamento"
                  type="number"
                  step="0.01"
                  value={formData.valorOrcamento}
                  onChange={(e) => handleInputChange('valorOrcamento', e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPrevisaoEntrega">Previsão de Entrega</Label>
                <Input
                  id="dataPrevisaoEntrega"
                  type="date"
                  value={formData.dataPrevisaoEntrega}
                  onChange={(e) => handleInputChange('dataPrevisaoEntrega', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Pedido
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default NovoPedido;
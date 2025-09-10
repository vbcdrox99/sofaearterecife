import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Cliente } from './ClienteSelector';

interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  endereco_completo: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ClienteFormProps {
  onSuccess: (cliente: Cliente) => void;
  onCancel: () => void;
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    nome: '',
    email: '',
    telefone: '',
    endereco_completo: '',
    cep: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof ClienteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP informado',
          variant: 'destructive',
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));

      toast({
        title: 'Endereço encontrado',
        description: 'Dados preenchidos automaticamente',
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar informações do CEP',
        variant: 'destructive',
      });
    }
  };

  const handleCepChange = (value: string) => {
    const cepFormatado = value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
    handleInputChange('cep', cepFormatado);
    
    if (value.replace(/\D/g, '').length === 8) {
      buscarEnderecoPorCep(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e telefone são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            nome: formData.nome.trim(),
            email: formData.email.trim() || null,
            telefone: formData.telefone.trim(),
            endereco_completo: formData.endereco_completo.trim() || null,
            cep: formData.cep.trim() || null,
            bairro: formData.bairro.trim() || null,
            cidade: formData.cidade.trim() || null,
            estado: formData.estado.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao cadastrar cliente:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao cadastrar cliente',
          variant: 'destructive',
        });
        return;
      }

      onSuccess(data);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleInputChange('bairro', e.target.value)}
                placeholder="Digite o bairro"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="Digite a cidade"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="endereco_completo">Endereço Completo (Rua e Número)</Label>
            <Textarea
              id="endereco_completo"
              value={formData.endereco_completo}
              onChange={(e) => handleInputChange('endereco_completo', e.target.value)}
              placeholder="Rua, número, complemento..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
        </Button>
      </div>
    </form>
  );
}
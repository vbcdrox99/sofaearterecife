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
  telefone2?: string;
  cpf_cnpj?: string;
  rua: string;
  numero: string;
  complemento: string;
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
    telefone2: '',
    cpf_cnpj: '',
    rua: '',
    numero: '',
    complemento: '',
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
        rua: data.logradouro || '',
        complemento: data.complemento || prev.complemento,
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

  const handlePhoneChange = (field: 'telefone' | 'telefone2', value: string) => {
    const v = value.replace(/\D/g, '');
    let formatted = '';

    if (v.length === 0) {
      formatted = '';
    } else if (v.length <= 2) {
      formatted = `(${v}`;
    } else if (v.length <= 6) {
      formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length <= 10) {
      formatted = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else {
      formatted = `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3, 7)}-${v.slice(7, 11)}`;
    }

    handleInputChange(field, formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
            telefone2: (formData.telefone2 || '').trim() || null,
            cpf_cnpj: (formData.cpf_cnpj || '').trim() || null,
            endereco_completo: [
              formData.rua ? `${formData.rua.trim()}${formData.numero ? `, ${formData.numero.trim()}` : ''}` : '',
              formData.complemento ? formData.complemento.trim() : ''
            ].filter(Boolean).join(' | ') || null,
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
                onChange={(e) => handlePhoneChange('telefone', e.target.value)}
                placeholder="(11) 9 9999-9999"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone2">Telefone 2 (opcional)</Label>
              <Input
                id="telefone2"
                value={formData.telefone2 || ''}
                onChange={(e) => handlePhoneChange('telefone2', e.target.value)}
                placeholder="(11) 9 8888-8888"
              />
            </div>
            <div>
              <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj || ''}
                onChange={(e) => handleInputChange('cpf_cnpj', e.target.value)}
                placeholder="Digite o CPF ou CNPJ"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rua">Rua</Label>
              <Input
                id="rua"
                value={formData.rua}
                onChange={(e) => handleInputChange('rua', e.target.value)}
                placeholder="Ex: Rua das Flores"
              />
            </div>
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Ex: 123"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              value={formData.complemento}
              onChange={(e) => handleInputChange('complemento', e.target.value)}
              placeholder="Ex: Apto 101, Bloco B"
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
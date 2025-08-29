import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Material {
  id: string;
  nome: string;
  descricao?: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade_medida: string;
  preco_unitario: number;
  created_at: string;
  updated_at: string;
}

export interface NovoMaterialData {
  nome: string;
  descricao?: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade_medida: string;
  preco_unitario: number;
}

export const useMateriais = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMateriais = async () => {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('nome');

      if (error) throw error;
      setMateriais(data || []);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os materiais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const criarMaterial = async (dadosMaterial: NovoMaterialData) => {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .insert([dadosMaterial])
        .select()
        .single();

      if (error) throw error;

      setMateriais(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      
      toast({
        title: 'Sucesso!',
        description: 'Material cadastrado com sucesso',
      });

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar material:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o material',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const atualizarMaterial = async (materialId: string, dadosAtualizados: Partial<NovoMaterialData>) => {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .update(dadosAtualizados)
        .eq('id', materialId)
        .select()
        .single();

      if (error) throw error;

      setMateriais(prev => 
        prev.map(material => 
          material.id === materialId 
            ? { ...material, ...dadosAtualizados }
            : material
        )
      );

      toast({
        title: 'Material atualizado',
        description: `${data.nome} foi atualizado com sucesso`,
      });

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar material:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o material',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deletarMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('materiais')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMateriais(prev => prev.filter(material => material.id !== materialId));
      
      toast({
        title: 'Material removido',
        description: 'Material foi removido com sucesso',
      });

      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar material:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o material',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const getMaterialBaixoEstoque = () => {
    return materiais.filter(material => material.quantidade_atual <= material.quantidade_minima);
  };

  const getValorTotalEstoque = () => {
    return materiais.reduce((total, material) => {
      return total + (material.quantidade_atual * material.preco_unitario);
    }, 0);
  };

  useEffect(() => {
    fetchMateriais();
  }, []);

  return {
    materiais,
    loading,
    criarMaterial,
    atualizarMaterial,
    deletarMaterial,
    getMaterialBaixoEstoque,
    getValorTotalEstoque,
    refetch: fetchMateriais,
  };
};
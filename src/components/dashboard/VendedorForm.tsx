import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export interface Vendedor {
    id: string;
    nome: string;
}

interface VendedorFormProps {
    onSuccess: (vendedor: Vendedor) => void;
    onCancel: () => void;
}

export function VendedorForm({ onSuccess, onCancel }: VendedorFormProps) {
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!nome.trim()) {
            toast({
                title: 'Erro de validação',
                description: 'O nome do vendedor é obrigatório.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vendedores')
                .insert([{ nome }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                onSuccess(data);
            }
        } catch (error) {
            console.error('Erro ao cadastrar vendedor:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível cadastrar o vendedor.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} onKeyDown={(e) => e.stopPropagation()} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nome">Nome do Vendedor</Label>
                <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Silva"
                    autoFocus
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Vendedor
                </Button>
            </div>
        </form>
    );
}

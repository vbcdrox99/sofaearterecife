import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { VendedorForm, Vendedor } from './VendedorForm';
export type { Vendedor } from './VendedorForm';

interface VendedorSelectorProps {
    onVendedorSelect: (vendedor: Vendedor | null) => void;
    selectedVendedor?: Vendedor | null;
}

export function VendedorSelector({ onVendedorSelect, selectedVendedor }: VendedorSelectorProps) {
    const [open, setOpen] = useState(false);
    const [showNewVendedorDialog, setShowNewVendedorDialog] = useState(false);
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [vendedorToDelete, setVendedorToDelete] = useState<Vendedor | null>(null);

    // Buscar vendedores do banco de dados
    const fetchVendedores = async (search?: string) => {
        setLoading(true);
        try {
            let query = supabase
                .from('vendedores')
                .select('*')
                .order('nome');

            if (search && search.length > 0) {
                query = query.ilike('nome', `%${search}%`);
            }

            const { data, error } = await query.limit(50);

            if (error) {
                console.error('Erro ao buscar vendedores:', error);
                toast({
                    title: 'Erro',
                    description: 'Erro ao buscar vendedores',
                    variant: 'destructive',
                });
                return;
            }

            setVendedores(data || []);
        } catch (error) {
            console.error('Erro ao buscar vendedores:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao buscar vendedores',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Buscar vendedores quando o componente monta
    useEffect(() => {
        fetchVendedores();
    }, []);

    // Buscar vendedores quando o valor de busca muda
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchValue.length >= 2 || searchValue.length === 0) {
                fetchVendedores(searchValue);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue]);

    const handleVendedorSelect = (vendedor: Vendedor) => {
        onVendedorSelect(vendedor);
        setOpen(false);
    };

    const handleNewVendedor = (novoVendedor: Vendedor) => {
        setVendedores(prev => [novoVendedor, ...prev]);
        onVendedorSelect(novoVendedor);
        setShowNewVendedorDialog(false);
        toast({
            title: 'Sucesso',
            description: 'Vendedor cadastrado com sucesso!',
        });
    };

    const handleDeleteVendedor = async (vendedor: Vendedor) => {
        try {
            const { error } = await supabase
                .from('vendedores')
                .delete()
                .eq('id', vendedor.id);

            if (error) throw error;

            setVendedores(prev => prev.filter(v => v.id !== vendedor.id));
            if (selectedVendedor?.id === vendedor.id) {
                onVendedorSelect(null);
            }
            toast({
                title: 'Sucesso',
                description: 'Vendedor excluído com sucesso.',
            });
        } catch (error) {
            console.error('Erro ao excluir vendedor:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir o vendedor.',
                variant: 'destructive',
            });
        } finally {
            setVendedorToDelete(null);
        }
    };

    const handleClearSelection = () => {
        onVendedorSelect(null);
    };

    return (
        <>
            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="flex-1 justify-between"
                        >
                            {selectedVendedor ? (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="truncate">
                                        {selectedVendedor.nome}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>Buscar vendedor...</span>
                                </div>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput
                                placeholder="Buscar vendedor..."
                                value={searchValue}
                                onValueChange={setSearchValue}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {loading ? 'Buscando...' : 'Nenhum vendedor encontrado.'}
                                </CommandEmpty>
                                <CommandGroup>
                                    {vendedores.map((vendedor) => (
                                        <CommandItem
                                            key={vendedor.id}
                                            value={vendedor.nome}
                                            onSelect={() => handleVendedorSelect(vendedor)}
                                            className="flex items-center gap-2"
                                        >
                                            <Check
                                                className={`h-4 w-4 ${selectedVendedor?.id === vendedor.id ? 'opacity-100' : 'opacity-0'
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{vendedor.nome}</div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setVendedorToDelete(vendedor);
                                                }}
                                                title="Excluir vendedor"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewVendedorDialog(true)}
                    title="Cadastrar novo vendedor"
                >
                    <Plus className="h-4 w-4" />
                </Button>

                {selectedVendedor && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearSelection}
                        title="Limpar seleção"
                    >
                        Limpar
                    </Button>
                )}
            </div>

            <Dialog open={showNewVendedorDialog} onOpenChange={setShowNewVendedorDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cadastrar Novo Vendedor</DialogTitle>
                    </DialogHeader>
                    <VendedorForm
                        onSuccess={handleNewVendedor}
                        onCancel={() => setShowNewVendedorDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!vendedorToDelete} onOpenChange={(open) => !open && setVendedorToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Vendedor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o vendedor "{vendedorToDelete?.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => vendedorToDelete && handleDeleteVendedor(vendedorToDelete)}>
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { ClienteForm } from './ClienteForm';

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  telefone2?: string;
  cpf_cnpj?: string;
  endereco_completo?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

interface ClienteSelectorProps {
  onClienteSelect: (cliente: Cliente | null) => void;
  selectedCliente?: Cliente | null;
}

export function ClienteSelector({ onClienteSelect, selectedCliente }: ClienteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showNewClienteDialog, setShowNewClienteDialog] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Buscar clientes do banco de dados
  const fetchClientes = async (search?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (search && search.length > 0) {
        query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao buscar clientes',
          variant: 'destructive',
        });
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes quando o componente monta
  useEffect(() => {
    fetchClientes();
  }, []);

  // Buscar clientes quando o valor de busca muda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue.length >= 2 || searchValue.length === 0) {
        fetchClientes(searchValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleClienteSelect = (cliente: Cliente) => {
    onClienteSelect(cliente);
    setOpen(false);
  };

  const handleNewCliente = (novoCliente: Cliente) => {
    setClientes(prev => [novoCliente, ...prev]);
    onClienteSelect(novoCliente);
    setShowNewClienteDialog(false);
    toast({
      title: 'Sucesso',
      description: 'Cliente cadastrado com sucesso!',
    });
  };

  const handleClearSelection = () => {
    onClienteSelect(null);
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
              {selectedCliente ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">
                    {selectedCliente.nome}{selectedCliente.email && ` - ${selectedCliente.email}`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Buscar cliente existente...</span>
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput
                placeholder="Buscar por nome, telefone ou email..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  {loading ? 'Buscando...' : 'Nenhum cliente encontrado.'}
                </CommandEmpty>
                <CommandGroup>
                  {clientes.map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      value={cliente.id}
                      onSelect={() => handleClienteSelect(cliente)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={`h-4 w-4 ${
                          selectedCliente?.id === cliente.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {cliente.telefone}
                          {cliente.email && ` • ${cliente.email}`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNewClienteDialog(true)}
          title="Cadastrar novo cliente"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {selectedCliente && (
          <Button
            variant="outline"
            onClick={handleClearSelection}
            title="Limpar seleção"
          >
            Limpar
          </Button>
        )}
      </div>

      <Dialog open={showNewClienteDialog} onOpenChange={setShowNewClienteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            onSuccess={handleNewCliente}
            onCancel={() => setShowNewClienteDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
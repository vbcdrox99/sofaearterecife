import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  /** Valor atualmente selecionado */
  value: string;
  /** Callback quando o valor muda */
  onValueChange: (value: string) => void;
  /** Opções disponíveis */
  options: string[];
  /** Placeholder quando nenhuma opção selecionada */
  placeholder?: string;
  /** Label do modal para adicionar nova opção */
  addLabel?: string;
  /** Placeholder do input do modal de nova opção */
  addPlaceholder?: string;
  /** Callback para adicionar nova opção */
  onAddOption?: (value: string) => void;
  /** Callback para excluir uma opção */
  onDeleteOption?: (value: string) => void;
  /** Desabilita o componente */
  disabled?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Selecione uma opção',
  addLabel = 'Adicionar',
  addPlaceholder = 'Digite para adicionar',
  onAddOption,
  onDeleteOption,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const handleAddOption = () => {
    const trimmed = newOptionValue.trim();
    if (!trimmed) return;
    onAddOption?.(trimmed);
    setNewOptionValue('');
    setModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteCandidate) {
      onDeleteOption?.(deleteCandidate);
      setDeleteCandidate(null);
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex-1 justify-between font-normal h-10',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." className="h-9" />
            <CommandList>
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(selected) => {
                      onValueChange(selected === value ? '' : selected);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between group pr-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          value === option ? 'opacity-100 text-primary' : 'opacity-0'
                        )}
                      />
                      <span>{option}</span>
                    </div>
                    {onDeleteOption && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCandidate(option);
                          setOpen(false);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Botão para adicionar nova opção */}
      {onAddOption && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10"
              disabled={disabled}
              title={addLabel}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{addLabel}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-option-input">Nome</Label>
                <Input
                  id="new-option-input"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  placeholder={addPlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false);
                    setNewOptionValue('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!newOptionValue.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong>"{deleteCandidate}"</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteCandidate(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

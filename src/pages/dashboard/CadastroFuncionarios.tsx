import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Pencil, Store, Shield } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const AVAILABLE_STORES = [
  { id: "loja_1", name: "Aragão" },
  { id: "loja_2", name: "Boa Viagem" },
  { id: "loja_3", name: "Tamarineira" },
];

const STORE_NAMES: Record<string, string> = {
  loja_1: "Aragão",
  loja_2: "Boa Viagem",
  loja_3: "Tamarineira",
};

interface EditEmployeeState {
  id: string;
  user_id: string;
  nome_completo: string;
  email: string;
  role: string;
  stores: string[];
}

export default function CadastroFuncionarios() {
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EditEmployeeState | null>(null);

  const { toast } = useToast();
  const { session, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    password: "",
    role: "funcionario",
    stores: ["loja_1"],
  });

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .in('role', ['funcionario', 'gerente'])
        .order('nome_completo');

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke('delete-employee', {
        body: { user_id: userId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro desconhecido ao remover usuário");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Sucesso!",
        description: "Funcionário removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Remover",
        description: error.message || "Não foi possível remover o funcionário.",
        variant: "destructive",
      });
    }
  });

  // Guardião estrito: apenas Administrador tem acesso à tela
  if (authLoading) {
    return (
      <DashboardLayout title="Cadastro de Funcionários">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData(prev => {
      const exists = prev.stores.includes(storeId);
      const updated = exists
        ? prev.stores.filter(s => s !== storeId)
        : [...prev.stores, storeId];
      return { ...prev, stores: updated };
    });
  };

  const handleSelectAllStores = () => {
    if (formData.stores.length === AVAILABLE_STORES.length) {
      setFormData(prev => ({ ...prev, stores: [] }));
    } else {
      setFormData(prev => ({ ...prev, stores: AVAILABLE_STORES.map(s => s.id) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.email || !formData.password) {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.stores.length === 0) {
      toast({
        title: "Validação de Lojas",
        description: "Selecione ao menos uma loja atribuída para o colaborador.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('create-employee', {
        body: {
          nome_completo: formData.nome_completo,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          stores: formData.stores,
          store: formData.stores[0] || 'loja_1',
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro desconhecido ao criar usuário");
      }

      const lojasTexto = formData.stores.length === 3
        ? "Todas as Lojas"
        : formData.stores.map(s => STORE_NAMES[s] || s).join(" e ");

      toast({
        title: "Sucesso!",
        description: `O colaborador ${formData.nome_completo} foi cadastrado com sucesso (${lojasTexto}).`,
      });

      // Clear the form
      setFormData({
        nome_completo: "",
        email: "",
        password: "",
        role: "funcionario",
        stores: ["loja_1"],
      });

      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao Cadastrar",
        description: error.message || "Não foi possível cadastrar o funcionário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (employee: any) => {
    const assignedStores: string[] = (employee.stores && employee.stores.length > 0)
      ? employee.stores
      : (employee.store === 'todas' ? ['loja_1', 'loja_2', 'loja_3'] : employee.store ? [employee.store] : ['loja_1']);

    setEditingEmployee({
      id: employee.id,
      user_id: employee.user_id,
      nome_completo: employee.nome_completo || '',
      email: employee.email || '',
      role: employee.role || 'funcionario',
      stores: assignedStores,
    });
  };

  const handleEditStoreToggle = (storeId: string) => {
    if (!editingEmployee) return;
    const exists = editingEmployee.stores.includes(storeId);
    const updated = exists
      ? editingEmployee.stores.filter(s => s !== storeId)
      : [...editingEmployee.stores, storeId];
    setEditingEmployee({ ...editingEmployee, stores: updated });
  };

  const handleEditSelectAll = () => {
    if (!editingEmployee) return;
    if (editingEmployee.stores.length === AVAILABLE_STORES.length) {
      setEditingEmployee({ ...editingEmployee, stores: [] });
    } else {
      setEditingEmployee({ ...editingEmployee, stores: AVAILABLE_STORES.map(s => s.id) });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    if (editingEmployee.stores.length === 0) {
      toast({
        title: "Validação",
        description: "Selecione pelo menos uma loja atribuída.",
        variant: "destructive",
      });
      return;
    }

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('profiles' as any)
        .update({
          role: editingEmployee.role,
          tipo: editingEmployee.role === 'gerente' ? 'gerente' : 'funcionario',
          stores: editingEmployee.stores,
          store: editingEmployee.stores[0] || 'loja_1',
        } as any)
        .eq('user_id', editingEmployee.user_id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Sucesso!",
        description: `Cadastro de ${editingEmployee.nome_completo} atualizado com sucesso.`,
      });
      setEditingEmployee(null);
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar",
        description: err.message || "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const renderStoreBadges = (employee: any) => {
    const stores: string[] = (employee.stores && employee.stores.length > 0)
      ? employee.stores
      : (employee.store ? [employee.store] : []);

    if (stores.length === 0) {
      return <span className="text-muted-foreground text-xs">Nenhuma</span>;
    }

    if (stores.includes('todas') || stores.length === 3) {
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
          Todas as Lojas
        </Badge>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {stores.map(s => (
          <Badge key={s} variant="outline" className="text-xs">
            {STORE_NAMES[s] || s}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout title="Cadastro de Funcionários">
      <div className="container mx-auto max-w-5xl py-8 space-y-8">
        
        {/* Formulário de Criação */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Cadastro de Novos Colaboradores</CardTitle>
            </div>
            <CardDescription>
              Crie contas para novos Gerentes ou Funcionários e defina exatamente a quais lojas cada um terá acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  <Input
                    id="nome_completo"
                    placeholder="Ex: Maria Pereira"
                    value={formData.nome_completo}
                    onChange={(e) => handleFieldChange("nome_completo", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de Acesso</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="maria@sofaearte.com.br"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo de 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função (Nível de Acesso)</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleFieldChange("role", value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seleção de Múltiplas Lojas */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-primary" />
                    Lojas Atribuídas
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllStores}
                    className="h-7 text-xs"
                  >
                    {formData.stores.length === AVAILABLE_STORES.length ? "Desmarcar Todas" : "Marcar Todas as Lojas"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AVAILABLE_STORES.map((store) => {
                    const isChecked = formData.stores.includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className={cn(
                          "flex items-center space-x-3 p-3.5 rounded-lg border cursor-pointer transition-all select-none",
                          isChecked
                            ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleStoreToggle(store.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">{store.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Você pode selecionar uma única loja, duas lojas específicas (ex: Aragão + Boa Viagem) ou todas. O colaborador só verá dados das lojas selecionadas.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando Colaborador...
                  </>
                ) : (
                  "Cadastrar Colaborador"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Colaboradores */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Colaboradores Cadastrados</CardTitle>
            <CardDescription>
              Visualize, edite as lojas atribuídas ou remova o acesso de gerentes e funcionários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : employees && employees.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Lojas Atribuídas</TableHead>
                      <TableHead className="w-[110px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.nome_completo}</TableCell>
                        <TableCell className="text-muted-foreground">{employee.email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={employee.role === 'gerente' ? 'default' : 'secondary'} className="capitalize">
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderStoreBadges(employee)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Botão de Edição */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(employee)}
                              title="Editar lojas e permissões"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            {/* Botão de Exclusão */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Remover acesso"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá permanentemente a conta e o acesso de <strong>{employee.nome_completo}</strong> ao sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteMutation.mutate(employee.user_id)}
                                  >
                                    Sim, remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Nenhum colaborador cadastrado no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição de Colaborador */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Lojas e Permissões</DialogTitle>
            <DialogDescription>
              Ajuste a função e as lojas com acesso permitido para este colaborador.
            </DialogDescription>
          </DialogHeader>

          {editingEmployee && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Colaborador</Label>
                <p className="font-semibold text-base">{editingEmployee.nome_completo}</p>
                <p className="text-xs text-muted-foreground">{editingEmployee.email || 'Sem email cadastrado'}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Função</Label>
                <Select
                  value={editingEmployee.role}
                  onValueChange={(val) => setEditingEmployee({ ...editingEmployee, role: val })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Lojas Atribuídas</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEditSelectAll}
                    className="h-7 text-xs"
                  >
                    {editingEmployee.stores.length === AVAILABLE_STORES.length ? "Desmarcar Todas" : "Marcar Todas as Lojas"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_STORES.map((store) => {
                    const isChecked = editingEmployee.stores.includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all select-none",
                          isChecked
                            ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleEditStoreToggle(store.id)}
                        />
                        <span className="text-sm font-medium">{store.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEmployee(null)}
              disabled={savingEdit}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

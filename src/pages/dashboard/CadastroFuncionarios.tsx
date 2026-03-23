import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CadastroFuncionarios() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        nome_completo: "",
        email: "",
        password: "",
        role: "funcionario",
        store: "loja_1",
    });

    const { data: employees, isLoading: loadingEmployees } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['funcionario', 'gerente'])
                .order('nome_completo');

            if (error) throw error;
            return data;
        }
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

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

        setLoading(true);
        try {
            const response = await supabase.functions.invoke('create-employee', {
                body: formData,
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                }
            });

            if (response.error) {
                throw new Error(response.error.message || "Erro desconhecido ao criar usuário");
            }

            toast({
                title: "Sucesso!",
                description: `O funcionário ${formData.nome_completo} foi cadastrado com sucesso na ${formData.store.replace('_', ' ')}.`,
            });

            // Clear the form
            setFormData({
                nome_completo: "",
                email: "",
                password: "",
                role: "funcionario",
                store: "loja_1",
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

    return (
        <DashboardLayout title="Cadastro de Funcionários">
            <div className="container mx-auto max-w-4xl py-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Cadastro de Funcionários</CardTitle>
                        <CardDescription>
                            Crie contas para novos Gerentes ou Funcionários, designando a loja em que atuarão.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="nome_completo">Nome Completo</Label>
                                <Input
                                    id="nome_completo"
                                    placeholder="Ex: João da Silva"
                                    value={formData.nome_completo}
                                    onChange={(e) => handleChange("nome_completo", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email de Acesso</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="joao@sofaearte.com.br"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha Temporária</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo de 6 caracteres"
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Nível de Acesso (Função)</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => handleChange("role", value)}
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

                                <div className="space-y-2">
                                    <Label htmlFor="store">Loja Atribuída</Label>
                                    <Select
                                        value={formData.store}
                                        onValueChange={(value) => handleChange("store", value)}
                                    >
                                        <SelectTrigger id="store">
                                            <SelectValue placeholder="Selecione a loja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="loja_1">Aragão</SelectItem>
                                            <SelectItem value="loja_2">Boa Viagem</SelectItem>
                                            <SelectItem value="todas">Ambas as Lojas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cadastrando...
                                    </>
                                ) : (
                                    "Cadastrar Funcionário"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Funcionários e Gerentes Cadastrados</CardTitle>
                        <CardDescription>
                            Lista de todos os funcionários e gerentes do sistema. Você pode remover o acesso deles por aqui.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingEmployees ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : employees && employees.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Função</TableHead>
                                            <TableHead>Loja</TableHead>
                                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.map((employee) => (
                                            <TableRow key={employee.id}>
                                                <TableCell className="font-medium">{employee.nome_completo}</TableCell>
                                                <TableCell>{employee.email || '—'}</TableCell>
                                                <TableCell className="capitalize">{employee.role}</TableCell>
                                                <TableCell className="capitalize">
                                                    {employee.store === 'todas' ? 'Ambas as Lojas' : employee.store.replace('_', ' ')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação não pode ser desfeita. Isso removerá permanentemente o acesso do funcionário {employee.nome_completo} ao sistema.
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
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center p-4 text-muted-foreground">
                                Nenhum funcionário ou gerente cadastrado no momento.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

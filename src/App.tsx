import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import NovoPedido from "./pages/dashboard/NovoPedido";
import Pedidos from "./pages/dashboard/Pedidos";
import Producao from "./pages/dashboard/Producao";
import Finalizados from "./pages/dashboard/Finalizados";
import Entrega from "./pages/dashboard/Entrega";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/novo-pedido" element={
                  <ProtectedRoute>
                    <NovoPedido />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/editar-pedido/:id" element={
                  <ProtectedRoute>
                    <NovoPedido />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/pedidos" element={
                  <ProtectedRoute>
                    <Pedidos />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/producao" element={
                  <ProtectedRoute>
                    <Producao />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/finalizados" element={
                  <ProtectedRoute>
                    <Finalizados />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/entrega" element={
                  <ProtectedRoute>
                    <Entrega />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

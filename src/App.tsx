import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { PermissionRoute, ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalogo from './pages/Catalogo';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Home from './pages/Home';
import { Negocios, Atividades, AnalisePedidos, Consultas } from './pages/Placeholders';
import AnaliseCredito from './pages/AnaliseCredito';
import Administracao from './pages/Administracao';
import RedefinirSenha from './pages/RedefinirSenha';
import Registros from './pages/Registros';
import CaixaRapido from './pages/CaixaRapido';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<PermissionRoute permission="home.visualizar"><Home /></PermissionRoute>} />
            <Route path="/dashboard" element={<PermissionRoute permission="dashboard.visualizar"><Dashboard /></PermissionRoute>} />
            <Route path="/analise-credito" element={<PermissionRoute permission="analise_credito.visualizar"><AnaliseCredito /></PermissionRoute>} />
            <Route path="/negocios" element={<PermissionRoute permission="negocios.visualizar"><Negocios /></PermissionRoute>} />
            <Route path="/atividades" element={<PermissionRoute permission="atividades.visualizar"><Atividades /></PermissionRoute>} />
            <Route path="/catalogo" element={<PermissionRoute permission="catalogo.visualizar"><Catalogo /></PermissionRoute>} />
            <Route path="/clientes" element={<PermissionRoute permission="clientes.visualizar"><Clientes /></PermissionRoute>} />
            <Route path="/vendas" element={<PermissionRoute permission="vendas.visualizar"><Vendas /></PermissionRoute>} />
            <Route path="/caixa" element={<PermissionRoute permission="vendas.criar"><CaixaRapido /></PermissionRoute>} />
            <Route path="/analise-pedidos" element={<PermissionRoute permission="analise_pedidos.visualizar"><AnalisePedidos /></PermissionRoute>} />
            <Route path="/consultas" element={<PermissionRoute permission="consultas.visualizar"><Consultas /></PermissionRoute>} />
            <Route path="/registros" element={<PermissionRoute permission="registros.visualizar"><Registros /></PermissionRoute>} />
            <Route path="/administracao" element={<PermissionRoute permission="administracao.visualizar"><Administracao /></PermissionRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

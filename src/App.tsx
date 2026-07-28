import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalogo from './pages/Catalogo';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Home from './pages/Home';
import { Negocios, Atividades, AnalisePedidos, Consultas, Registros, Administracao } from './pages/Placeholders';
import AnaliseCredito from './pages/AnaliseCredito';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analise-credito" element={<AnaliseCredito />} />
            <Route path="/negocios" element={<Negocios />} />
            <Route path="/atividades" element={<Atividades />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/analise-pedidos" element={<AnalisePedidos />} />
            <Route path="/consultas" element={<Consultas />} />
            <Route path="/registros" element={<Registros />} />
            <Route path="/administracao" element={<Administracao />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

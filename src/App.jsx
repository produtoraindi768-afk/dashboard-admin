import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StreamerRegistration from './pages/StreamerRegistration';
import TeamRegistration from './pages/TeamRegistration';

import TournamentRegistration from './pages/TournamentRegistration';
import StatusManagement from './pages/StatusManagement';
import ApiPreview from './pages/ApiPreview';
import FirebaseTest from './pages/FirebaseTest';
import './App.css';

// Componente de página não encontrada
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <h1 className="text-4xl font-bold text-muted-foreground mb-4">404</h1>
    <p className="text-lg text-muted-foreground mb-4">Página não encontrada</p>
    <Button onClick={() => window.location.href = '/'}>
      Voltar ao Dashboard
    </Button>
  </div>
);

// Componente de página em construção
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground mb-4">Esta funcionalidade está em desenvolvimento</p>
    <p className="text-sm text-muted-foreground">
      Em breve você poderá acessar esta seção do dashboard
    </p>
  </div>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <FirebaseProvider>
      <Router>
        <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={toggleSidebar}
          />

          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Mobile */}
            <header className="lg:hidden border-b bg-background p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                    <img src="/logo sz.svg" alt="SAFEzone Logo" className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">SAFEzone</span>
                </div>
              </div>
            </header>

            {/* Área de Conteúdo */}
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-6 max-w-7xl">
                <Routes>
                  {/* Página Principal */}
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* Cadastro de Streamers */}
                  <Route path="/cadastro" element={<StreamerRegistration />} />
                  
                  {/* Cadastro de Times */}
                  <Route path="/times" element={<TeamRegistration />} />
                  
                  {/* Gerenciamento de Times */}
    
                  
                  {/* Cadastro de Torneios */}
                  <Route path="/torneios" element={<TournamentRegistration />} />
                  
                  {/* Gerenciamento de Status */}
                  <Route path="/status" element={<StatusManagement />} />
                  
                  {/* API Preview */}
                  <Route path="/api" element={<ApiPreview />} />
                  
                  {/* Páginas em desenvolvimento */}
                  <Route 
                    path="/estatisticas" 
                    element={<ComingSoon title="Estatísticas Detalhadas" />} 
                  />
                  <Route 
                    path="/configuracoes" 
                    element={<FirebaseTest />} 
                  />
                  <Route 
                    path="/ajuda" 
                    element={<ComingSoon title="Ajuda e Documentação" />} 
                  />
                  
                  {/* Página 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-background p-4">
              <div className="container mx-auto max-w-7xl">
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <p>&copy; 2024 SAFEzone Dashboard</p>
                    <span className="hidden sm:inline">•</span>
                    <p className="hidden sm:inline">Gerenciamento de Streamers</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span>Versão 1.0.0</span>
                    <span>•</span>
                    <a 
                      href="/api" 
                      className="hover:text-foreground transition-colors"
                    >
                      API REST
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
        </div>
      </Router>
    </FirebaseProvider>
  );
}

export default App;


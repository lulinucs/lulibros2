
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NovaVenda from './pages/NovaVenda';
import ConsultarProdutos from './pages/ConsultarProdutos';
import Vendas from './pages/Vendas';
import Produtos from './pages/Produtos';
import Financeiro from './pages/Financeiro';
import Clientes from './pages/Clientes';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

interface DashboardPageProps {
  onLogout: () => void;
}

type ActiveView = 'NovaVenda' | 'ConsultarProdutos' | 'Vendas' | 'Produtos' | 'Financeiro' | 'Clientes' | 'Relatorios' | 'Configuracoes';

const componentMap: Record<ActiveView, React.ComponentType> = {
  NovaVenda,
  ConsultarProdutos,
  Vendas,
  Produtos,
  Financeiro,
  Clientes,
  Relatorios,
  Configuracoes,
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<ActiveView>('NovaVenda');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'F2') {
      event.preventDefault();
      setActiveView('NovaVenda');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const ActiveComponent = componentMap[activeView];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex flex-col flex-1">
        <Header onLogout={onLogout} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white p-8 rounded-lg shadow-md min-h-full">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

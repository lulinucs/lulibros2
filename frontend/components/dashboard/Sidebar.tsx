
import React from 'react';
import { BookOpenIcon, ShoppingCartIcon, TagIcon, DollarSignIcon, ChartBarIcon, ConsultIcon, LogoutIcon, UserIcon, CogIcon } from '../icons/Icons';
import logoImage from '../../logo.png';

type ActiveView = 'NovaVenda' | 'ConsultarProdutos' | 'Vendas' | 'Produtos' | 'Financeiro' | 'Clientes' | 'Relatorios' | 'Configuracoes';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen }) => {
  
  const mainMenuItems = [
    { id: 'NovaVenda', label: 'Nova Venda (F2)', icon: ShoppingCartIcon },
    { id: 'ConsultarProdutos', label: 'Consultar Produtos', icon: ConsultIcon },
  ];

  const adminMenuItems = [
    { id: 'Vendas', label: 'Vendas', icon: ChartBarIcon },
    { id: 'Produtos', label: 'Produtos', icon: TagIcon },
    { id: 'Financeiro', label: 'Financeiro', icon: DollarSignIcon },
    { id: 'Clientes', label: 'Clientes', icon: UserIcon },
    { id: 'Relatorios', label: 'Relatórios', icon: ChartBarIcon },
    { id: 'Configuracoes', label: 'Configurações', icon: CogIcon },
  ];

  const baseItemClass = "flex items-center w-full px-4 py-3 text-sm font-medium text-gray-200 transition-colors duration-200 rounded-lg";
  const activeItemClass = "bg-primary text-white shadow-lg";
  const inactiveItemClass = "hover:bg-gray-700 hover:text-white";

  return (
    <div className={`flex flex-col bg-secondary text-gray-100 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center justify-center h-32 border-b border-gray-800 ${isOpen ? 'px-4' : ''}`}>
        <img 
          src={logoImage} 
          alt="Lulibros 2.0" 
          className={`object-contain ${isOpen ? 'w-32 h-32' : 'w-12 h-12'}`}
        />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-4">
        <div>
          {isOpen && <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Principais</h3>}
          {mainMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ActiveView)}
              className={`${baseItemClass} ${activeView === item.id ? activeItemClass : inactiveItemClass}`}
            >
              <item.icon className="w-6 h-6"/>
              {isOpen && <span className="ml-4">{item.label}</span>}
            </button>
          ))}
        </div>
        <div>
           {isOpen && <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Administrativo</h3>}
          {adminMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ActiveView)}
              className={`${baseItemClass} ${activeView === item.id ? activeItemClass : inactiveItemClass}`}
            >
              <item.icon className="w-6 h-6"/>
              {isOpen && <span className="ml-4">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;

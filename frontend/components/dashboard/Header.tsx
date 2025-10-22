
import React from 'react';
import { LogoutIcon, MenuIcon } from '../icons/Icons';
import { getAdmin } from '../../utils/auth';

interface HeaderProps {
  onLogout: () => void;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, toggleSidebar }) => {
  const admin = getAdmin();
  const username = admin?.usuario || 'Usuário';

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={toggleSidebar} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary">
            <MenuIcon className="w-6 h-6"/>
        </button>
      <div className="flex items-center">
        <span className="mr-4 font-medium text-gray-600">Usuário: {username}</span>
        <button 
          onClick={onLogout}
          className="flex items-center px-4 py-2 text-sm font-medium text-red-600 transition-colors bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <LogoutIcon className="w-5 h-5 mr-2"/>
          Sair
        </button>
      </div>
    </header>
  );
};

export default Header;

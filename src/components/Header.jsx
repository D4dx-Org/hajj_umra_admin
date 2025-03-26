import React from 'react';
import { Kanban as Kaaba, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-2">
            <Kaaba className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-600">Al-Safar</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors">Home</a>
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors">Packages</a>
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors">Services</a>
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors">About</a>
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors">Contact</a>
          </nav>

          <button 
            onClick={() => navigate('/admin-login')}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserCog className="h-5 w-5" />
            <span>Admin Login</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, CreditCard, BarChart2, Calendar, Award, Briefcase, ScrollText, NotebookPen, Ambulance, BrickWall, TentTree, Hospital, HandHelping, BriefcaseMedical, Building, MapPin, Bell, GitBranch, Bus, Flag } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const menuItems = [
    // { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { id: 'ambulance', label: 'Ambulance', icon: <Ambulance size={20} />, path: '/ambulance' },
    { id: 'building', label: 'Building', icon: <BrickWall size={20} />, path: '/building' },
    { id: 'branch', label: 'Branch', icon: <GitBranch size={20} />, path: '/branch' },
    { id: 'bus-station', label: 'Bus Station', icon: <Bus size={20} />, path: '/bus-station' },
    { id: 'camp', label: 'Camp', icon: <TentTree size={20} />, path: '/camp' },
    { id: 'clinic', label: 'Clinic', icon: <BriefcaseMedical size={20} />, path: '/clinic' },
    { id: 'countries', label: 'Countries', icon: <Flag size={20} />, path: '/countries' },
    { id: 'hospital', label: 'Hospital', icon: <Hospital size={20} />, path: '/hospital' },
    { id: 'location', label: 'Location', icon: <MapPin size={20} />, path: '/location' },
    { id: 'nusuk', label: 'Nusuk', icon: <Building size={20} />, path: '/nusuk' },
    { id: 'thanima', label: 'Thanima', icon: <HandHelping size={20} />, path: '/thanima' },
    { id: 'notification', label: 'Notifications', icon: <Bell size={20} />, path: '/notification' },
  ];

  return (
    <aside 
      className={`fixed bg-[#002147] text-white h-screen z-10 transition-all duration-300 top-14 
        ${isOpen ? 'w-64' : 'w-0 md:w-16'}`}
    >
      <div className="h-16 flex items-center justify-center border-b border-blue-900">
        {isOpen ? (
          <h2 className="text-xl font-bold">Admin Panel</h2>
        ) : (
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#002147] font-bold">A</span>
          </div>
        )}
      </div>
      
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-md
                  ${location.pathname === item.path
                    ? 'bg-[#4A90E2] text-white' 
                    : 'text-gray-300 hover:bg-blue-900'
                  }`}
              >
                <span>{item.icon}</span>
                {isOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
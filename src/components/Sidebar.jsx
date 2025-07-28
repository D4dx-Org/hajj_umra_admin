import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Ambulance, BrickWall, TentTree, Hospital, HandHelping,
  BriefcaseMedical, Building, MapPin, Bell, GitBranch, Bus, Flag, PhoneCall,
  Newspaper, Navigation, Calendar, PlaneLanding, BookOpen,
  Video, PlaneTakeoff
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('hajj');

  // Automatically set the correct tab based on current route
  useEffect(() => {
    const ksaRoutes = ['/locationKSA', '/placeKSA'];
    const umrahRoutes = [
      '/umrah-preparation',
      '/umrah-arrived',
      '/umrah-duas',
      '/umrah-virtual-tour',
      '/umrah-post',
    ];

    if (ksaRoutes.includes(location.pathname)) {
      setActiveTab('explore-ksa');
    } else if (umrahRoutes.includes(location.pathname)) {
      setActiveTab('umrah');
    } else {
      setActiveTab('hajj');
    }
  }, [location.pathname]);

  // Hajj related menu items
  const hajjMenuItems = [

    { id: 'ambulance', label: 'Ambulance', icon: <Ambulance size={20} />, path: '/ambulance' },
    { id: 'building', label: 'Building', icon: <BrickWall size={20} />, path: '/building' },
    { id: 'branch', label: 'Branch', icon: <GitBranch size={20} />, path: '/branch' },
    { id: 'bus-station', label: 'Bus Station', icon: <Bus size={20} />, path: '/bus-station' },
    { id: 'camp', label: 'Camp', icon: <TentTree size={20} />, path: '/camp' },
    { id: 'clinic', label: 'Clinic', icon: <BriefcaseMedical size={20} />, path: '/clinic' },
    { id: 'countries', label: 'Countries', icon: <Flag size={20} />, path: '/countries' },
    { id: 'emergency', label: 'Emergency', icon: <PhoneCall size={20} />, path: '/emergency' },
    { id: 'hospital', label: 'Hospital', icon: <Hospital size={20} />, path: '/hospital' },
    { id: 'location', label: 'Location', icon: <MapPin size={20} />, path: '/location' },
    { id: 'news', label: 'News', icon: <Newspaper size={20} />, path: '/news' },
    { id: 'nusuk', label: 'Nusuk', icon: <Building size={20} />, path: '/nusuk' },
    { id: 'thanima', label: 'Thanima', icon: <HandHelping size={20} />, path: '/thanima' },
    { id: 'notification', label: 'Notifications', icon: <Bell size={20} />, path: '/notification' },
  ];

  // Umrah related menu items
  const umrahMenuItems = [
    {
      id: 'umrah-preparation',
      label: 'Preparation',
      icon: <Calendar size={20} />,
      path: '/umrah-preparation'
    },
    {
      id: 'umrah-arrived',
      label: 'Arrived In Makkah',
      icon: <PlaneLanding size={20} />,
      path: '/umrah-arrived'
    },
    {
      id: 'umrah-duas',
      label: 'Duas & Supplication',
      icon: <BookOpen size={20} />,
      path: '/umrah-duas'
    },
    {
      id: 'umrah-virtual-tour',
      label: 'Virtual Umrah Tour',
      icon: <Video size={20} />,
      path: '/umrah-virtual-tour'
    },
    {
      id: 'umrah-post',
      label: 'Post Umrah',
      icon: <PlaneTakeoff size={20} />,
      path: '/umrah-post'
    },

  ];

  // Explore KSA related menu items
  const exploreKsaMenuItems = [
    { id: 'ksa-location', label: 'Location', icon: <MapPin size={20} />, path: '/locationKSA' },
    { id: 'ksa-places', label: 'Places', icon: <Navigation size={20} />, path: '/placeKSA' },
  ];

  const getCurrentMenuItems = () => {
    switch (activeTab) {
      case 'hajj':
        return hajjMenuItems;
      case 'umrah':
        return umrahMenuItems;
      case 'explore-ksa':
        return exploreKsaMenuItems;
      default:
        return hajjMenuItems;
    }
  };

  const renderTabButton = (tabId, label) => {
    return (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`w-full py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 relative overflow-hidden
          ${activeTab === tabId
            ? 'bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white shadow-lg transform scale-[1.02]'
            : 'text-gray-400 hover:text-white hover:bg-[#1e3a8a]/50'
          }`}
      >
        <span className="relative z-10">{label}</span>
        {activeTab === tabId && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`fixed bg-[#002147] text-white h-[calc(100vh-3.5rem)] z-10 transition-all duration-300 top-14 
        ${isOpen ? 'w-64' : 'w-0 md:w-16'}`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-blue-900 bg-[#002147] sticky top-0 z-20">
        {isOpen ? (
          <h2 className="text-xl font-bold">Admin Panel</h2>
        ) : (
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#002147] font-bold">A</span>
          </div>
        )}
      </div>

      {/* Vertical Tab Navigation */}
      {isOpen && (
        <div className="bg-[#001836] border-b border-[#1e3a8a]/30 px-3 py-2">
          <div className="bg-[#0f1729] rounded-lg p-1 flex flex-col gap-1">
            {renderTabButton('hajj', 'Hajj Services')}
            {renderTabButton('umrah', 'Umrah Services')}
            {renderTabButton('explore-ksa', 'Explore KSA')}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div
        className={`${isOpen ? 'h-[calc(100%-9.5rem)]' : 'h-[calc(100%-4rem)]'} overflow-y-auto`}
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        <nav className="py-2">
          <ul>
            {getCurrentMenuItems().map((item) => (
              <li key={item.id} className="px-2">
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
      </div>
    </aside>
  );
};

export default Sidebar;
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Ambulance, BrickWall, TentTree, Hospital, HandHelping,
  BriefcaseMedical, Building, MapPin, Bell, GitBranch, Bus, Flag, PhoneCall,
  Newspaper, Navigation, Calendar, PlaneLanding, BookOpen,
  Video, PlaneTakeoff, ChevronDown, ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('hajj');
  const [expandedSections, setExpandedSections] = useState({
    hajj: true,
    umrah: false,
    'explore-ksa': false
  });

  // Automatically set the correct tab based on current route
  useEffect(() => {
    const ksaRoutes = [
      '/locationKSA',
      '/placeKSA',
      '/KSA/ambulance',
      '/KSA/building',
      '/KSA/branch',
      '/KSA/bus-station',
      '/KSA/camp',
      '/KSA/clinic',
      '/KSA/countries',
      '/KSA/emergency',
      '/KSA/hospital',
      '/KSA/news',
      '/KSA/nusuk',
      '/KSA/thanima',
      '/KSA/notification'
    ];
    const umrahRoutes = [
      '/umrah-ambulance',
      '/umrah-branch',
      '/umrah-building',
      '/umrah-bus',
      '/umrah-camp',
      '/umrah-clinic',
      '/umrah-country',
      '/umrah-emergency',
      '/umrah-emergency',
      '/umrah-hospital',
      '/umrah-preparation',
      '/umrah-arrived',
      '/umrah-duas',
      '/umrah-virtual-tour',
      '/umrah-post',
    ];

    if (ksaRoutes.includes(location.pathname)) {
      setActiveTab('explore-ksa');
      setExpandedSections(prev => ({ ...prev, 'explore-ksa': true }));
    } else if (umrahRoutes.includes(location.pathname)) {
      setActiveTab('umrah');
      setExpandedSections(prev => ({ ...prev, umrah: true }));
    } else {
      setActiveTab('hajj');
      setExpandedSections(prev => ({ ...prev, hajj: true }));
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
      id: 'umrah-ambulance',
      label: 'Ambulance',
      icon: <Ambulance size={20} />,
      path: '/umrah-ambulance'
    },
    {
      id: 'umrah-branch',
      label: 'Branch',
      icon: <GitBranch size={20} />,
      path: '/umrah-branch'
    },
    {
      id: 'umrah-building',
      label: 'Building',
      icon: <BrickWall size={20} />,
      path: '/umrah-building'
    },
    {
      id: 'umrah-bus',
      label: 'Bus Station',
      icon: <Bus size={20} />,
      path: '/umrah-bus'
    },
    {
      id: 'umrah-camp',
      label: 'Camp',
      icon: <TentTree size={20} />,
      path: '/umrah-camp'
    },
    {
      id: 'umrah-clinic',
      label: 'Clinic',
      icon: <BriefcaseMedical size={20} />,
      path: '/umrah-clinic'
    },
    {
      id: 'umrah-country',
      label: 'Country',
      icon: <Flag size={20} />,
      path: '/umrah-country'
    },
    {
      id: 'umrah-emergency',
      label: 'Emergency',
      icon: <PhoneCall size={20} />,
      path: '/umrah-emergency'
    },
    {
      id: 'umrah-emergency',
      label: 'Emergency',
      icon: <PhoneCall size={20} />,
      path: '/umrah-emergency'
    },
    {
      id: 'umrah-hospital',
      label: 'Hospital',
      icon: <Hospital size={20} />,
      path: '/umrah-hospital'
    },
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
    { id: 'ambulanceKSA', label: 'Ambulance', icon: <Ambulance size={20} />, path: '/KSA/ambulance' },
    { id: 'buildingKSA', label: 'Building', icon: <BrickWall size={20} />, path: '/KSA/building' },
    { id: 'branchKSA', label: 'Branch', icon: <GitBranch size={20} />, path: '/KSA/branch' },
    { id: 'bus-stationKSA', label: 'Bus Station', icon: <Bus size={20} />, path: '/KSA/bus-station' },
    { id: 'thanimaKSA', label: 'Thanima', icon: <HandHelping size={20} />, path: '/KSA/thanima' },
    { id: 'campKSA', label: 'Camp', icon: <TentTree size={20} />, path: '/KSA/camp' },
    { id: 'clinicKSA', label: 'Clinic', icon: <BriefcaseMedical size={20} />, path: '/KSA/clinic' },
    { id: 'countriesKSA', label: 'Countries', icon: <Flag size={20} />, path: '/KSA/countries' },
    { id: 'emergencyKSA', label: 'Emergency', icon: <PhoneCall size={20} />, path: '/KSA/emergency' },
    { id: 'hospitalKSA', label: 'Hospital', icon: <Hospital size={20} />, path: '/KSA/hospital' },
    { id: 'newsKSA', label: 'News', icon: <Newspaper size={20} />, path: '/KSA/news' },
    { id: 'nusukKSA', label: 'Nusuk', icon: <Building size={20} />, path: '/KSA/nusuk' },
    { id: 'notificationKSA', label: 'Notifications', icon: <Bell size={20} />, path: '/KSA/notification' },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    setActiveTab(sectionId);
  };

  const renderDropdownSection = (sectionId, title, menuItems) => {
    const isExpanded = expandedSections[sectionId];
    
    return (
      <div key={sectionId} className="mb-2">
        <button
          onClick={() => toggleSection(sectionId)}
          className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 rounded-lg hover:bg-[#1e3a8a]/50
            ${activeTab === sectionId ? 'bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white' : 'text-gray-300 hover:text-white'}
          `}
        >
          <span className="font-semibold text-sm">{title}</span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {isExpanded && (
          <div className="mt-1 ml-2 border-l-2 border-[#4A90E2]/30">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 ml-2 transition-colors rounded-md text-sm
                      ${location.pathname === item.path
                        ? 'bg-[#4A90E2] text-white shadow-md'
                        : 'text-gray-300 hover:bg-blue-900/50 hover:text-white'
                      }`}
                  >
                    <span className="opacity-80">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`fixed bg-[#002147] text-white h-screen z-10 transition-all duration-300 top-0 flex flex-col
        ${isOpen ? 'w-64' : 'w-0 md:w-16'}`}
    >
      {/* Menu Items Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16">
        <nav className="p-3">
          {isOpen ? (
            <div className="space-y-1">
              {renderDropdownSection('hajj', 'Hajj Services', hajjMenuItems)}
              {renderDropdownSection('umrah', 'Umrah Services', umrahMenuItems)}
              {renderDropdownSection('explore-ksa', 'Explore KSA', exploreKsaMenuItems)}
            </div>
          ) : (
            // Collapsed sidebar - show minimal icons
            <div className="space-y-4 pt-4">
              <div className="w-8 h-8 rounded-full bg-[#4A90E2] flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xs">H</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#357ABD] flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xs">U</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xs">K</span>
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
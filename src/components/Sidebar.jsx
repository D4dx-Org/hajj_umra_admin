import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import logoblack from "../assets/logo-white.png";
import {
  Ambulance,
  BrickWall,
  TentTree,
  Hospital,
  HandHelping,
  BriefcaseMedical,
  Building,
  MapPin,
  Bell,
  GitBranch,
  Bus,
  Flag,
  PhoneCall,
  Newspaper,
  Navigation,
  Calendar,
  PlaneLanding,
  BookOpen,
  Video,
  PlaneTakeoff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("hajj");
  const [expandedSections, setExpandedSections] = useState({
    hajj: true,
    umrah: false,
    "explore-ksa": false,
  });
  const [expandedUmrahSections, setExpandedUmrahSections] = useState({
    essential: false,
  });
  const [expandedKsaSections, setExpandedKsaSections] = useState({
    essential: false,
  });
  const isUserInteraction = useRef(false); // Track user interactions

  // Automatically set the correct tab based on current route
  useEffect(() => {
    // Skip if the change is due to user interaction
    if (isUserInteraction.current) {
      isUserInteraction.current = false;
      return;
    }

    const ksaRoutes = [
      "/locationKSA",
      "/placeKSA",
      "/KSA/ambulance",
      "/KSA/building",
      "/KSA/branch",
      "/KSA/bus-station",
      "/KSA/camp",
      "/KSA/clinic",
      // "/KSA/countries",
      "/KSA/emergency",
      "/KSA/hospital",
      "/KSA/news",
      "/KSA/nusuk",
      "/KSA/thanima",
      "/KSA/notification",
    ];
    const umrahRoutes = [
      "/umrah-ambulance",
      "/umrah-branch",
      "/umrah-building",
      "/umrah-bus",
      "/umrah-camp",
      "/umrah-clinic",
      // "/umrah-country",
      "/umrah-emergency",
      "/umrah-hospital",
      "/umrah-news",
      "/umrah-nusuk",
      "/umrah-thanima",
      "/umrah-notification",
      "/umrah-preparation",
      "/umrah-arrived",
      "/umrah-duas",
      "/umrah-virtual-tour",
      "/umrah-post",
    ];

    const essentialUmrahRoutes = [
      "/umrah-ambulance",
      "/umrah-branch",
      "/umrah-building",
      "/umrah-bus",
      "/umrah-camp",
      "/umrah-clinic",
      // "/umrah-country",
      "/umrah-emergency",
      "/umrah-hospital",
      "/umrah-news",
      "/umrah-nusuk",
      "/umrah-thanima",
      "/umrah-notification",
    ];

    const essentialKsaRoutes = [
      "/KSA/ambulance",
      "/KSA/building",
      "/KSA/branch",
      "/KSA/bus-station",
      "/KSA/camp",
      "/KSA/clinic",
      // "/KSA/countries",
      "/KSA/emergency",
      "/KSA/hospital",
      "/KSA/news",
      "/KSA/nusuk",
      "/KSA/thanima",
      "/KSA/notification",
      "/locationKSA",
    ];

    const alternativeUmrahRoutes = [
      "/umrah-preparation",
      "/umrah-arrived",
      "/umrah-duas",
      "/umrah-virtual-tour",
      "/umrah-post",
    ];

    if (ksaRoutes.includes(location.pathname)) {
      setActiveTab("explore-ksa");
      setExpandedSections({
        hajj: false,
        umrah: false,
        "explore-ksa": true,
      });
      
      // Auto-expand the essential services if it's an essential route
      if (essentialKsaRoutes.includes(location.pathname)) {
        setExpandedKsaSections({
          essential: true,
        });
      }
    } else if (umrahRoutes.includes(location.pathname)) {
      setActiveTab("umrah");
      setExpandedSections({
        hajj: false,
        umrah: true,
        "explore-ksa": false,
      });
      
      // Auto-expand the essential services if it's an essential route
      if (essentialUmrahRoutes.includes(location.pathname)) {
        setExpandedUmrahSections({
          essential: true,
        });
      }
    } else {
      setActiveTab("hajj");
      setExpandedSections({
        hajj: true,
        umrah: false,
        "explore-ksa": false,
      });
    }
  }, [location.pathname]);

  // Hajj related menu items
  const hajjMenuItems = [
    {
      id: "ambulance",
      label: "Ambulance",
      icon: <Ambulance size={16} />,
      path: "/ambulance",
    },
    {
      id: "building",
      label: "Building",
      icon: <BrickWall size={16} />,
      path: "/building",
    },
    {
      id: "branch",
      label: "Branch",
      icon: <GitBranch size={16} />,
      path: "/branch",
    },
    {
      id: "bus-station",
      label: "Bus Station",
      icon: <Bus size={16} />,
      path: "/bus-station",
    },
    { id: "camp", label: "Camp", icon: <TentTree size={16} />, path: "/camp" },
    {
      id: "clinic",
      label: "Clinic",
      icon: <BriefcaseMedical size={16} />,
      path: "/clinic",
    },
    {
      id: "countries",
      label: "Countries",
      icon: <Flag size={16} />,
      path: "/countries",
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: <PhoneCall size={16} />,
      path: "/emergency",
    },
    {
      id: "hospital",
      label: "Hospital",
      icon: <Hospital size={16} />,
      path: "/hospital",
    },
    {
      id: "location",
      label: "Location",
      icon: <MapPin size={16} />,
      path: "/location",
    },
    { id: "news", label: "News", icon: <Newspaper size={16} />, path: "/news" },
    {
      id: "nusuk",
      label: "Nusuk",
      icon: <Building size={16} />,
      path: "/nusuk",
    },
    {
      id: "thanima",
      label: "Thanima",
      icon: <HandHelping size={16} />,
      path: "/thanima",
    },
    {
      id: "notification",
      label: "Notifications",
      icon: <Bell size={16} />,
      path: "/notification",
    },
  ];

  // Essential Umrah services
  const essentialUmrahMenuItems = [
    {
      id: "umrah-ambulance",
      label: "Ambulance",
      icon: <Ambulance size={16} />,
      path: "/umrah-ambulance",
    },
    {
      id: "umrah-branch",
      label: "Branch",
      icon: <GitBranch size={16} />,
      path: "/umrah-branch",
    },
    {
      id: "umrah-building",
      label: "Building",
      icon: <BrickWall size={16} />,
      path: "/umrah-building",
    },
    {
      id: "umrah-bus",
      label: "Bus Station",
      icon: <Bus size={16} />,
      path: "/umrah-bus",
    },
    {
      id: "umrah-camp",
      label: "Camp",
      icon: <TentTree size={16} />,
      path: "/umrah-camp",
    },
    {
      id: "umrah-clinic",
      label: "Clinic",
      icon: <BriefcaseMedical size={16} />,
      path: "/umrah-clinic",
    },
    // {
    //   id: "umrah-country",
    //   label: "Country",
    //   icon: <Flag size={16} />,
    //   path: "/umrah-country",
    // },
    {
      id: "umrah-emergency",
      label: "Emergency",
      icon: <PhoneCall size={16} />,
      path: "/umrah-emergency",
    },
    {
      id: "umrah-hospital",
      label: "Hospital",
      icon: <Hospital size={16} />,
      path: "/umrah-hospital",
    },
    {
      id: "umrah-news",
      label: "News",
      icon: <Newspaper size={16} />,
      path: "/umrah-news",
    },
    {
      id: "umrah-nusuk",
      label: "Nusuk",
      icon: <Building size={16} />,
      path: "/umrah-nusuk",
    },
    {
      id: "umrah-thanima",
      label: "Thanima",
      icon: <HandHelping size={16} />,
      path: "/umrah-thanima",
    },
    {
      id: "umrah-notification",
      label: "Notifications",
      icon: <Bell size={16} />,
      path: "/umrah-notification",
    },
  ];

  // Alternative Umrah services
  const alternativeUmrahMenuItems = [
    {
      id: "umrah-preparation",
      label: "Preparation",
      icon: <Calendar size={16} />,
      path: "/umrah-preparation",
    },
    {
      id: "umrah-arrived",
      label: "Arrived In Makkah",
      icon: <PlaneLanding size={16} />,
      path: "/umrah-arrived",
    },
    {
      id: "umrah-duas",
      label: "Duas & Supplication",
      icon: <BookOpen size={16} />,
      path: "/umrah-duas",
    },
    {
      id: "umrah-virtual-tour",
      label: "Virtual Umrah Tour",
      icon: <Video size={16} />,
      path: "/umrah-virtual-tour",
    },
    {
      id: "umrah-post",
      label: "Post Umrah",
      icon: <PlaneTakeoff size={16} />,
      path: "/umrah-post",
    },
  ];

  // Essential KSA services
  const essentialKsaMenuItems = [
    {
      id: "ksa-location",
      label: "Location",
      icon: <MapPin size={16} />,
      path: "/locationKSA",
    },
    {
      id: "ambulanceKSA",
      label: "Ambulance",
      icon: <Ambulance size={16} />,
      path: "/KSA/ambulance",
    },
    {
      id: "buildingKSA",
      label: "Building",
      icon: <BrickWall size={16} />,
      path: "/KSA/building",
    },
    {
      id: "branchKSA",
      label: "Branch",
      icon: <GitBranch size={16} />,
      path: "/KSA/branch",
    },
    {
      id: "bus-stationKSA",
      label: "Bus Station",
      icon: <Bus size={16} />,
      path: "/KSA/bus-station",
    },
    {
      id: "campKSA",
      label: "Camp",
      icon: <TentTree size={16} />,
      path: "/KSA/camp",
    },
    {
      id: "clinicKSA",
      label: "Clinic",
      icon: <BriefcaseMedical size={16} />,
      path: "/KSA/clinic",
    },
    // {
    //   id: "countriesKSA",
    //   label: "Countries",
    //   icon: <Flag size={16} />,
    //   path: "/KSA/countries",
    // },
    {
      id: "emergencyKSA",
      label: "Emergency",
      icon: <PhoneCall size={16} />,
      path: "/KSA/emergency",
    },
    {
      id: "hospitalKSA",
      label: "Hospital",
      icon: <Hospital size={16} />,
      path: "/KSA/hospital",
    },
    {
      id: "newsKSA",
      label: "News",
      icon: <Newspaper size={16} />,
      path: "/KSA/news",
    },
    {
      id: "nusukKSA",
      label: "Nusuk",
      icon: <Building size={16} />,
      path: "/KSA/nusuk",
    },
    {
      id: "thanimaKSA",
      label: "Thanima",
      icon: <HandHelping size={16} />,
      path: "/KSA/thanima",
    },
    {
      id: "notificationKSA",
      label: "Notifications",
      icon: <Bell size={16} />,
      path: "/KSA/notification",
    },
  ];

  // Regular KSA menu items (non-essential)
  const regularKsaMenuItems = [
    {
      id: "ksa-places",
      label: "Places",
      icon: <Navigation size={16} />,
      path: "/placeKSA",
    },
  ];

  const toggleSection = (sectionId) => {
    isUserInteraction.current = true; // Mark as user interaction
    setActiveTab(sectionId);
    setExpandedSections((prev) => ({
      hajj: sectionId === "hajj" ? !prev.hajj : false,
      umrah: sectionId === "umrah" ? !prev.umrah : false,
      "explore-ksa": sectionId === "explore-ksa" ? !prev["explore-ksa"] : false,
    }));
  };

  const toggleUmrahSection = (sectionId) => {
    isUserInteraction.current = true;
    setExpandedUmrahSections((prev) => ({
      essential: sectionId === "essential" ? !prev.essential : false,
    }));
  };

  const toggleKsaSection = (sectionId) => {
    isUserInteraction.current = true;
    setExpandedKsaSections((prev) => ({
      essential: sectionId === "essential" ? !prev.essential : false,
    }));
  };

  const renderMenuItems = (menuItems) => (
    <ul className="space-y-0.5">
      {menuItems.map((item) => (
        <li key={item.id}>
          <Link
            to={item.path}
            className={`flex items-center gap-2 px-3 py-1.5 ml-1 transition-colors rounded-md text-[14px]
              ${
                location.pathname === item.path
                  ? "bg-[#4A90E2] text-white shadow-md"
                  : "text-gray-300 hover:bg-blue-900/50 hover:text-white"
              }`}
            onClick={() => (isUserInteraction.current = true)}
          >
            <span className="opacity-80">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const renderUmrahSubSection = (sectionId, title, menuItems) => {
    const isExpanded = expandedUmrahSections[sectionId];

    return (
      <div className="ml-2 mb-1">
        <button
          onClick={() => toggleUmrahSection(sectionId)}
          className={`w-full flex items-center justify-between p-2 text-left transition-all duration-200 rounded-lg hover:bg-[#1e3a8a]/50
            ${
              isExpanded
                ? "bg-gradient-to-r from-[#357ABD] to-[#2563eb] text-white"
                : "text-gray-400 hover:text-white"
            }
          `}
        >
          <span className="font-medium text-[14px]">{title}</span>
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {isExpanded && (
          <div className="mt-1 ml-1 border-l-2 border-[#357ABD]/30">
            {renderMenuItems(menuItems)}
          </div>
        )}
      </div>
    );
  };

  const renderKsaSubSection = (sectionId, title, menuItems) => {
    const isExpanded = expandedKsaSections[sectionId];

    return (
      <div className="ml-2 mb-1">
        <button
          onClick={() => toggleKsaSection(sectionId)}
          className={`w-full flex items-center justify-between p-2 text-left transition-all duration-200 rounded-lg hover:bg-[#1e3a8a]/50
            ${
              isExpanded
                ? "bg-gradient-to-r from-[#357ABD] to-[#2563eb] text-white"
                : "text-gray-400 hover:text-white"
            }
          `}
        >
          <span className="font-medium text-[14px]">{title}</span>
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {isExpanded && (
          <div className="mt-1 ml-1 border-l-2 border-[#357ABD]/30">
            {renderMenuItems(menuItems)}
          </div>
        )}
      </div>
    );
  };

  const renderDropdownSection = (sectionId, title, menuItems) => {
    const isExpanded = expandedSections[sectionId];

    return (
      <div key={sectionId} className="mb-1">
        <button
          onClick={() => toggleSection(sectionId)}
          className={`w-full flex items-center justify-between p-2 text-left transition-all duration-200 rounded-lg hover:bg-[#1e3a8a]/50
            ${
              activeTab === sectionId
                ? "bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white"
                : "text-gray-300 hover:text-white"
            }
          `}
        >
          <span className="font-semibold text-[16px]">{title}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isExpanded && (
          <div className="mt-1 ml-1 border-l-2 border-[#4A90E2]/30">
            {sectionId === "umrah" ? (
              <div className="space-y-1">
                {renderUmrahSubSection("essential", "Essential Service", essentialUmrahMenuItems)}
                {renderMenuItems(alternativeUmrahMenuItems)}
              </div>
            ) : sectionId === "explore-ksa" ? (
              <div className="space-y-1">
                {renderKsaSubSection("essential", "Essential Service", essentialKsaMenuItems)}
                {renderMenuItems(regularKsaMenuItems)}
              </div>
            ) : (
              renderMenuItems(menuItems)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`fixed bg-[#3a51a3] text-white h-screen z-10 transition-all duration-300 top-0 flex flex-col
        ${isOpen ? "w-64" : "w-0 md:w-16"}`}
    >
      {/* Logo Section */}
      {isOpen && (
        <div className="flex items-center justify-center p-4 border-b border-[#4A90E2]/30">
          <img
            src={logoblack}
            alt="Thanima Logo"
            className="h-12 w-auto"
          />
        </div>
      )}

      {/* Menu Items Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4">
        <nav className="p-2">
          {isOpen ? (
            <div className="space-y-1">
              {renderDropdownSection("hajj", "Hajj Services", hajjMenuItems)}
              {renderDropdownSection("umrah", "Umrah Services", [])}
              {renderDropdownSection("explore-ksa", "Explore KSA", [])}
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
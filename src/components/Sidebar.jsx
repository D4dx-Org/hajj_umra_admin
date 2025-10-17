import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Plus,
  X,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import AddForm from "./AddForm";


// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, pageName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Page</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the page "<span className="font-medium">{pageName}</span>"? 
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Page
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("hajj");
  const [expandedSections, setExpandedSections] = useState({
    hajj: true,
    umrah: false,
    "explore-ksa": false,
  });
  const [expandedUmrahSections, setExpandedUmrahSections] = useState({
    essential: false,
    categories: false,
  });
  const [expandedKsaSections, setExpandedKsaSections] = useState({
    essential: false,
  });
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    pageName: "",
    pageRoute: "",
  });
  const [customPages, setCustomPages] = useState([]);
  const isUserInteraction = useRef(false);

  // Load custom pages from backend JSON with retry logic
  const fetchCustomPages = async (retryCount = 0, maxRetries = 5) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_V2}/page-builder/umrah`);
      const data = await res.json();
      setCustomPages((data && data.pages) || []);
    } catch (e) {
      console.error(`Failed to load custom pages (attempt ${retryCount + 1}):`, e);
      
      // Retry with exponential backoff if it's a connection error
      if (retryCount < maxRetries && (e.name === 'TypeError' || e.message.includes('fetch'))) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => {
          fetchCustomPages(retryCount + 1, maxRetries);
        }, delay);
      }
    }
  };

  useEffect(() => {
    // Wait a bit for backend to be ready, then fetch
    const initializeData = async () => {
      // Small delay to let backend start
      await new Promise(resolve => setTimeout(resolve, 2000));
      fetchCustomPages();
    };
    
    initializeData();
  }, []);

  const openAddPageModal = (e) => {
    e.stopPropagation();
    setShowAddPageModal(true);
  };

  const closeAddPageModal = () => {
    setShowAddPageModal(false);
  };

  const handleAddPageSuccess = (page) => {
    if (!page) return;
  
    // 1. Update local state immediately
    setCustomPages((prev) => [...prev, page]);
  
    // 2. Expand categories section
    setActiveTab("umrah");
    setExpandedSections({
      hajj: false,
      umrah: true,
      "explore-ksa": false,
    });
    setExpandedUmrahSections({
      essential: false,
      categories: true,
    });
  
    // 3. Wait for routes to be ready before navigating
    const handleRoutesReady = (event) => {
      if (event.detail?.page?.route === page.route) {
        navigate(page.route);
        window.removeEventListener('routesReady', handleRoutesReady);
      }
    };
  
    window.addEventListener('routesReady', handleRoutesReady);
  
    // 4. Notify App.jsx to update routes
    window.dispatchEvent(new CustomEvent('customPageCreated', { 
      detail: { page } 
    }));
  
    // 5. Fallback navigation if no confirmation (safety net)
    setTimeout(() => {
      window.removeEventListener('routesReady', handleRoutesReady);
      // This will only run if routesReady event didn't fire
    }, 3000);
  
    // 6. Sync with backend
    setTimeout(() => {
      fetchCustomPages();
    }, 500);
  };
   // Open delete confirmation modal
   const openDeleteModal = (name, route) => {
    setDeleteModal({
      isOpen: true,
      pageName: name,
      pageRoute: route,
    });
  };
  
 // Close delete confirmation modal
 const closeDeleteModal = () => {
  setDeleteModal({
    isOpen: false,
    pageName: "",
    pageRoute: "",
  });
};

const handleDeletePage = async () => {
  const { pageName, pageRoute } = deleteModal;
  
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_V2}/page-builder/umrah/${encodeURIComponent(pageName)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete page");
    
    // Update local state immediately
    setCustomPages(data.pages || []);
    
    // If we're on the deleted page, navigate away FIRST, then reload
    if (location.pathname === pageRoute) {
      navigate("/umrah-preparation", { replace: true });
      // Wait for navigation to complete before reloading
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else {
      // If not on deleted page, reload immediately
      window.location.reload();
    }
    
  } catch (e) {
    console.error("Delete error:", e);
    // Show error to user instead of silent failure
    alert("Failed to delete page: " + e.message);
  } finally {
    closeDeleteModal();
  }
};

  // Helper function to get icon component from string
  const getIconComponent = (iconName) => {
    const iconMap = {
      BookOpen: <BookOpen size={16} />,
      Video: <Video size={16} />,
      Calendar: <Calendar size={16} />,
      PlaneLanding: <PlaneLanding size={16} />,
      PlaneTakeoff: <PlaneTakeoff size={16} />,
      Navigation: <Navigation size={16} />,
      MapPin: <MapPin size={16} />,
      Bell: <Bell size={16} />,
    };

    return iconMap[iconName] || <BookOpen size={16} />;
  };

  // Automatically set the correct tab based on current route
  useEffect(() => {
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
      ...customPages.map((page) => page.route),
    ];

    const essentialUmrahRoutes = [
      "/umrah-ambulance",
      "/umrah-branch",
      "/umrah-building",
      "/umrah-bus",
      "/umrah-camp",
      "/umrah-clinic",
      "/umrah-emergency",
      "/umrah-hospital",
      "/umrah-news",
      "/umrah-nusuk",
      "/umrah-thanima",
      "/umrah-notification",
    ];

    const categoriesUmrahRoutes = [
      "/umrah-preparation",
      "/umrah-arrived",
      "/umrah-duas",
      "/umrah-virtual-tour",
      "/umrah-post",
      ...customPages.map((page) => page.route),
    ];

    const essentialKsaRoutes = [
      "/KSA/ambulance",
      "/KSA/building",
      "/KSA/branch",
      "/KSA/bus-station",
      "/KSA/camp",
      "/KSA/clinic",
      "/KSA/emergency",
      "/KSA/hospital",
      "/KSA/news",
      "/KSA/nusuk",
      "/KSA/thanima",
      "/KSA/notification",
      "/locationKSA",
    ];

    if (ksaRoutes.includes(location.pathname)) {
      setActiveTab("explore-ksa");
      setExpandedSections({
        hajj: false,
        umrah: false,
        "explore-ksa": true,
      });

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

      if (essentialUmrahRoutes.includes(location.pathname)) {
        setExpandedUmrahSections({
          essential: true,
          categories: false,
        });
      } else if (categoriesUmrahRoutes.includes(location.pathname)) {
        setExpandedUmrahSections({
          essential: false,
          categories: true,
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
  }, [location.pathname, customPages]);

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
    }
  ];

  // Categories Umrah services (including custom pages)
  const categoriesUmrahMenuItems = [
    {
      id: "umrah-preparation",
      label: "Guide",
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
    ...customPages.map((p) => ({
      id: p.route,
      label: p.name,
      icon: <BookOpen size={16} />,
      path: p.route,
      __isCustom: true,
    })),
  ];

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

  const regularKsaMenuItems = [
    {
      id: "ksa-places",
      label: "Places",
      icon: <Navigation size={16} />,
      path: "/placeKSA",
    },
  ];

  const renderMenuItems = (menuItems) => (
    <ul className="space-y-0.5">
      {menuItems.map((item) => (
        <li key={item.id || item.path} className="group">
          <div className={`flex items-center justify-between rounded-md transition-colors
            ${location.pathname === item.path 
              ? "bg-[#4A90E2]" 
              : "hover:bg-blue-900/50"}`}
          >
            <Link
              to={item.path}
              className={`flex items-center gap-2 px-3 py-1.5 ml-1 text-[14px] flex-1
                ${
                  location.pathname === item.path
                    ? "text-white"
                    : "text-gray-300 group-hover:text-white"
                }`}
              onClick={() => (isUserInteraction.current = true)}
            >
              <span className="opacity-80">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
            {item.__isCustom && (
              <button
                className="mr-2 p-1 rounded text-gray-300 group-hover:text-white hover:bg-white/10 hover:text-red-400"
                title={`Delete ${item.label}`}
                onClick={() => openDeleteModal(item.label, item.path)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  const renderUmrahSubSection = (sectionId, title, menuItems) => {
    const isExpanded = expandedUmrahSections[sectionId];
  
    return (
      <div className="ml-2 mb-1">
        <div className="relative">
          <button
            onClick={() => toggleUmrahSection(sectionId)}
            className={`w-full flex items-center justify-between p-2 text-left transition-all duration-200 rounded-lg
              ${
                isExpanded
                  ? "bg-gradient-to-r from-[#357ABD] to-[#2563eb] text-white"
                  : "text-gray-400 hover:bg-[#1e3a8a]/50 hover:text-white"
              }
            `}
          >
            <span className="font-medium text-[14px]">{title}</span>
            <div className="flex items-center">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          </button>
          
          {sectionId === "categories" && (
            <button 
              className="absolute right-6 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 add-on-button"
              onClick={openAddPageModal}
              title="Add New Page"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
  
        {isExpanded && (
          <div className="mt-1 ml-1 border-l-2 border-[#357ABD]/30">
            {renderMenuItems(menuItems)}
          </div>
        )}
      </div>
    );
  };

  const toggleSection = (sectionId) => {
    isUserInteraction.current = true;
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
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleKsaSection = (sectionId) => {
    isUserInteraction.current = true;
    setExpandedKsaSections((prev) => ({
      essential: sectionId === "essential" ? !prev.essential : false,
    }));
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
                {renderUmrahSubSection("categories", "Categories", categoriesUmrahMenuItems)}
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
    <>
      <aside
        className={`fixed bg-[#3a51a3] text-white h-screen z-10 transition-all duration-300 top-0 flex flex-col
          ${isOpen ? "w-64" : "w-0 md:w-16"}`}
      >
        {isOpen && (
          <div className="flex items-center justify-center p-4 border-b border-[#4A90E2]/30">
            <img
              src={logoblack}
              alt="Thanima Logo"
              className="h-12 w-auto"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 scrollbar-hide">
          <nav className="p-2">
            {isOpen ? (
              <div className="space-y-1">
                {renderDropdownSection("hajj", "Hajj Services", hajjMenuItems)}
                {renderDropdownSection("umrah", "Umrah Services", [])}
                {renderDropdownSection("explore-ksa", "Explore KSA", [])}
              </div>
            ) : (
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

      <AddForm open={showAddPageModal} onClose={closeAddPageModal} onSuccess={handleAddPageSuccess} />
      
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePage}
        pageName={deleteModal.pageName}
      />
    </>
    
  );
};

export default Sidebar;
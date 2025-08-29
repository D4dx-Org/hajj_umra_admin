import React, { useEffect, useState, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import AdminLogin from "./components/adminLogin";
import HomePage from "./components/homePage";
import Ambulance from "./pages/Admin/Ambulance";
import Building from "./pages/Admin/Building";
import Camp from "./pages/Admin/Camp";
import Clinic from "./pages/Admin/Clinic";
import Hospital from "./pages/Admin/Hospital";
import Location from "./pages/Admin/Loaction";
import Nusuk from "./pages/Admin/Nusuk";
import Thanima from "./pages/Admin/Thanima";
import Notification from "./pages/Admin/Notification";
import Branch from "./pages/Admin/Branch";
import BusStation from "./pages/Admin/BusStation";
import Countries from "./pages/Admin/Countries";
import Emergency from "./pages/Admin/Emergency";
import News from "./pages/Admin/News";

import LocationKSA from "./pages/Admin/ExploreKSA/locationKSA";
import PlaceKSA from "./pages/Admin/ExploreKSA/placeKSA";
import AmbulanceKSA from "./pages/Admin/ExploreKSA/AmbulanceKSA";
import BuildingKSA from "./pages/Admin/ExploreKSA/BuildingKSA";
import CampKSA from "./pages/Admin/ExploreKSA/CampKSA";
import ClinicKSA from "./pages/Admin/ExploreKSA/ClinicKSA";
import HospitalKSA from "./pages/Admin/ExploreKSA/HospitalKSA";
import NusukKSA from "./pages/Admin/ExploreKSA/NusukKSA";
import ThanimaKSA from "./pages/Admin/ExploreKSA/ThanimaKSA";
import NotificationKSA from "./pages/Admin/ExploreKSA/NotificationKSA";
import BranchKSA from "./pages/Admin/ExploreKSA/BranchKSA";
import BusStationKSA from "./pages/Admin/ExploreKSA/BusStationKSA";
import CountriesKSA from "./pages/Admin/ExploreKSA/CountriesKSA";
import EmergencyKSA from "./pages/Admin/ExploreKSA/EmergencyKSA";
import NewsKSA from "./pages/Admin/ExploreKSA/NewsKSA";


import Arrived from "./pages/Admin/Umrah/arrived";
import Duas from "./pages/Admin/Umrah/duaas";
import Post from "./pages/Admin/Umrah/postUmrah";
import Preparation from "./pages/Admin/Umrah/preparations";
import Tour from "./pages/Admin/Umrah/tour";
import UmrahAmbulance from "./pages/Admin/Umrah/UmrahAmbulance";
import UmrahBranch from "./pages/Admin/Umrah/UmrahBranch";
import UmrahBuilding from "./pages/Admin/Umrah/UmrahBuilding";
import UmrahBus from "./pages/Admin/Umrah/UmrahBus";
import UmrahCamp from "./pages/Admin/Umrah/UmrahCamp";
import UmrahClinic from "./pages/Admin/Umrah/UmrahClinic";
import UmrahCountry from "./pages/Admin/Umrah/UmrahCountry";
import UmrahEmergency from "./pages/Admin/Umrah/UmrahEmergency";
import UmrahHospital from "./pages/Admin/Umrah/UmrahHospital";
import UmrahNews from "./pages/Admin/Umrah/UmrahNews";
import UmrahNusuk from "./pages/Admin/Umrah/UmrahNusuk";
import UmrahThanima from "./pages/Admin/Umrah/UmrahThanima";
import UmrahNotification from "./pages/Admin/Umrah/UmrahNotification";

import add from "../src/components/AddForm";

// Vite: dynamically import all Umrah pages
const umrahModules = import.meta.glob('./pages/Admin/Umrah/*.jsx');

const App = () => {
  const [customPages, setCustomPages] = useState([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_V2}/page-builder/umrah`);
        const data = await res.json();
        setCustomPages((data && data.pages) || []);
      } catch (e) {
        console.error('Failed loading custom pages', e);
      }
    };
    fetchPages();

    // Listen for custom events when new pages are created
    const handlePageCreated = (event) => {
      fetchPages().then(() => {
        // After state updates, wait for React to re-render routes
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('routesReady', {
            detail: { page: event.detail?.page }
          }));
        }, 100); // Give React Router time to process new routes
      });
    };

    window.addEventListener('customPageCreated', handlePageCreated);
    return () => window.removeEventListener('customPageCreated', handlePageCreated);
  }, []);

  const renderDynamicRoute = (page) => {
    const path = `./pages/Admin/Umrah/${page.component}`;
    const loader = umrahModules[path];
  
    if (!loader) {
      console.warn("Module not found for path:", path, "- Creating fallback route");
      // Create a fallback component for newly created pages
      return (
        <Route
          key={page.route}
          path={page.route}
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">{page.name}</h1>
              <p className="text-gray-600">
                This is a dynamically created page. The component file may need to be generated.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Expected component: {page.component}
              </p>
            </div>
          }
        />
      );
    }
  
    const LazyComp = React.lazy(() => loader());

    return (
      <Route
        key={page.route}
        path={page.route}
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <LazyComp />
          </Suspense>
        }
      />
    );
  };
  
 
  

  return (
    <Router>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<add />} />
        {/* Admin Routes */}
        {/* <Route element={<AdminLayout />}> */}
        <Route path="/ambulance" element={<Ambulance />} />
        <Route path="/building" element={<Building />} />
        <Route path="/branch" element={<Branch />} />
        <Route path="/bus-station" element={<BusStation />} />
        <Route path="/camp" element={<Camp />} />
        <Route path="/clinic" element={<Clinic />} />
        <Route path="/countries" element={<Countries />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/hospital" element={<Hospital />} />
        <Route path="/location" element={<Location />} />
        <Route path="/news" element={<News />} />
        <Route path="/nusuk" element={<Nusuk />} />
        <Route path="/thanima" element={<Thanima />} />
        <Route path="/notification" element={<Notification />} />

        <Route path="/locationKSA" element={<LocationKSA />} />
        <Route path="/placeKSA" element={<PlaceKSA />} />
        <Route path="/KSA/ambulance" element={<AmbulanceKSA />} />
        <Route path="/KSA/building" element={<BuildingKSA />} />
        <Route path="/KSA/branch" element={<BranchKSA />} />
        <Route path="/KSA/bus-station" element={<BusStationKSA />} />
        <Route path="/KSA/camp" element={<CampKSA />} />
        <Route path="/KSA/clinic" element={<ClinicKSA />} />
        <Route path="/KSA/countries" element={<CountriesKSA />} />
        <Route path="/KSA/emergency" element={<EmergencyKSA />} />
        <Route path="/KSA/hospital" element={<HospitalKSA />} />
        <Route path="/KSA/news" element={<NewsKSA />} />
        <Route path="/KSA/nusuk" element={<NusukKSA />} />
        <Route path="/KSA/thanima" element={<ThanimaKSA />} />
        <Route path="/KSA/notification" element={<NotificationKSA />} />

        <Route path="/umrah-arrived" element={<Arrived />} />
        <Route path="/umrah-preparation" element={<Preparation />} />
        <Route path="/umrah-duas" element={<Duas />} />
        <Route path="/umrah-post" element={<Post />} />
        <Route path="/umrah-virtual-tour" element={<Tour />} />
        <Route path="/umrah-ambulance" element={<UmrahAmbulance />} />
        <Route path="/umrah-branch" element={<UmrahBranch />} />
        <Route path="/umrah-building" element={<UmrahBuilding />} />
        <Route path="/umrah-bus" element={<UmrahBus />} />
        <Route path="/umrah-camp" element={<UmrahCamp />} />
        <Route path="/umrah-clinic" element={<UmrahClinic />} />
        <Route path="/umrah-country" element={<UmrahCountry />} />
        <Route path="/umrah-emergency" element={<UmrahEmergency />} />
        <Route path="/umrah-hospital" element={<UmrahHospital />} />
        <Route path="/umrah-news" element={<UmrahNews />} />
        <Route path="/umrah-nusuk" element={<UmrahNusuk />} />
        <Route path="/umrah-thanima" element={<UmrahThanima />} />
        <Route path="/umrah-notification" element={<UmrahNotification />} />

        <Route path="/add" element={<add />} />

        

        {customPages.map(page => {
          console.log("Rendering dynamic route:", page.route, "Component:", page.component);
          return renderDynamicRoute(page);
        })}

        {/* </Route> */}
      </Routes>
    </Router>
  );
};

export default App;

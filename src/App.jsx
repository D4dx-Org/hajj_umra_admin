import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminLogin from './components/adminLogin';
import HomePage from './components/homePage';
import Ambulance from './pages/Admin/Ambulance';
import Building from './pages/Admin/Building';
import Camp from './pages/Admin/Camp';
import Clinic from './pages/Admin/Clinic';
import Hospital from './pages/Admin/Hospital';
import Location from './pages/Admin/Loaction';
import Nusuk from './pages/Admin/Nusuk';
import Thanima from './pages/Admin/Thanima';
import Notification from './pages/Admin/Notification';
import Branch from './pages/Admin/Branch';
import BusStation from './pages/Admin/BusStation';
import Countries from './pages/Admin/Countries';
import Emergency from './pages/Admin/Emergency';
import News from './pages/Admin/News';

import LocationKSA from './pages/Admin/ExploreKSA/locationKSA';
import PlaceKSA from './pages/Admin/ExploreKSA/placeKSA';
import AmbulanceKSA from './pages/Admin/ExploreKSA/AmbulanceKSA';
import BuildingKSA from './pages/Admin/ExploreKSA/BuildingKSA';
import CampKSA from './pages/Admin/ExploreKSA/CampKSA';
import ClinicKSA from './pages/Admin/ExploreKSA/ClinicKSA';
import HospitalKSA from './pages/Admin/ExploreKSA/HospitalKSA';
import NusukKSA from './pages/Admin/ExploreKSA/NusukKSA';
import ThanimaKSA from './pages/Admin/ExploreKSA/ThanimaKSA';
import NotificationKSA from './pages/Admin/ExploreKSA/NotificationKSA';
import BranchKSA from './pages/Admin/ExploreKSA/BranchKSA';
import BusStationKSA from './pages/Admin/ExploreKSA/BusStationKSA';
import CountriesKSA from './pages/Admin/ExploreKSA/CountriesKSA';
import EmergencyKSA from './pages/Admin/ExploreKSA/EmergencyKSA';
import NewsKSA from './pages/Admin/ExploreKSA/NewsKSA';


import Arrived from './pages/Admin/Umrah/Arrived';
import Duas from './pages/Admin/Umrah/Duaas';
import Post from './pages/Admin/Umrah/postUmrah';
import Preparation from './pages/Admin/Umrah/preparations';
import Tour from './pages/Admin/Umrah/tour';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<HomePage />} />

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
        {/* </Route> */}
      </Routes>
    </Router>
  );
};

export default App;
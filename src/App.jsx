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
import AdminLayout from './components/AdminLayout';

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
          <Route path="/camp" element={<Camp />} />
          <Route path="/clinic" element={<Clinic />} />
          <Route path="/hospital" element={<Hospital />} />
          <Route path="/location" element={<Location />} />
          <Route path="/nusuk" element={<Nusuk />} />
          <Route path="/thanima" element={<Thanima />} />
          <Route path="/notification" element={<Notification />} />
        {/* </Route> */}
      </Routes>
    </Router>
  );
};

export default App;
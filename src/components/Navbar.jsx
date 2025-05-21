import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  let navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin-login');
  };

  const handleProfileView = () => {
    navigate('/admin/profile');
    setShowDropdown(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 h-16 flex items-center px-4 ">
      {/* Sidebar Toggle Button */}
      <button onClick={toggleSidebar} className="p-2 rounded-md text-[#333333] hover:bg-gray-100">
            <Menu size={24} />
          </button>

      {/* Centered Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-bold text-[#002147]">Hajj and Umrah Management System</h1>
        </div>
        
      {/* Admin Section (Right Side) */}
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          <span className="hidden md:block font-medium">Admin</span>
          <div 
            className="w-8 h-8 bg-[#4A90E2] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#357ABD] transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <User size={16} />
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <button
                onClick={handleProfileView}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircle size={16} />
                <span>View Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;




// import React from 'react';
// import { Menu, Bell, User } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// const Navbar = ({ toggleSidebar }) => {

//   let navigate = useNavigate();

//   const handleLogout = () => {
//     // Clear specific items from local storage
//     localStorage.removeItem('token'); // Replace 'token' with the actual key you use for authentication

//     // Navigate to the login page
//     navigate('/admin-login'); // Redirect to the login page after logout
//   };

//   return (
//     <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 h-16 flex items-center px-4">
//       <div className="flex items-center justify-between w-full">
//         <div className="flex items-center">
//           <button 
//             onClick={toggleSidebar} 
//             className="p-2 rounded-md text-[#333333] hover:bg-gray-100"
//           >
//             <Menu size={24} />
//           </button>
//           <h1 className="ml-4 text-xl font-bold text-[#002147] flex-grow text-center">Hajj and Umrah Management System</h1>
//         </div>
        
//         <div className="flex items-center gap-4">
          
          
//           <div className="flex items-center gap-2">
//             <span className="hidden md:block font-medium">Admin</span>
//             <div className="w-8 h-8 bg-[#4A90E2] rounded-full flex items-center justify-center text-white">
//               <button onClick={handleLogout}> <User size={16} /> </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
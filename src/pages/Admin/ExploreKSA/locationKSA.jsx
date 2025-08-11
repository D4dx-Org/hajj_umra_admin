import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';

const LocationKSA = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({ id: '', title: '', title_malayalam: '', title_urdu: '' });
  const [originalData, setOriginalData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Define the table columns
  const locationColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (row) => {
        return row.id;
      }
    },
    {
      key: 'title',
      title: 'Title',
      render: (row) => {
        return (
          <div className="space-y-1">
            <div className="font-medium">{row.title}</div>
            {row.title_malayalam && (
              <div className="text-sm text-gray-600">
                <span className="text-xs bg-green-100 text-green-800 px-1 rounded">ML:</span> {row.title_malayalam}
              </div>
            )}
            {row.title_urdu && (
              <div className="text-sm text-gray-600">
                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">UR:</span> {row.title_urdu}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Fetch data from API using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`);
        setLocationData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching location data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  

  // Filter data based on search input
  const filteredLocationData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();

    if (!lowerCaseSearch) return locationData;

    return locationData.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerCaseSearch) ||
        item.title_malayalam?.toLowerCase().includes(lowerCaseSearch) ||
        item.title_urdu?.toLowerCase().includes(lowerCaseSearch) ||
        item.id.toString().toLowerCase().includes(lowerCaseSearch)
    );
  }, [locationData, searchTerm]);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setLocationData(locationData.map(item =>
      item._id === id ? { ...item, [field]: value } : item
    ));
  };

  // Handle Save Edit
  const handleSaveEdit = async (row) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL_V2}/locations/${row._id}`,
        { 
          id: row.id, 
          title: row.title,
          title_malayalam: row.title_malayalam || '',
          title_urdu: row.title_urdu || ''
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLocationData(locationData.map(item =>
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating location data:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (row) => {
    setDeleteConfirm({ show: true, id: row._id, customId: row.id });
  };

  // Add handleDeleteConfirm
  const handleDeleteConfirm = async () => {
    const mongoId = deleteConfirm.id;
    if (!mongoId) {
      console.error("Error: MongoDB ID is undefined");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      await axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/locations/${mongoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocationData(locationData.filter(item => item._id !== mongoId));
      setDeleteConfirm({ show: false, id: null, customId: null });
      console.log('Location deleted successfully');
    } catch (error) {
      console.error('Error deleting location data:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  // Add handleDeleteCancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null, customId: null });
  };

  // Handle Add New Location
  const handleAddLocation = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/locations`,
        newLocation,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`);
        setLocationData(updatedResponse.data);
        setNewLocation({ id: '', title: '', title_malayalam: '', title_urdu: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding location data:", error);
    }
  };

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row); // Store original data
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    // Restore original data
    setLocationData(locationData.map(item =>
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} className="hidden md:block w-64" />
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
        className="md:px-6 px-4"
      />

      <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <h1 className="text-2xl font-bold">Location Management</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md"
          >
            {showAddForm ? 'Cancel' : 'Add More'}
          </button>
        </div>

        {/* New Location Form - Only shown when showAddForm is true */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">ID</label>
                <input
                  type="text"
                  value={newLocation.id}
                  onChange={(e) => setNewLocation({ ...newLocation, id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter unique ID"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Title (English)</label>
                <input
                  type="text"
                  value={newLocation.title}
                  onChange={(e) => setNewLocation({ ...newLocation, title: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter title in English"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Title (Malayalam)</label>
                <input
                  type="text"
                  value={newLocation.title_malayalam}
                  onChange={(e) => setNewLocation({ ...newLocation, title_malayalam: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter title in Malayalam"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Title (Urdu)</label>
                <input
                  type="text"
                  value={newLocation.title_urdu}
                  onChange={(e) => setNewLocation({ ...newLocation, title_urdu: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter title in Urdu"
                />
              </div>
            </div>
            <button
              onClick={handleAddLocation}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Location
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredLocationData.length === 0 ? (
          <p className="text-center">No items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {locationColumns.map((column) => (
                    <th key={column.key} className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocationData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr className={`${editingId === row._id ? 'bg-blue-50' : ''}`}>
                      {locationColumns.map((column) => (
                        <td key={`${row._id}-${column.key}`} className="px-4 py-1 whitespace-nowrap">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={locationColumns.length} className="p-0">
                          <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-lg font-semibold text-gray-900">Edit Location</h3>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleSaveEdit(row)}
                                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Basic Information</h4>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.id || ""}
                                    onChange={(e) => handleEditChange(row._id, 'id', e.target.value)}
                                    placeholder="Enter unique ID"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title (English) *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.title || ""}
                                    onChange={(e) => handleEditChange(row._id, 'title', e.target.value)}
                                    placeholder="Enter title in English"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Translations */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Translations</h4>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.title_malayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'title_malayalam', e.target.value)}
                                    placeholder="Enter title in Malayalam"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.title_urdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'title_urdu', e.target.value)}
                                    placeholder="Enter title in Urdu"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this location? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationKSA;
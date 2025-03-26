import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import TableComponent from '../../components/TableComponent';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { read, utils } from 'xlsx';
import Select from 'react-select';
import ambulanceCategories from '../../data/ambulanceCategories.json';

const Ambulance = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // Track which row is being edited
  const [showAddForm, setShowAddForm] = useState(false); // Control add form visibility
  const [locations, setLocations] = useState([]); // New state for locations
  const [newAmbulance, setNewAmbulance] = useState({ 
    category: '', 
    center: '', 
    poll: '', 
    location: { lat: '', lng: '' },
    ref: '' // Added ref field
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#4A90E2' : state.isFocused ? '#E3F2FD' : 'white',
      color: state.isSelected ? 'white' : '#333',
      padding: '8px 12px',
    }),
    control: (provided) => ({
      ...provided,
      borderColor: '#E5E7EB',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#4A90E2'
      }
    })
  };

  // Define the table columns with editable configuration
  const ambulanceColumns = [
    { 
      key: 'category', 
      title: 'Category',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <Select
              value={ambulanceCategories.categories.find(cat => cat.value === row.category)}
              onChange={(selected) => handleEditChange(row._id, 'category', selected.value)}
              options={ambulanceCategories.categories}
              styles={customStyles}
              className="w-full"
              isSearchable
              placeholder="Select category..."
            />
          );
        }
        const category = ambulanceCategories.categories.find(cat => cat.value === row.category);
        return category ? category.label : row.category;
      }
    },
    { 
      key: 'center', 
      title: 'Center',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.center}
              onChange={(e) => handleEditChange(row._id, 'center', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return row.center;
      }
    },
    { 
      key: 'poll', 
      title: 'Poll',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.poll}
              onChange={(e) => handleEditChange(row._id, 'poll', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return row.poll;
      }
    },
    { 
      key: 'location', 
      title: 'Location',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <div className="flex gap-2">
              <input
                type="number"
                value={row.location?.lat || ''}
                onChange={(e) => handleEditChange(row._id, 'location', { ...row.location, lat: e.target.value })}
                placeholder="Latitude"
                className="w-1/2 p-1 border rounded"
              />
              <input
                type="number"
                value={row.location?.lng || ''}
                onChange={(e) => handleEditChange(row._id, 'location', { ...row.location, lng: e.target.value })}
                placeholder="Longitude"
                className="w-1/2 p-1 border rounded"
              />
            </div>
          );
        }
        return row.location ? `${row.location.lat}, ${row.location.lng}` : 'N/A';
      }
    },
    { 
      key: 'ref', 
      title: 'Location Reference',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <select
              value={row.ref?._id || row.ref || ''}
              onChange={(e) => handleEditChange(row._id, 'ref', e.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          );
        }
        // Handle both populated and unpopulated cases
        const locationName = row.ref?.name || locations.find(loc => loc._id === row.ref)?.name || 'N/A';
        return locationName;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {editingId === row._id ? (
            <>
              <button
                onClick={() => handleSaveEdit(row)}
                className="bg-green-500 text-white px-2 py-1 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleEditClick(row)}
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(row._id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/ambulance`);
        console.log('Fetched ambulance data:', response.data); // Add logging
        setAmbulanceData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ambulance data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add this new useEffect to fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/location`);
        setLocations(response.data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setAmbulanceData(ambulanceData.map(item => {
      if (item._id === id) {
        if (field === 'location') {
          return { ...item, location: value };
        }
        if (field === 'ref') {
          // When changing ref, update both the ID and the populated data
          const selectedLocation = locations.find(loc => loc._id === value);
          return { 
            ...item, 
            ref: selectedLocation ? { 
              _id: selectedLocation._id,
              name: selectedLocation.name 
            } : value 
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Handle Save Edit
  const handleSaveEdit = async (row) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      console.log('Sending data:', row); // Add logging

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/ambulance/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response data:', response.data); // Add logging

      setAmbulanceData(ambulanceData.map(item => 
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating ambulance data:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.id;
    if (!id) {
      console.error("Error: ID is undefined");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/ambulance/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAmbulanceData(ambulanceData.filter(item => item._id !== id));
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting ambulance data:', error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Ambulance
  const handleAddAmbulance = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      console.log('Sending new ambulance data:', newAmbulance); // Add logging

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ambulance`,
        newAmbulance,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response data:', response.data); // Add logging

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/ambulance`);
        setAmbulanceData(updatedResponse.data);
        setNewAmbulance({ 
          category: '', 
          center: '', 
          poll: '', 
          location: { lat: '', lng: '' },
          ref: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding ambulance data:", error);
    }
  };

  // Filter data based on search
  const filteredAmbulanceData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return ambulanceData;
    return ambulanceData.filter((item) => {
      const locationName = item.ref?.name || locations.find(loc => loc._id === item.ref)?.name || '';
      return (
        (item.category && item.category.toLowerCase().includes(lowerCaseSearch)) ||
        (item.center && item.center.toLowerCase().includes(lowerCaseSearch)) ||
        (locationName.toLowerCase().includes(lowerCaseSearch))
      );
    });
  }, [ambulanceData, searchTerm, locations]);

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row); // Store original data
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    // Restore original data
    setAmbulanceData(ambulanceData.map(item => 
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setUploadError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = utils.sheet_to_json(worksheet);

          // Validate the data structure
          const validCategories = ambulanceCategories.categories.map(cat => cat.value);
          const isValid = data.every(row => {
            const hasRequiredFields = row.category && row.center && row.poll;
            const hasValidCategory = validCategories.includes(row.category);
            const hasValidCoordinates = !row.latitude || !row.longitude || 
              (typeof Number(row.latitude) === 'number' && !isNaN(Number(row.latitude)) &&
               typeof Number(row.longitude) === 'number' && !isNaN(Number(row.longitude)));
            
            if (!hasValidCategory) {
              setUploadError(`Invalid category: ${row.category}. Must be one of: ${validCategories.join(', ')}`);
              return false;
            }
            
            return hasRequiredFields && hasValidCategory && hasValidCoordinates;
          });

          if (!isValid) {
            if (!uploadError) {
              setUploadError('Invalid data format. Please ensure all required fields (category, center, poll) are present and coordinates are valid numbers.');
            }
            return;
          }

          const formData = new FormData();
          formData.append('file', file);

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/ambulance/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          setUploadSuccess(`Successfully uploaded ${response.data.count} ambulances`);
          setUploadError(null);

          // Refresh the data
          const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/ambulance`);
          setAmbulanceData(updatedResponse.data);
        } catch (error) {
          setUploadError(error.response?.data?.message || 'Error uploading file');
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setUploadError('Error processing file');
      setUploadSuccess(null);
    }
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
          <h1 className="text-2xl font-bold">Ambulance Management</h1>
          <div className="flex gap-4">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600"
            >
              Upload Excel
            </label>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600"
            >
              {showAddForm ? 'Cancel' : 'Add More'}
            </button>
          </div>
        </div>

        {/* Add error and success messages */}
        {uploadError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {uploadSuccess}
          </div>
        )}

        {/* New Ambulance Form - Only shown when showAddForm is true */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Ambulance</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Category</label>
              <Select
                value={ambulanceCategories.categories.find(cat => cat.value === newAmbulance.category)}
                onChange={(selected) => setNewAmbulance({ ...newAmbulance, category: selected.value })}
                options={ambulanceCategories.categories}
                styles={customStyles}
                className="mt-1"
                isSearchable
                placeholder="Select category..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Center</label>
              <input
                type="text"
                value={newAmbulance.center}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, center: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll</label>
              <input
                type="text"
                value={newAmbulance.poll}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, poll: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location</label>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">Latitude</label>
                  <input
                    type="number"
                    value={newAmbulance.location.lat}
                    onChange={(e) => setNewAmbulance({
                      ...newAmbulance,
                      location: { ...newAmbulance.location, lat: e.target.value }
                    })}
                    placeholder="Enter latitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">Longitude</label>
                  <input
                    type="number"
                    value={newAmbulance.location.lng}
                    onChange={(e) => setNewAmbulance({
                      ...newAmbulance,
                      location: { ...newAmbulance.location, lng: e.target.value }
                    })}
                    placeholder="Enter longitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location Reference</label>
              <select
                value={newAmbulance.ref}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, ref: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddAmbulance}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Ambulance
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ambulances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this ambulance? This action cannot be undone.
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

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredAmbulanceData.length === 0 ? (
          <p className="text-center">No items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {ambulanceColumns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAmbulanceData.map((row) => (
                  <tr key={row._id}>
                    {ambulanceColumns.map((column) => (
                      <td key={`${row._id}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ambulance;

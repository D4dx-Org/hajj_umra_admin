import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download } from 'lucide-react';
import TableComponent from '../../components/TableComponent';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';
import AsyncSelect from 'react-select/async';
import { countries } from 'countries-list';

const Camp = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [campData, setCampData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false); // State to control edit mode
  const [locations, setLocations] = useState([]); // New state for locations
  const [selectedRows, setSelectedRows] = useState([]);
  const [newCamp, setNewCamp] = useState({ 
    maktab: '', 
    zone: '', 
    country: '', 
    poll: '', 
    location: { lat: '', lng: '' },
    ref: '' // Added ref field
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Convert countries object to array format for react-select
  const countryOptions = useMemo(() => {
    return Object.entries(countries).map(([code, country]) => ({
      value: country.name,
      label: `${country.name} (${code})`,
      emoji: country.emoji
    }));
  }, []);

  // Filter countries based on input
  const loadCountryOptions = (inputValue) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          countryOptions.filter((option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          )
        );
      }, 100);
    });
  };

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
    }),
    singleValue: (provided) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    })
  };

  // Custom Option component for react-select
  const CustomOption = ({ data, ...props }) => (
    <div {...props.innerProps} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{data.emoji}</span>
      <span>{data.label}</span>
    </div>
  );

  // Custom SingleValue component for react-select
  const CustomSingleValue = ({ data }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{data.emoji}</span>
      <span>{data.label}</span>
    </div>
  );

  // Define the table columns
  const campColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === campData.length}
          onChange={(e) => handleSelectAll(e)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(e) => handleSelectRow(row._id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    { 
      key: 'maktab', 
      title: 'Maktab',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.maktab}
              onChange={(e) => handleEditChange(row._id, 'maktab', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return row.maktab;
      }
    },
    { 
      key: 'zone', 
      title: 'Zone',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.zone}
              onChange={(e) => handleEditChange(row._id, 'zone', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return row.zone;
      }
    },
    { 
      key: 'country', 
      title: 'Country',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <AsyncSelect
              cacheOptions
              defaultOptions={countryOptions}
              loadOptions={loadCountryOptions}
              value={countryOptions.find(option => option.value === row.country)}
              onChange={(selected) => handleEditChange(row._id, 'country', selected.value)}
              styles={customStyles}
              components={{
                Option: CustomOption,
                SingleValue: CustomSingleValue
              }}
              className="w-full"
            />
          );
        }
        const countryOption = countryOptions.find(option => option.value === row.country);
        return countryOption ? (
          <div className="flex items-center gap-2">
            <span>{countryOption.emoji}</span>
            <span>{countryOption.value}</span>
          </div>
        ) : row.country;
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

  // Fetch data from API using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/camp`);
        setCampData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching camp data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add useEffect to fetch locations
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

  // Filter data based on search input
  const filteredCampData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return campData;
    return campData.filter((item) => {
      const locationName = item.ref?.name || locations.find(loc => loc._id === item.ref)?.name || '';
      return (
        item.maktab.toLowerCase().includes(lowerCaseSearch) ||
        item.zone.toLowerCase().includes(lowerCaseSearch) ||
        item.country.toLowerCase().includes(lowerCaseSearch) ||
        item.poll.toLowerCase().includes(lowerCaseSearch) ||
        locationName.toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [campData, searchTerm, locations]);

  // Handle Edit
  const handleEditChange = (id, field, value) => {
    setCampData(campData.map(item => {
      if (item._id === id) {
        if (field === 'location') {
          return { ...item, location: value };
        }
        if (field === 'ref') {
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
      const token = localStorage.getItem("token"); // Retrieve token from localStorage

      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/camp/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in headers
          },
        }
      );

      setCampData(campData.map(item => 
        item._id === row._id ? { ...item, ...response.data } : item
      ));

      setEditingId(null);
    } catch (error) {
      console.error("Error updating building data:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Add handleDeleteConfirm
  const handleDeleteConfirm = async () => {
    const ids = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      // Delete all selected items
      await Promise.all(ids.map(id => 
        axios.delete(`${import.meta.env.VITE_BACKEND_URL}/camp/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setCampData(campData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting camp data:', error);
    }
  };

  // Add handleDeleteCancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Camp
  const handleAddCamp = async () => {
    try {
      const token = localStorage.getItem("token"); // Ensure authentication

      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/camp`,
        newCamp,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in headers
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/camp`);
        setCampData(updatedResponse.data);
        setNewCamp({ 
          maktab: '', 
          zone: '', 
          country: '', 
          poll: '', 
          location: { lat: '', lng: '' },
          ref: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding building data:", error);
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
    setCampData(campData.map(item => 
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

      // First, validate the file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setUploadError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      // Read the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Preview the data
          const workbook = read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = utils.sheet_to_json(worksheet);

          // Validate the data structure
          const isValid = data.every(row => {
            const hasRequiredFields = row.maktab && row.zone && row.country && row.poll;
            const hasValidCoordinates = !row.latitude || !row.longitude || 
              (typeof Number(row.latitude) === 'number' && !isNaN(Number(row.latitude)) &&
               typeof Number(row.longitude) === 'number' && !isNaN(Number(row.longitude)));
            return hasRequiredFields && hasValidCoordinates;
          });

          if (!isValid) {
            setUploadError('Invalid data format. Please ensure all required fields (maktab, zone, country, poll) are present and coordinates are valid numbers if provided.');
            return;
          }

          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', file);

          // Upload to server
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/camp/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          // Update the UI
          setUploadSuccess(`Successfully uploaded ${response.data.count} camps`);
          setUploadError(null);

          // Refresh the data
          const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/camp`);
          setCampData(updatedResponse.data);
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

  // Add download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          maktab: 'Sample Maktab',
          zone: 'Zone A',
          country: 'Saudi Arabia',
          poll: 'Poll 1',
          latitude: '21.4225',
          longitude: '39.8262',
          location_name: 'Sample Location Name'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);
      
      // Add headers with comments
      utils.sheet_add_aoa(ws, [[
        'maktab',
        'zone',
        'country',
        'poll',
        'latitude',
        'longitude',
        'location_name'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 20 }, // maktab
        { wch: 15 }, // zone
        { wch: 20 }, // country
        { wch: 15 }, // poll
        { wch: 12 }, // latitude
        { wch: 12 }, // longitude
        { wch: 30 }  // location_name
      ];

      // Create workbook
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Template');

      // Generate Excel file
      write(wb, { 
        bookType: 'xlsx',
        type: 'array'
      });

      // Convert to blob and download
      const blob = new Blob(
        [write(wb, { bookType: 'xlsx', type: 'array' })], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'camp_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
  };

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredCampData.map(row => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Add handleSelectRow function
  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Add handleBulkDelete function
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setDeleteConfirm({ 
      show: true, 
      id: selectedRows,
      isBulk: true 
    });
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
          <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Camp Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredCampData.length} camps
            </div>
          </div>
          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600"
              >
                Delete Selected ({selectedRows.length})
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600"
            >
              <Download size={20} />
              Download Template
            </button>
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

        {/* New Building Form - Only shown when showAddForm is true */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Camp</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Maktab</label>
              <input
                type="text"
                value={newCamp.maktab}
                onChange={(e) => setNewCamp({ ...newCamp, maktab: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Zone</label>
              <input
                type="text"
                value={newCamp.zone}
                onChange={(e) => setNewCamp({ ...newCamp, zone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Country</label>
              <AsyncSelect
                cacheOptions
                defaultOptions={countryOptions}
                loadOptions={loadCountryOptions}
                value={countryOptions.find(option => option.value === newCamp.country)}
                onChange={(selected) => setNewCamp({ ...newCamp, country: selected.value })}
                styles={customStyles}
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue
                }}
                className="mt-1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll</label>
              <input
                type="text"
                value={newCamp.poll}
                onChange={(e) => setNewCamp({ ...newCamp, poll: e.target.value })}
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
                    value={newCamp.location.lat}
                    onChange={(e) => setNewCamp({
                      ...newCamp,
                      location: { ...newCamp.location, lat: e.target.value }
                    })}
                    placeholder="Enter latitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">Longitude</label>
                  <input
                    type="number"
                    value={newCamp.location.lng}
                    onChange={(e) => setNewCamp({
                      ...newCamp,
                      location: { ...newCamp.location, lng: e.target.value }
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
                value={newCamp.ref}
                onChange={(e) => setNewCamp({ ...newCamp, ref: e.target.value })}
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
              onClick={handleAddCamp}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Camp
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search camps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredCampData.length === 0 ? (
          <p className="text-center">No items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {campColumns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampData.map((row) => (
                  <tr key={row._id}>
                    {campColumns.map((column) => (
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

        {/* Add Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id) 
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected camps? This action cannot be undone.`
                  : 'Are you sure you want to delete this camp? This action cannot be undone.'}
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

export default Camp;

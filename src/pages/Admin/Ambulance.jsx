import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';
import Select from 'react-select';
import ambulanceCategories from '../../data/ambulanceCategories.json';

const Ambulance = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // Track which row is being edited
  const [showAddForm, setShowAddForm] = useState(false); // Control add form visibility
  const [branches, setBranches] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newAmbulance, setNewAmbulance] = useState({ 
    category: '', 
    center: '', 
    poll: '', 
    location: { lat: '', lng: '' },
    ref: ''
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
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === ambulanceData.length}
          onChange={(event) => handleSelectAll(event)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(event) => handleSelectRow(row._id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
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
      title: 'Branch Reference',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <select
              value={row.ref?._id || row.ref || ''}
              onChange={(e) => handleEditChange(row._id, 'ref', e.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          );
        }
        return row.ref?.name || 'N/A';
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

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/branch`);
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
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
          const selectedBranch = branches.find(branch => branch._id === value);
          return { 
            ...item, 
            ref: selectedBranch ? { 
              _id: selectedBranch._id,
              name: selectedBranch.name 
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
    const ids = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      // Delete all selected items
      await Promise.all(ids.map(id => 
        axios.delete(`${import.meta.env.VITE_BACKEND_URL}/ambulance/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setAmbulanceData(ambulanceData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
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
      const branchName = item.ref?.name || branches.find(branch => branch._id === item.ref)?.name || '';
      return (
        (item.category && item.category.toLowerCase().includes(lowerCaseSearch)) ||
        (item.center && item.center.toLowerCase().includes(lowerCaseSearch)) ||
        (branchName.toLowerCase().includes(lowerCaseSearch))
      );
    });
  }, [ambulanceData, searchTerm, branches]);

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

          console.log('Parsed Excel data:', data); // Debug log

          if (data.length === 0) {
            setUploadError('The Excel file is empty. Please add some data.');
            return;
          }

          // Check the first row to understand the column structure
          const firstRow = data[0];
          const hasRequiredColumns = 'category' in firstRow && 'center' in firstRow && 'poll' in firstRow && 'branch_name' in firstRow;
          
          if (!hasRequiredColumns) {
            setUploadError('Excel file must have columns: category, center, poll, and branch_name. Please check your column headers.');
            console.log('Required columns missing. Found columns:', Object.keys(firstRow));
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            if (!row.category || !row.center || !row.poll || !row.branch_name) {
              setUploadError(`Row ${rowNumber}: Missing required data. Each row must have category, center, poll, and branch_name.`);
              return;
            }

            if (!ambulanceCategories.categories.some(cat => cat.value === row.category)) {
              setUploadError(`Row ${rowNumber}: Invalid category "${row.category}". Must be one of: ${ambulanceCategories.categories.map(cat => cat.value).join(', ')}`);
              return;
            }

            // Validate coordinates if present
            if (row.latitude !== undefined || row.longitude !== undefined) {
              const lat = Number(row.latitude);
              const lng = Number(row.longitude);
              
              if (isNaN(lat) || lat < -90 || lat > 90) {
                setUploadError(`Row ${rowNumber}: Invalid latitude. Must be a number between -90 and 90`);
                return;
              }
              if (isNaN(lng) || lng < -180 || lng > 180) {
                setUploadError(`Row ${rowNumber}: Invalid longitude. Must be a number between -180 and 180`);
                return;
              }
            }

            // Validate branch_name
            if (row.branch_name && branches.length > 0) {
              const branchExists = branches.some(branch => branch.name === row.branch_name);
              if (!branchExists) {
                setUploadError(`Row ${rowNumber}: Invalid branch name "${row.branch_name}". Please use a valid branch name.`);
                return;
              }
            }
          }

          const formData = new FormData();
          formData.append('file', file);

          const token = localStorage.getItem("token");
          if (!token) {
            setUploadError('Authentication token not found. Please log in again.');
            return;
          }

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
          
          // Reset the file input
          event.target.value = '';
        } catch (error) {
          console.error('Excel processing error:', error);
          setUploadError(error.response?.data?.message || 'Error processing the Excel file. Please check the file format.');
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Error processing file. Please try again.');
      setUploadSuccess(null);
    }
  };

  // Add download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          category: 'type1',
          center: 'Sample Center',
          poll: 'Sample Poll',
          latitude: '21.4225',
          longitude: '39.8262',
          branch_name: 'Sample Branch Name'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);
      
      // Add headers with comments
      utils.sheet_add_aoa(ws, [[
        'category',
        'center',
        'poll',
        'latitude',
        'longitude',
        'branch_name'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 15 }, // category
        { wch: 20 }, // center
        { wch: 15 }, // poll
        { wch: 12 }, // latitude
        { wch: 12 }, // longitude
        { wch: 30 }  // branch_name
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
      link.download = 'ambulance_upload_template.xlsx';
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
      setSelectedRows(filteredAmbulanceData.map(row => row._id));
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
  const handleBulkDelete = async () => {
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
            <h1 className="text-2xl font-bold">Ambulance Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredAmbulanceData.length} ambulances
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
              {showAddForm ? 'Cancel' : 'Add Ambulance'}
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

        {/* New Ambulance Form */}
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
              <label className="block text-sm font-medium">Branch Reference</label>
              <select
                value={newAmbulance.ref}
                onChange={(e) => setNewAmbulance({ ...newAmbulance, ref: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
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
                {Array.isArray(deleteConfirm.id)
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected ambulances? This action cannot be undone.`
                  : 'Are you sure you want to delete this ambulance? This action cannot be undone.'}
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
          <p className="text-center">No ambulances found</p>
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

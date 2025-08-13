import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';

const UmrahBuilding = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [buildingData, setBuildingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    malayalamName: '',
    urduName: '',
    location: { lat: '', lng: '' },
    phone: '',
    branchRef: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc', type: 'alpha' });

  // Define the table columns
  const buildingColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === buildingData.length && buildingData.length > 0}
          onChange={(event) => handleSelectAll(event)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={() => handleSelectRow(row._id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    { 
      key: 'name', 
      title: 'Name',
      render: (row) => <span className="truncate" title={row.name}>{row.name}</span>
    },
    { 
      key: 'malayalamName', 
      title: 'Malayalam Name',
      render: (row) => <span className="truncate" title={row.malayalamName || '-'}>{row.malayalamName || '-'}</span>
    },
    { 
      key: 'urduName', 
      title: 'Urdu Name',
      render: (row) => <span className="truncate" title={row.urduName || '-'}>{row.urduName || '-'}</span>
    },
    { 
      key: 'phone', 
      title: 'Phone',
      render: (row) => <span className="truncate" title={row.phone || 'N/A'}>{row.phone || 'N/A'}</span>
    },
    { 
      key: 'location', 
      title: 'Location',
      render: (row) => {
        const locationText = row.location ? `${row.location.lat}, ${row.location.lng}` : 'N/A';
        return <span className="truncate" title={locationText}>{locationText}</span>;
      }
    },
    { 
      key: 'branchRef', 
      title: 'Branch',
      render: (row) => {
        const branchName = row.branchRef?.name || 'N/A';
        return <span className="truncate" title={branchName}>{branchName}</span>;
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
            onClick={() => handleDelete(row._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Sorting options
  const sortOptions = [
    { value: 'name-alpha-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc', type: 'alpha' },
    { value: 'name-alpha-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc', type: 'alpha' },
    { value: 'malayalamName-alpha-asc', label: 'Malayalam Name (A-Z)', field: 'malayalamName', direction: 'asc', type: 'alpha' },
    { value: 'malayalamName-alpha-desc', label: 'Malayalam Name (Z-A)', field: 'malayalamName', direction: 'desc', type: 'alpha' },
    { value: 'urduName-alpha-asc', label: 'Urdu Name (A-Z)', field: 'urduName', direction: 'asc', type: 'alpha' },
    { value: 'urduName-alpha-desc', label: 'Urdu Name (Z-A)', field: 'urduName', direction: 'desc', type: 'alpha' },
    { value: 'phone-alpha-asc', label: 'Phone (A-Z)', field: 'phone', direction: 'asc', type: 'alpha' },
    { value: 'phone-alpha-desc', label: 'Phone (Z-A)', field: 'phone', direction: 'desc', type: 'alpha' },
    { value: 'branchRef-alpha-asc', label: 'Branch (A-Z)', field: 'branchRef', direction: 'asc', type: 'alpha' },
    { value: 'branchRef-alpha-desc', label: 'Branch (Z-A)', field: 'branchRef', direction: 'desc', type: 'alpha' }
  ];

  // Fetch buildings data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah`);
        setBuildingData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching umrah building data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch branches data
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah`);
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setBuildingData(buildingData.map(item => {
      if (item._id === id) {
        if (field === 'location') {
          return { ...item, location: value };
        }
        if (field === 'branchRef') {
          const selectedBranch = branches.find(branch => branch._id === value);
          return { 
            ...item, 
            branchRef: selectedBranch ? { 
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

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBuildingData(buildingData.map(item => 
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah building data:", error);
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

      await Promise.all(ids.map(id => 
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setBuildingData(buildingData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting umrah building data:', error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Building
  const handleAddBuilding = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah`,
        newBuilding,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah`);
        setBuildingData(updatedResponse.data);
        setNewBuilding({ 
          name: '',
          malayalamName: '',
          urduName: '',
          location: { lat: '', lng: '' },
          phone: '',
          branchRef: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah building data:", error);
    }
  };

  // Handle sort change
  const handleSortChange = (event) => {
    const selectedOption = sortOptions.find(option => option.value === event.target.value);
    if (selectedOption) {
      setSortConfig({
        field: selectedOption.field,
        direction: selectedOption.direction,
        type: selectedOption.type
      });
    }
  };

  // Sort function
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = sortConfig.field === 'branchRef' ? a[sortConfig.field]?.name || '' : a[sortConfig.field] || '';
      let bValue = sortConfig.field === 'branchRef' ? b[sortConfig.field]?.name || '' : b[sortConfig.field] || '';
      
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Filtered and sorted data
  const filteredBuildingData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = buildingData;
    
    if (lowerCaseSearch) {
      filtered = buildingData.filter((item) => {
        const branchName = item.branchRef?.name || '';
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamName && item.malayalamName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduName && item.urduName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.phone && item.phone.toLowerCase().includes(lowerCaseSearch)) ||
          branchName.toLowerCase().includes(lowerCaseSearch)
        );
      });
    }
    
    return sortData(filtered);
  }, [buildingData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setBuildingData(buildingData.map(item => 
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          name: 'Sample Building',
          malayalam_name: 'സാമ്പിൾ കെട്ടിടം',
          urdu_name: 'نمونہ عمارت',
          branch_name: 'Sample Branch',
          phone: '+966123456789',
          latitude: '21.4225',
          longitude: '39.8262'
        }
      ];

      const ws = utils.json_to_sheet([]);
      
      utils.sheet_add_aoa(ws, [[
        'name',
        'malayalam_name',
        'urdu_name',
        'branch_name',
        'phone',
        'latitude',
        'longitude'
      ]], { origin: 'A1' });

      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      ws['!cols'] = [
        { wch: 25 }, // name
        { wch: 25 }, // malayalam_name
        { wch: 25 }, // urdu_name
        { wch: 20 }, // branch_name
        { wch: 20 }, // phone
        { wch: 15 }, // latitude
        { wch: 15 }  // longitude
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Template');

      const blob = new Blob(
        [write(wb, { bookType: 'xlsx', type: 'array' })], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'umrah_building_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
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

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem("token");
      if (!token) {
        setUploadError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadSuccess(`Successfully uploaded ${response.data.count} buildings`);
      setUploadError(null);

      // Refresh the data
      const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/building-umrah`);
      setBuildingData(updatedResponse.data);
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error.response?.data?.message || 'Error processing file. Please try again.');
      setUploadSuccess(null);
    }
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredBuildingData.map(row => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select row
  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    setDeleteConfirm({ 
      show: true, 
      id: selectedRows,
      isBulk: true 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Umrah Building Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredBuildingData.length} buildings
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
              {showAddForm ? 'Cancel' : 'Add Building'}
            </button>
          </div>
        </div>

        {/* Error and success messages */}
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

        {/* New Building Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah Building</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newBuilding.name}
                  onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Malayalam Name</label>
                <input
                  type="text"
                  value={newBuilding.malayalamName}
                  onChange={(e) => setNewBuilding({ ...newBuilding, malayalamName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മലയാളം പേര്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Name</label>
                <input
                  type="text"
                  value={newBuilding.urduName}
                  onChange={(e) => setNewBuilding({ ...newBuilding, urduName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="اردو نام"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Branch *</label>
                <select
                  value={newBuilding.branchRef}
                  onChange={(e) => setNewBuilding({ ...newBuilding, branchRef: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Phone</label>
                <input
                  type="text"
                  value={newBuilding.phone}
                  onChange={(e) => setNewBuilding({ ...newBuilding, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Location (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newBuilding.location.lat}
                    onChange={(e) => setNewBuilding({
                      ...newBuilding,
                      location: { ...newBuilding.location, lat: e.target.value }
                    })}
                    placeholder="Latitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    value={newBuilding.location.lng}
                    onChange={(e) => setNewBuilding({
                      ...newBuilding,
                      location: { ...newBuilding.location, lng: e.target.value }
                    })}
                    placeholder="Longitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAddBuilding}
              disabled={!newBuilding.name || !newBuilding.branchRef}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Building
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search buildings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              />
              <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={20} className="text-gray-400" />
              <select
                onChange={handleSortChange}
                value={`${sortConfig.field}-${sortConfig.type}-${sortConfig.direction}`}
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  {buildingColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === 'select' ? 'w-12' :
                        column.key === 'name' ? 'w-24' :
                        column.key === 'malayalamName' ? 'w-24' :
                        column.key === 'urduName' ? 'w-24' :
                        column.key === 'phone' ? 'w-20' :
                        column.key === 'location' ? 'w-28' :
                        column.key === 'branchRef' ? 'w-24' :
                        column.key === 'actions' ? 'w-20' : ''
                      }`}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuildingData.length === 0 ? (
                  <tr>
                    <td colSpan={buildingColumns.length} className="px-2 py-2 text-center text-gray-500">
                      No buildings found
                    </td>
                  </tr>
                ) : (
                  filteredBuildingData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr className={`hover:bg-gray-50 ${editingId === row._id ? 'bg-blue-50' : ''}`}>
                        {buildingColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-2 py-2 text-sm text-gray-900 ${
                              column.key === 'name' ? 'max-w-24 truncate' :
                              column.key === 'malayalamName' ? 'max-w-24 truncate' :
                              column.key === 'urduName' ? 'max-w-24 truncate' :
                              column.key === 'phone' ? 'max-w-20 truncate' :
                              column.key === 'location' ? 'max-w-28 truncate' :
                              column.key === 'branchRef' ? 'max-w-24 truncate' :
                              column.key === 'actions' ? 'whitespace-nowrap' : 'whitespace-nowrap'
                            }`}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                      {editingId === row._id && (
                        <tr>
                          <td colSpan={buildingColumns.length} className="p-4">
                            <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                              <h2 className="text-lg font-bold mb-4">Edit Building</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">Name *</label>
                                  <input
                                    type="text"
                                    value={row.name || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "name", e.target.value)
                                    }
                                    placeholder="Building name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Malayalam Name</label>
                                  <input
                                    type="text"
                                    value={row.malayalamName || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "malayalamName", e.target.value)
                                    }
                                    placeholder="മലയാളം പേര്"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Urdu Name</label>
                                  <input
                                    type="text"
                                    value={row.urduName || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "urduName", e.target.value)
                                    }
                                    placeholder="اردو نام"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Phone</label>
                                  <input
                                    type="text"
                                    value={row.phone || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "phone", e.target.value)
                                    }
                                    placeholder="Phone number"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Branch *</label>
                                  <select
                                    value={row.branchRef?._id || row.branchRef || ""}
                                    onChange={(e) => handleEditChange(row._id, "branchRef", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  >
                                    <option value="">Select Branch</option>
                                    {branches.map(branch => (
                                      <option key={branch._id} value={branch._id}>
                                        {branch.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">Latitude</label>
                                  <input
                                    type="number"
                                    value={row.location?.lat || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "location", {
                                        ...row.location,
                                        lat: e.target.value,
                                      })
                                    }
                                    placeholder="Latitude"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Longitude</label>
                                  <input
                                    type="number"
                                    value={row.location?.lng || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "location", {
                                        ...row.location,
                                        lng: e.target.value,
                                      })
                                    }
                                    placeholder="Longitude"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleSaveEdit(row)}
                                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <h3 className="text-lg font-semibold">Confirm Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id) 
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected buildings?`
                  : 'Are you sure you want to delete this building?'
                } This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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

export default UmrahBuilding;
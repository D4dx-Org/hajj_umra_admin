import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, Upload as UploadIcon, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';
import Select from 'react-select';
import { message, Upload } from 'antd';

const countryCategories = [
  { value: 'South Eastern Asia', label: 'South Eastern Asia' },
  { value: 'Turkey and Muslims of Europe and America', label: 'Turkey and Muslims of Europe and America' },
  { value: 'Arabic Countries', label: 'Arabic Countries' },
  { value: 'Iran', label: 'Iran' },
  { value: 'Non-Arab African Countries', label: 'Non-Arab African Countries' },
  { value: 'Southern Asia', label: 'Southern Asia' }
];

const Countries = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newCountry, setNewCountry] = useState({
    name: '',
    arabicName: '',
    flag: '',
    category: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [viewModal, setViewModal] = useState({ show: false, data: null });
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc', type: 'alpha' });

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

  // Add file upload configuration
  const uploadProps = {
    name: 'flag',
    multiple: false,
    maxCount: 1,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      // Validate file size (5MB to match backend)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent default upload behavior
    }
  };

  // Handle flag upload
  const handleFlagUpload = async (info, countryId = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      const file = info.file.originFileObj || info.file;
      if (!file) {
        message.error("No file selected");
        return;
      }

      const formData = new FormData();
      formData.append('flag', file);

      console.log('Uploading file to DigitalOcean:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      const uploadResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/countries/upload-flag`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!uploadResponse.data.url) {
        throw new Error('No URL returned from server');
      }

      const flagUrl = uploadResponse.data.url;

      if (countryId) {
        // For editing existing country
        handleEditChange(countryId, 'flag', flagUrl);
      } else {
        // For new country
        setNewCountry(prev => ({ ...prev, flag: flagUrl }));
      }

      message.success('Flag uploaded successfully to DigitalOcean CDN');
      setUploadSuccess('File uploaded successfully to DigitalOcean CDN');
      setTimeout(() => setUploadSuccess(null), 3000);
      return flagUrl;
    } catch (error) {
      console.error('Error uploading flag to DigitalOcean:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload flag to DigitalOcean';
      message.error(errorMessage);
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(null), 3000);
      return null;
    }
  };

  // Update the flag column render function
  const flagColumn = {
    key: 'flag',
    title: 'Flag',
    render: (row) => {
      if (editingId === row._id) {
        return (
          <div className="flex items-center gap-2">
            {row.flag && (
              <img
                src={row.flag}
                alt="Flag"
                className="w-8 h-8 object-cover rounded"
              />
            )}
            <Upload
              {...uploadProps}
              onChange={async (info) => {
                if (info.file.status !== 'uploading') {
                  await handleFlagUpload(info, row._id);
                }
              }}
            >
              <button className="px-2 py-1 border rounded hover:bg-gray-50 flex items-center gap-1">
                <UploadIcon size={16} />
                Upload Flag
              </button>
            </Upload>
          </div>
        );
      }
      return row.flag ? (
        <img
          src={row.flag}
          alt="Flag"
          className="w-8 h-8 object-cover rounded"
        />
      ) : 'No flag';
    }
  };

  // Define the table columns
  const countryColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === countryData.length}
          onChange={(event) => handleSelectAll(event)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(event) => handleSelectRow(row._id)}
          onClick={(e) => e.stopPropagation()}
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
      key: 'arabicName',
      title: 'Arabic Name',
      render: (row) => <span className="truncate" title={row.arabicName || 'N/A'}>{row.arabicName || 'N/A'}</span>
    },
    {
      key: 'flag',
      title: 'Flag',
      render: (row) => row.flag ? (
        <img src={row.flag} alt={`${row.name} flag`} className="w-8 h-6 object-cover rounded" />
      ) : 'N/A'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Add sorting options
  const sortOptions = [
    { value: 'name-alpha-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc', type: 'alpha' },
    { value: 'name-alpha-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc', type: 'alpha' },
    { value: 'arabicName-alpha-asc', label: 'Arabic Name (A-Z)', field: 'arabicName', direction: 'asc', type: 'alpha' },
    { value: 'arabicName-alpha-desc', label: 'Arabic Name (Z-A)', field: 'arabicName', direction: 'desc', type: 'alpha' },
    { value: 'category-alpha-asc', label: 'Category (A-Z)', field: 'category', direction: 'asc', type: 'alpha' },
    { value: 'category-alpha-desc', label: 'Category (Z-A)', field: 'category', direction: 'desc', type: 'alpha' }
  ];

  // Add handle sort change
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

  // Add sort function
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.field] || '';
      let bValue = b[sortConfig.field] || '';
      
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/countries`);
        setCountryData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching country data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle edit change
  const handleEditChange = (id, field, value) => {
    setCountryData(countryData.map(item => {
      if (item._id === id) {
        // Create a new object without flagUrl
        const updatedItem = { ...item, [field]: value };
        delete updatedItem.flagUrl;  // Remove flagUrl if it exists
        return updatedItem;
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

      // Create a clean copy of the row data without flagUrl
      const cleanRowData = { ...row };
      delete cleanRowData.flagUrl;  // Remove flagUrl if it exists

      console.log('Attempting to update country with data:', JSON.stringify(cleanRowData, null, 2));

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/countries/${row._id}`,
        cleanRowData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCountryData(countryData.map(item =>
        item._id === row._id ? { ...item, ...response.data.country } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating country data:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });
      // Show error message to user
      message.error(error.response?.data?.message || "Error updating country");
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
        message.error("No token found. Please log in again.");
        return;
      }

      // Show loading message
      message.loading('Deleting country...', 0);

      await Promise.all(ids.map(id =>
        axios.delete(`${import.meta.env.VITE_BACKEND_URL}/countries/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      // Hide loading message and show success
      message.destroy();
      message.success('Country deleted successfully');

      setCountryData(countryData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      // Hide loading message
      message.destroy();
      
      console.error('Error deleting country data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show error message to user
      message.error(error.response?.data?.message || 'Failed to delete country');
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Country
  const handleAddCountry = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/countries`,
        newCountry,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/countries`);
        setCountryData(updatedResponse.data);
        setNewCountry({
          name: '',
          arabicName: '',
          flag: '',
          category: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding country data:", error);
    }
  };

  // Filter data based on search
  const filteredCountryData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = countryData;
    
    if (lowerCaseSearch) {
      filtered = countryData.filter((item) => {
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.arabicName && item.arabicName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.category && item.category.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }
    
    return sortData(filtered);
  }, [countryData, searchTerm, sortConfig]);

  // Handle edit click
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setCountryData(countryData.map(item =>
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredCountryData.map(row => row._id));
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
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setDeleteConfirm({
      show: true,
      id: selectedRows,
      isBulk: true
    });
  };

  // Handle view button click
  const handleViewClick = (row) => {
    setViewModal({ show: true, data: row });
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModal({ show: false, data: null });
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
            <h1 className="text-2xl font-bold">Country Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredCountryData.length} countries
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
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600"
            >
              {showAddForm ? 'Cancel' : 'Add Country'}
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
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

        {/* Add Country Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Country</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newCountry.name}
                  onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter country name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Arabic Name</label>
                <input
                  type="text"
                  value={newCountry.arabicName}
                  onChange={(e) => setNewCountry({ ...newCountry, arabicName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter Arabic name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Flag</label>
                <div className="flex items-center gap-2 mt-1">
                  {newCountry.flag && (
                    <img
                      src={newCountry.flag}
                      alt="Flag Preview"
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <Upload
                    {...uploadProps}
                    showUploadList={false}
                    onChange={async (info) => {
                      if (info.file.status !== 'uploading') {
                        await handleFlagUpload(info);
                      }
                    }}
                  >
                    <button className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center gap-2">
                      <UploadIcon size={18} />
                      Upload to DigitalOcean
                    </button>
                  </Upload>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Category</label>
                <Select
                  value={countryCategories.find(cat => cat.value === newCountry.category)}
                  onChange={(selected) => setNewCountry({ ...newCountry, category: selected.value })}
                  options={countryCategories}
                  styles={customStyles}
                  className="mt-1"
                  isSearchable
                  placeholder="Select category..."
                />
              </div>
            </div>
            <button
              onClick={handleAddCountry}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Country
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search countries..."
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id)
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected countries? This action cannot be undone.`
                  : 'Are you sure you want to delete this country? This action cannot be undone.'}
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

        {/* View Modal */}
        {viewModal.show && viewModal.data && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Country Details</h3>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.name || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arabic Name</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.arabicName || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.category || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flag</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.flag ? (
                        <img 
                          src={viewModal.data.flag} 
                          alt={`${viewModal.data.name} flag`} 
                          className="w-16 h-12 object-cover rounded border"
                        />
                      ) : 'No flag available'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm font-mono">
                      {viewModal.data._id}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseViewModal}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredCountryData.length === 0 ? (
          <p className="text-center">No countries found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {countryColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.key === 'select' ? 'w-12' :
                          column.key === 'name' ? 'w-24' :
                          column.key === 'arabicName' ? 'w-24' :
                          column.key === 'flag' ? 'w-16' :
                          column.key === 'actions' ? 'w-20' : ''
                        }`}
                      >
                        {column.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCountryData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={countryColumns.length}
                        className="px-2 py-2 text-center text-gray-500"
                      >
                        No countries found
                      </td>
                    </tr>
                  ) : (
                    filteredCountryData.map((row) => (
                      <React.Fragment key={row._id}>
                        <tr 
                          className={`hover:bg-gray-50 cursor-pointer ${editingId === row._id ? 'bg-blue-50' : ''}`}
                          onClick={() => handleViewClick(row)}
                        >
                          {countryColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-2 py-2 text-sm text-gray-900 ${
                                column.key === 'name' ? 'max-w-24 truncate' :
                                column.key === 'arabicName' ? 'max-w-24 truncate' :
                                column.key === 'flag' ? 'whitespace-nowrap' :
                                column.key === 'actions' ? 'whitespace-nowrap' : 'whitespace-nowrap'
                              }`}
                            >
                              {column.render(row)}
                            </td>
                          ))}
                        </tr>
                        {editingId === row._id && (
                          <tr>
                            <td colSpan={countryColumns.length} className="p-0">
                              <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                                <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-lg font-semibold text-gray-900">Edit Country</h3>
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
                                        Name *
                                      </label>
                                      <input
                                        type="text"
                                        value={row.name || ""}
                                        onChange={(e) =>
                                          handleEditChange(row._id, "name", e.target.value)
                                        }
                                        placeholder="Country name"
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Arabic Name
                                      </label>
                                      <input
                                        type="text"
                                        value={row.arabicName || ""}
                                        onChange={(e) =>
                                          handleEditChange(row._id, "arabicName", e.target.value)
                                        }
                                        placeholder="Arabic name"
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>

                                  {/* Flag Information */}
                                  <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700">Flag Information</h4>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Flag URL
                                      </label>
                                      <input
                                        type="text"
                                        value={row.flag || ""}
                                        onChange={(e) =>
                                          handleEditChange(row._id, "flag", e.target.value)
                                        }
                                        placeholder="Flag image URL"
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    {row.flag && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Current Flag Preview
                                        </label>
                                        <img 
                                          src={row.flag} 
                                          alt={`${row.name} flag`} 
                                          className="w-16 h-12 object-cover rounded border"
                                        />
                                      </div>
                                    )}
                                  </div>
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
        )}
      </div>
    </div>
  );
};

export default Countries; 
import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, Upload as UploadIcon } from 'lucide-react';
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
          onChange={() => handleSelectRow(row._id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    {
      key: 'name',
      title: 'Name',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.name}
              onChange={(e) => handleEditChange(row._id, 'name', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return row.name;
      }
    },
    {
      key: 'arabicName',
      title: 'Arabic Name',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.arabicName}
              onChange={(e) => handleEditChange(row._id, 'arabicName', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return row.arabicName || 'N/A';
      }
    },
    flagColumn,
    {
      key: 'category',
      title: 'Category',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <Select
              value={countryCategories.find(cat => cat.value === row.category)}
              onChange={(selected) => handleEditChange(row._id, 'category', selected.value)}
              options={countryCategories}
              styles={customStyles}
              className="w-full"
              isSearchable
              placeholder="Select category..."
            />
          );
        }
        return row.category;
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
    if (!lowerCaseSearch) return countryData;
    return countryData.filter((item) => {
      return (
        (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
        (item.arabicName && item.arabicName.toLowerCase().includes(lowerCaseSearch)) ||
        (item.category && item.category.toLowerCase().includes(lowerCaseSearch))
      );
    });
  }, [countryData, searchTerm]);

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
          <div className="relative">
            <input
              type="text"
              placeholder="Search countries..."
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

        {/* Table */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredCountryData.length === 0 ? (
          <p className="text-center">No countries found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {countryColumns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCountryData.map((row) => (
                  <tr key={row._id}>
                    {countryColumns.map((column) => (
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

export default Countries; 
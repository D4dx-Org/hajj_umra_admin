import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, ArrowUpDown, Edit, Trash2, X, CheckCircle } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';
import Select from 'react-select';
import { read, utils, write } from 'xlsx';

const BranchKSA = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branchData, setBranchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc', type: 'alpha' });
  const [newBranch, setNewBranch] = useState({
    name: '',
    name_malayalam: '',
    name_urdu: '',
    ref: '',
    phoneNumber: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  // Define the table columns
  const branchColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === branchData.length}
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
      key: 'name',
      title: 'Name',
      render: (row) => {
        return (
          <div className="space-y-1">
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-gray-600">
              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">ML:</span> {row.name_malayalam || 'Not provided'}
            </div>
            <div className="text-sm text-gray-600">
              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">UR:</span> {row.name_urdu || 'Not provided'}
            </div>
          </div>
        );
      }
    },    { 
      key: 'phoneNumber', 
      title: 'Phone Number',
      render: (row) => <span className="truncate" title={row.phoneNumber || '-'}>{row.phoneNumber || '-'}</span>
    },
    {
      key: 'ref',
      title: 'Location Reference',
      render: (row) => {
        return (
          <div className="space-y-1">
            <div className="font-medium">{row.ref?.title || 'N/A'}</div>
            <div className="text-sm text-gray-600">
              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">ML:</span> {row.ref?.title_malayalam || 'Not provided'}
            </div>
            <div className="text-sm text-gray-600">
              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">UR:</span> {row.ref?.title_urdu || 'Not provided'}
            </div>
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

  // Updated sorting options with consistent value format
  const sortOptions = [
    { value: 'name-alpha-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc', type: 'alpha' },
    { value: 'name-alpha-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc', type: 'alpha' },
    { value: 'name-numeric-asc', label: 'Name (1-9)', field: 'name', direction: 'asc', type: 'numeric' },
    { value: 'name-numeric-desc', label: 'Name (9-1)', field: 'name', direction: 'desc', type: 'numeric' },
    { value: 'ref-alpha-asc', label: 'Location (A-Z)', field: 'ref', direction: 'asc', type: 'alpha' },
    { value: 'ref-alpha-desc', label: 'Location (Z-A)', field: 'ref', direction: 'desc', type: 'alpha' },
    { value: 'phoneNumber-alpha-asc', label: 'Phone Number (A-Z)', field: 'phoneNumber', direction: 'asc', type: 'alpha' },
    { value: 'phoneNumber-alpha-desc', label: 'Phone Number (Z-A)', field: 'phoneNumber', direction: 'desc', type: 'alpha' }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch`);
        setBranchData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching branch data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`);
        setLocations(response.data);
        console.log('Fetched locations:', response.data);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]); // Set empty array on error
      }
    };

    fetchLocations();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setBranchData(branchData.map(item => {
      if (item._id === id) {
        if (field === 'ref') {
          const selectedLocation = locations.find(loc => loc._id === value);
          return {
            ...item,
            ref: selectedLocation ? {
              _id: selectedLocation._id,
              title: selectedLocation.title
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/branch/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBranchData(branchData.map(item =>
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating branch data:", error);
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
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/branch/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setBranchData(branchData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting branch data:', error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Branch
  const handleAddBranch = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/branch`,
        newBranch,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch`);
        setBranchData(updatedResponse.data);
        setNewBranch({
          name: '',
          name_malayalam: '',
          name_urdu: '',
          ref: '',
          phoneNumber: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding branch data:", error);
    }
  };

  // Updated handle sort change
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

  // Updated sort function with numeric sorting support
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = sortConfig.field === 'ref' ? a[sortConfig.field]?.title || '' : a[sortConfig.field] || '';
      let bValue = sortConfig.field === 'ref' ? b[sortConfig.field]?.title || '' : b[sortConfig.field] || '';

      if (sortConfig.type === 'numeric' && sortConfig.field === 'name') {
        // Extract numbers from branch names for numeric sorting
        const aMatch = aValue.match(/\d+/);
        const bMatch = bValue.match(/\d+/);
        const aNum = aMatch ? parseInt(aMatch[0]) : 0;
        const bNum = bMatch ? parseInt(bMatch[0]) : 0;

        if (sortConfig.direction === 'asc') {
          return aNum - bNum;
        } else {
          return bNum - aNum;
        }
      } else {
        // Regular alphabetical sorting
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();

        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      }
    });
  };

  // Filter and sort data based on search and sort config
  const filteredBranchData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = branchData;

    if (lowerCaseSearch) {
      filtered = branchData.filter((item) => {
        const locationName = item.ref?.title || '';
        const locationNameMalayalam = item.ref?.title_malayalam || '';
        const locationNameUrdu = item.ref?.title_urdu || '';
        return (
          item.name.toLowerCase().includes(lowerCaseSearch) ||
          (item.name_malayalam && item.name_malayalam.toLowerCase().includes(lowerCaseSearch)) ||
          (item.name_urdu && item.name_urdu.toLowerCase().includes(lowerCaseSearch)) ||
          locationName.toLowerCase().includes(lowerCaseSearch) ||
          locationNameMalayalam.toLowerCase().includes(lowerCaseSearch) ||
          locationNameUrdu.toLowerCase().includes(lowerCaseSearch) ||
          (item.phoneNumber && item.phoneNumber.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }

    return sortData(filtered);
  }, [branchData, searchTerm, sortConfig]);

  // Handle edit button click
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Handle cancel button click
  const handleCancelEdit = () => {
    setBranchData(branchData.map(item =>
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredBranchData.map(row => row._id));
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

  // Handle row click to show details
  const handleRowClick = (branch, event) => {
    // Prevent row click when clicking on buttons or checkboxes
    if (event.target.closest('button') || event.target.closest('input[type="checkbox"]')) {
      return;
    }
    setSelectedBranch(branch);
    setShowDetailModal(true);
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

          console.log('Parsed Excel data:', data);

          if (data.length === 0) {
            setUploadError('The Excel file is empty. Please add some data.');
            return;
          }

          // Check the first row to understand the column structure
          const firstRow = data[0];
          const hasRequiredColumns = 'name' in firstRow && 'location_name' in firstRow;

          if (!hasRequiredColumns) {
            setUploadError('Excel file must have columns: name and location_name. Please check your column headers.');
            console.log('Required columns missing. Found columns:', Object.keys(firstRow));
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            if (!row.name || !row.location_name) {
              setUploadError(`Row ${rowNumber}: Missing required data. Each row must have name and location_name.`);
              return;
            }

            // Validate location_name if provided
            if (row.location_name && locations.length > 0) {
              const locationExists = locations.some(loc => loc.title === row.location_name);
              if (!locationExists) {
                setUploadError(`Row ${rowNumber}: Invalid location name "${row.location_name}". Please use a valid location name.`);
                return;
              }
            }

            // Phone number validation (optional)
            if (row.phone_number && typeof row.phone_number !== 'string') {
              setUploadError(`Row ${rowNumber}: Phone number must be a text value.`);
              return;
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/branch/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          setUploadSuccess(`Successfully uploaded ${response.data.count} branches`);
          setUploadError(null);

          // Refresh the data
          const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch`);
          setBranchData(updatedResponse.data);

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
          name: 'Sample Branch Name',
          name_malayalam: 'സാമ്പിൾ ബ്രാഞ്ച് പേര്',
          name_urdu: 'نمونہ برانچ نام',
          location_name: 'Sample Location Name',
          phone_number: '+1234567890'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);

      // Add headers with comments
      utils.sheet_add_aoa(ws, [[
        'name',
        'name_malayalam',
        'name_urdu',
        'location_name',
        'phone_number'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 30 }, // name
        { wch: 30 }, // name_malayalam
        { wch: 30 }, // name_urdu
        { wch: 30 }, // location_name
        { wch: 20 }  // phone_number
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
      link.download = 'branch_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
  };

  // Get current sort option value
  const getCurrentSortValue = () => {
    const { field, direction, type } = sortConfig;
    return `${field}-${type}-${direction}`;
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
            <h1 className="text-2xl font-bold">Branch Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredBranchData.length} branches
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
              {showAddForm ? 'Cancel' : 'Add Branch'}
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

        {/* New Branch Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Branch</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Name (English)</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter name in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Name (Malayalam)</label>
                <input
                  type="text"
                  value={newBranch.name_malayalam}
                  onChange={(e) => setNewBranch({ ...newBranch, name_malayalam: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter name in Malayalam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Name (Urdu)</label>
                <input
                  type="text"
                  value={newBranch.name_urdu}
                  onChange={(e) => setNewBranch({ ...newBranch, name_urdu: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter name in Urdu"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Phone Number (Optional)</label>
              <input
                type="text"
                value={newBranch.phoneNumber}
                onChange={(e) => setNewBranch({ ...newBranch, phoneNumber: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location Reference</label>
              <select
                value={newBranch.ref}
                onChange={(e) => setNewBranch({ ...newBranch, ref: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.title}
                    {location.title_malayalam && ` | ${location.title_malayalam}`}
                    {location.title_urdu && ` | ${location.title_urdu}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddBranch}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Branch
            </button>
          </div>
        )}

        {/* Search and Sort Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search branches..."
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
                value={getCurrentSortValue()}
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected branches? This action cannot be undone.`
                  : 'Are you sure you want to delete this branch? This action cannot be undone.'}
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
        ) : filteredBranchData.length === 0 ? (
          <p className="text-center">No branches found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {branchColumns.map((column) => (
                    <th key={column.key} className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBranchData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${editingId === row._id ? 'bg-blue-50' : ''}`}
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {branchColumns.map((column) => (
                        <td key={`${row._id}-${column.key}`} className="px-4 py-1 whitespace-nowrap">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={branchColumns.length} className="p-4">
                          <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold mb-4">Edit Branch</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">Name *</label>
                                <input
                                  type="text"
                                  value={row.name || ""}
                                  onChange={(e) => handleEditChange(row._id, 'name', e.target.value)}
                                  placeholder="Branch name"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Name (Malayalam)</label>
                                <input
                                  type="text"
                                  value={row.name_malayalam || ""}
                                  onChange={(e) => handleEditChange(row._id, 'name_malayalam', e.target.value)}
                                  placeholder="ശാഖ"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Name (Urdu)</label>
                                <input
                                  type="text"
                                  value={row.name_urdu || ""}
                                  onChange={(e) => handleEditChange(row._id, 'name_urdu', e.target.value)}
                                  placeholder="شاخ"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Phone Number</label>
                                <input
                                  type="tel"
                                  value={row.phoneNumber || ""}
                                  onChange={(e) => handleEditChange(row._id, 'phoneNumber', e.target.value)}
                                  placeholder="+966501234567"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Location Reference</label>
                                <select
                                  value={row.ref?._id || row.ref || ""}
                                  onChange={(e) => handleEditChange(row._id, 'ref', e.target.value)}
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                >
                                  <option value="">Select Location</option>
                                  {locations.map(location => (
                                    <option key={location._id} value={location._id}>
                                      {location.title}
                                      {location.title_malayalam && ` | ${location.title_malayalam}`}
                                      {location.title_urdu && ` | ${location.title_urdu}`}
                                    </option>
                                  ))}
                                </select>
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBranch && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 mx-4">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle size={20} />
                  Branch Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedBranch.phoneNumber || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Location Reference</label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedBranch.ref?.title || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multilingual Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Branch Names</h3>
                  <div className="space-y-4">
                    {/* English Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">English</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                        <p className="text-gray-900">{selectedBranch.name || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Malayalam Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">Malayalam</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                        <p className="text-gray-900">{selectedBranch.name_malayalam || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Urdu Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">Urdu</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                        <p className="text-gray-900">{selectedBranch.name_urdu || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Location Information</h3>
                  <div className="bg-white p-4 rounded border">
                    {selectedBranch.ref ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Location (English)</label>
                          <p className="text-gray-900">{selectedBranch.ref.title}</p>
                        </div>
                        {selectedBranch.ref.title_malayalam && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Location (Malayalam)</label>
                            <p className="text-gray-900">{selectedBranch.ref.title_malayalam}</p>
                          </div>
                        )}
                        {selectedBranch.ref.title_urdu && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Location (Urdu)</label>
                            <p className="text-gray-900">{selectedBranch.ref.title_urdu}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No location reference provided</p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Created Date</label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedBranch.createdAt ? new Date(selectedBranch.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Database ID</label>
                      <p className="text-gray-900 bg-white p-2 rounded border font-mono text-sm">{selectedBranch._id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchKSA; 
import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, ArrowUpDown } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';

const UmrahBranch = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branchData, setBranchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newBranch, setNewBranch] = useState({
    name: '',
    malayalamName: '',
    urduName: '',
    phoneNumber: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc', type: 'alpha' });

  // Define the table columns
  const branchColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === branchData.length && branchData.length > 0}
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
        return row.name;
      }
    },
    {
      key: 'malayalamName',
      title: 'Malayalam Name',
      render: (row) => {
        return row.malayalamName || '-';
      }
    },
    {
      key: 'urduName',
      title: 'Urdu Name',
      render: (row) => {
        return row.urduName || '-';
      }
    },
    {
      key: 'phoneNumber',
      title: 'Phone Number',
      render: (row) => {
        return row.phoneNumber || 'N/A';
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
          >
            Delete
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
    { value: 'phoneNumber-alpha-asc', label: 'Phone (A-Z)', field: 'phoneNumber', direction: 'asc', type: 'alpha' },
    { value: 'phoneNumber-alpha-desc', label: 'Phone (Z-A)', field: 'phoneNumber', direction: 'desc', type: 'alpha' }
  ];

  // Fetch branches data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah`);
        setBranchData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching umrah branch data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setBranchData(branchData.map(item => {
      if (item._id === id) {
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah/${row._id}`,
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
      console.error("Error updating umrah branch data:", error);
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
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setBranchData(branchData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting umrah branch data:', error);
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah`,
        newBranch,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah`);
        setBranchData(updatedResponse.data);
        setNewBranch({ 
          name: '',
          malayalamName: '',
          urduName: '',
          phoneNumber: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah branch data:", error);
      if (error.response?.data?.message === "Branch already exists.") {
        setUploadError("A branch with this name already exists.");
      }
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

  // Filtered and sorted data
  const filteredBranchData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = branchData;
    
    if (lowerCaseSearch) {
      filtered = branchData.filter((item) => {
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamName && item.malayalamName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduName && item.urduName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.phoneNumber && item.phoneNumber.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }
    
    return sortData(filtered);
  }, [branchData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setBranchData(branchData.map(item => 
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
          name: 'Sample Branch',
          malayalam_name: 'സാമ്പിൾ ബ്രാഞ്ച്',
          urdu_name: 'نمونہ برانچ',
          phone_number: '+966123456789'
        }
      ];

      const ws = utils.json_to_sheet([]);
      
      utils.sheet_add_aoa(ws, [[
        'name',
        'malayalam_name',
        'urdu_name',
        'phone_number'
      ]], { origin: 'A1' });

      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      ws['!cols'] = [
        { wch: 25 }, // name
        { wch: 25 }, // malayalam_name
        { wch: 25 }, // urdu_name
        { wch: 20 }  // phone_number
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
      link.download = 'umrah_branch_upload_template.xlsx';
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah/bulk-upload`,
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
      const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah`);
      setBranchData(updatedResponse.data);
      
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
            <h1 className="text-2xl font-bold">Umrah Branch Management</h1>
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

        {/* New Branch Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah Branch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Malayalam Name</label>
                <input
                  type="text"
                  value={newBranch.malayalamName}
                  onChange={(e) => setNewBranch({ ...newBranch, malayalamName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മലയാളം പേര്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Name</label>
                <input
                  type="text"
                  value={newBranch.urduName}
                  onChange={(e) => setNewBranch({ ...newBranch, urduName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="اردو نام"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Phone Number</label>
                <input
                  type="text"
                  value={newBranch.phoneNumber}
                  onChange={(e) => setNewBranch({ ...newBranch, phoneNumber: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="+966123456789"
                />
              </div>
            </div>
            <button
              onClick={handleAddBranch}
              disabled={!newBranch.name}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Branch
            </button>
          </div>
        )}

        {/* Search Bar */}
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {branchColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBranchData.length === 0 ? (
                  <tr>
                    <td colSpan={branchColumns.length} className="px-6 py-4 text-center text-gray-500">
                      No branches found
                    </td>
                  </tr>
                ) : (
                  filteredBranchData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr className={`hover:bg-gray-50 ${editingId === row._id ? 'bg-blue-50' : ''}`}>
                        {branchColumns.map((column) => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                      {editingId === row._id && (
                        <tr>
                          <td colSpan={branchColumns.length} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Branch</h3>
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
                                      placeholder="Branch name"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Malayalam Name
                                    </label>
                                    <input
                                      type="text"
                                      value={row.malayalamName || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "malayalamName", e.target.value)
                                      }
                                      placeholder="മലയാളം പേര്"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Contact Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Name
                                    </label>
                                    <input
                                      type="text"
                                      value={row.urduName || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "urduName", e.target.value)
                                      }
                                      placeholder="اردو نام"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Phone Number
                                    </label>
                                    <input
                                      type="text"
                                      value={row.phoneNumber || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "phoneNumber", e.target.value)
                                      }
                                      placeholder="Phone number"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected branches?`
                  : 'Are you sure you want to delete this branch?'
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

export default UmrahBranch;
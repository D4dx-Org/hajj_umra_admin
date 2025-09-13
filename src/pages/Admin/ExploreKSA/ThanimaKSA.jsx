import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';

import axios from 'axios';
import { read, utils, write } from 'xlsx';

const Thanima = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thanimaData, setThanimaData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newThanima, setNewThanima] = useState({ 
    name: '', 
    nameMalayalam: '',
    nameUrdu: '',
    phone: '', 
    id: '',
    ref: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedThanima, setSelectedThanima] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(thanimaData.map(row => row._id));
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

  // Modify handleDeleteConfirm to handle bulk delete
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
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setThanimaData(thanimaData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting thanima data:', error);
    }
  };

  // Define the table columns
  const thanimaColumns = useMemo(() => [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={thanimaData?.length > 0 && selectedRows.length === thanimaData?.length}
          onChange={handleSelectAll}
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
      title: 'Name (English)',
      render: (row) => <span className="truncate" title={row.name || '-'}>{row.name || '-'}</span>
    },
    { 
      key: 'nameMalayalam', 
      title: 'Name (Malayalam)',
      render: (row) => <span className="truncate" title={row.nameMalayalam || '-'}>{row.nameMalayalam || '-'}</span>
    },
    { 
      key: 'nameUrdu', 
      title: 'Name (Urdu)',
      render: (row) => <RTLText className="truncate" title={row.nameUrdu || '-'}>{row.nameUrdu || '-'}</RTLText>
    },
    { 
      key: 'phone', 
      title: 'Phone',
      render: (row) => <span className="truncate" title={row.phone || '-'}>{row.phone || '-'}</span>
    },
    { 
      key: 'id', 
      title: 'ID',
      render: (row) => <span className="truncate" title={row.id || '-'}>{row.id || '-'}</span>
    },
    { 
      key: 'ref', 
      title: 'Location Reference',
      render: (row) => <span className="truncate" title={row.ref?.title || row.ref || '-'}>{row.ref?.title || row.ref || '-'}</span>
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
  ], [selectedRows, (thanimaData || []).length, locations]);

  // Fetch data from API using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima`);
        setThanimaData(Array.isArray(response.data) ? response.data: []);
        console.log(response.data)
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Thanima data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add useEffect to fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`);
        setLocations(response.data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Filter data based on search input
  const filteredThanimaData = useMemo(() => {
    if (!thanimaData) return []; 
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return thanimaData;
    return thanimaData.filter((item) => {
      const locationName = item.ref?.title || locations.find(loc => loc._id === item.ref)?.title || '';
      return (
        item.name.toLowerCase().includes(lowerCaseSearch) ||
        item.id.toString().toLowerCase().includes(lowerCaseSearch) ||
        item.phone.toLowerCase().includes(lowerCaseSearch) ||
        locationName.toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [thanimaData, searchTerm, locations]);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setThanimaData(thanimaData.map(item => {
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/thanima/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setThanimaData(thanimaData.map(item => 
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating thanima data:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Add handleDeleteCancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Thanima
  const handleAddThanima = async () => {
    if (!newThanima.name || !newThanima.phone || !newThanima.id) {
      alert("Name, Phone, and ID are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const payload = {
        name: newThanima.name,
        nameMalayalam: newThanima.nameMalayalam,
        nameUrdu: newThanima.nameUrdu,
        phone: newThanima.phone,
        id: newThanima.id,
      };
      if (newThanima.ref) payload.ref = newThanima.ref;

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/thanima`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima`);
        setThanimaData(updatedResponse.data);
        setNewThanima({ 
          name: '', 
          nameMalayalam: '',
          nameUrdu: '',
          phone: '', 
          id: '',
          ref: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding thanima data:", error);
    }
  };

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    setThanimaData(thanimaData.map(item => 
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

          const isValid = data.every(row => row.name && row.phone && row.id);
          if (!isValid) {
            setUploadError('Invalid data format. Please ensure all required fields are present.');
            return;
          }

          const formData = new FormData();
          formData.append('file', file);

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL_V2}/thanima/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          setUploadSuccess(`Successfully uploaded ${response.data.count} thanimas`);
          setUploadError(null);

          const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima`);
          setThanimaData(updatedResponse.data);
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

  // Handle row click to show details
  const handleRowClick = (thanima, event) => {
    // Don't trigger if clicking on checkbox, edit, or delete buttons
    if (
      event.target.type === "checkbox" ||
      event.target.closest("button") ||
      event.target.closest("a")
    ) {
      return;
    }
    setSelectedThanima(thanima);
    setShowDetailsModal(true);
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedThanima(null);
  };

  // Add download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          name: 'Sample Thanima',
          nameMalayalam: 'Sample Malayalam',
          nameUrdu: 'Sample Urdu',
          phone: '+966500000000',
          id: 'THN001',
          location: 'Sample Location Name'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);
      
      // Add headers
      utils.sheet_add_aoa(ws, [[
        'name',
        'nameMalayalam',
        'nameUrdu',
        'phone',
        'id',
        'location'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 20 }, // name
        { wch: 20 }, // nameMalayalam
        { wch: 20 }, // nameUrdu
        { wch: 15 }, // phone
        { wch: 10 }, // id
        { wch: 30 }  // location
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
      link.download = 'thanima_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
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
          <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Thanima Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredThanimaData.length} thanimas
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

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Thanima</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Name (English)</label>
              <input
                type="text"
                value={newThanima.name}
                onChange={(e) => setNewThanima({ ...newThanima, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Name (Malayalam)</label>
              <input
                type="text"
                value={newThanima.nameMalayalam}
                onChange={(e) => setNewThanima({ ...newThanima, nameMalayalam: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Name (Urdu)</label>
              <input
                type="text"
                value={newThanima.nameUrdu}
                onChange={(e) => setNewThanima({ ...newThanima, nameUrdu: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                dir="rtl" 
                  style={{ textAlign: 'right' }}


              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={newThanima.phone}
                onChange={(e) => setNewThanima({ ...newThanima, phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">ID</label>
              <input
                type="text"
                value={newThanima.id}
                onChange={(e) => setNewThanima({ ...newThanima, id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location Reference</label>
              <select
                value={newThanima.ref}
                onChange={(e) => setNewThanima({ ...newThanima, ref: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddThanima}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Thanima
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search thanimas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredThanimaData.length === 0 ? (
          <p className="text-center">No items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {thanimaColumns.map((column) => (
                    <th key={column.key} className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredThanimaData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${editingId === row._id ? 'bg-blue-50' : ''}`}
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {thanimaColumns.map((column) => (
                        <td key={`${row._id}-${column.key}`} className="px-4 py-1 whitespace-nowrap">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={thanimaColumns.length} className="p-4">
                          <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold mb-4">Edit Thanima</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">Name (English) *</label>
                                <input
                                  type="text"
                                  value={row.name || ""}
                                  onChange={(e) => handleEditChange(row._id, 'name', e.target.value)}
                                  placeholder="Enter name in English"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Name (Malayalam)</label>
                                <input
                                  type="text"
                                  value={row.nameMalayalam || ""}
                                  onChange={(e) => handleEditChange(row._id, 'nameMalayalam', e.target.value)}
                                  placeholder="Enter name in Malayalam"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Name (Urdu)</label>
                                <RTLInput
                                  type="text"
                                  value={row.nameUrdu || ""}
                                  onChange={(e) => handleEditChange(row._id, 'nameUrdu', e.target.value)}
                                  placeholder="اردو میں نام درج کریں"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Phone *</label>
                                <input
                                  type="text"
                                  value={row.phone || ""}
                                  onChange={(e) => handleEditChange(row._id, 'phone', e.target.value)}
                                  placeholder="Enter phone number"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">ID *</label>
                                <input
                                  type="text"
                                  value={row.id || ""}
                                  onChange={(e) => handleEditChange(row._id, 'id', e.target.value)}
                                  placeholder="Enter unique ID"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  required
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
      </div>

      {/* Add Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {Array.isArray(deleteConfirm.id) 
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected thanimas? This action cannot be undone.`
                : 'Are you sure you want to delete this thanima? This action cannot be undone.'}
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

      {/* Thanima Details Modal */}
      {showDetailsModal && selectedThanima && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Thanima Details</h2>
              <button
                onClick={handleCloseDetailsModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Names Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Name (English)</h3>
                  <p className="text-gray-900 break-words">{selectedThanima.name || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Name (Malayalam)</h3>
                  <p className="text-gray-900 break-words">{selectedThanima.nameMalayalam || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Name (Urdu)</h3>
                  <p className="text-gray-900 break-words text-right" dir="rtl">{selectedThanima.nameUrdu || "N/A"}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Phone Number</h3>
                  <p className="text-gray-900 break-words">
                    {selectedThanima.phone ? (
                      <a 
                        href={`tel:${selectedThanima.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedThanima.phone}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">ID</h3>
                  <p className="text-gray-900 break-words font-mono">{selectedThanima.id || "N/A"}</p>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Location Reference</h3>
                <p className="text-gray-900 break-words">
                  {selectedThanima.ref?.title || 
                   locations.find(loc => loc._id === selectedThanima.ref)?.title || 
                   "No location reference"}
                </p>
              </div>

              {/* Metadata Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedThanima._id}
                  </div>
                  {selectedThanima.createdAt && (
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedThanima.createdAt).toLocaleString()}
                    </div>
                  )}
                  {selectedThanima.updatedAt && (
                    <div>
                      <span className="font-medium">Updated:</span>{" "}
                      {new Date(selectedThanima.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  handleCloseDetailsModal();
                  handleEditClick(selectedThanima);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={handleCloseDetailsModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Thanima;

import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';

const Clinic = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clinicData, setClinicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newClinic, setNewClinic] = useState({ 
    name: '', 
    center: '',
    poll: '',
    location: { lat: '', lng: '' }, 
    ref: '',
    branchRef: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [branches, setBranches] = useState([]);

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredClinicData.map(row => row._id));
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

  // Filter data based on search input
  const filteredClinicData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return clinicData;
    return clinicData.filter((item) => {
      const locationName = item.ref?.name || locations.find(loc => loc._id === item.ref)?.name || '';
      const branchName = item.branchRef?.name || branches.find(branch => branch._id === item.branchRef)?.name || '';
      return (
        item.name.toLowerCase().includes(lowerCaseSearch) ||
        item.center.toLowerCase().includes(lowerCaseSearch) ||
        item.poll.toLowerCase().includes(lowerCaseSearch) ||
        locationName.toLowerCase().includes(lowerCaseSearch) ||
        branchName.toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [clinicData, searchTerm, locations, branches]);

  // Define the table columns with editable configuration
  const clinicColumns = useMemo(() => [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === filteredClinicData.length}
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
        return row.ref?.name || 'N/A';
      }
    },
    {
      key: 'branchRef',
      title: 'Branch Reference',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <select
              value={row.branchRef?._id || row.branchRef || ''}
              onChange={(e) => handleEditChange(row._id, 'branchRef', e.target.value)}
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
        return row.branchRef?.name || 'N/A';
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
  ], [editingId, selectedRows, filteredClinicData.length, locations, branches]);

  // Fetch data from API using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/clinic`);
        setClinicData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clinic data:', error);
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

  // Add useEffect to fetch branches
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
    setClinicData(clinicData.map(item => {
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
        `${import.meta.env.VITE_BACKEND_URL}/clinic/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setClinicData(clinicData.map(item => 
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating clinic data:", error);
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
        axios.delete(`${import.meta.env.VITE_BACKEND_URL}/clinic/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setClinicData(clinicData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting clinic data:', error);
    }
  };

  // Add handleDeleteCancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Clinic
  const handleAddClinic = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/clinic`,
        newClinic,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/clinic`);
        setClinicData(updatedResponse.data);
        setNewClinic({ 
          name: '', 
          center: '',
          poll: '',
          location: { lat: '', lng: '' }, 
          ref: '',
          branchRef: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding clinic data:", error);
    }
  };

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    setClinicData(clinicData.map(item => 
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

          if (data.length === 0) {
            setUploadError('The Excel file is empty. Please add some data.');
            return;
          }

          // Check the first row to understand the column structure
          const firstRow = data[0];
          const hasRequiredColumns = 'name' in firstRow && 'location_name' in firstRow && 'branch_name' in firstRow;
          
          if (!hasRequiredColumns) {
            setUploadError('Excel file must have required columns: name, location_name, and branch_name');
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            // Check required fields
            if (!row.name || !row.location_name || !row.branch_name) {
              setUploadError(`Row ${rowNumber}: Missing required data. Each row must have name, location_name, and branch_name.`);
              return;
            }

            // Validate location_name exists
            const locationExists = locations.some(location => location.name.toLowerCase() === row.location_name.toLowerCase());
            if (!locationExists) {
              setUploadError(`Row ${rowNumber}: Invalid location name "${row.location_name}". Please use a valid location name.`);
              return;
            }

            // Validate branch_name exists
            const branchExists = branches.some(branch => branch.name.toLowerCase() === row.branch_name.toLowerCase());
            if (!branchExists) {
              setUploadError(`Row ${rowNumber}: Invalid branch name "${row.branch_name}". Please use a valid branch name.`);
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
            `${import.meta.env.VITE_BACKEND_URL}/clinic/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          if (response.data) {
            setUploadSuccess(`Successfully uploaded ${response.data.count} clinics`);
            setUploadError(null);

            // Refresh the clinic list
            const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/clinic`);
            setClinicData(updatedResponse.data);
          }
        } catch (error) {
          console.error('Excel processing error:', error);
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error processing the Excel file';
          setUploadError(`Upload failed: ${errorMessage}`);
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
          name: 'Medical Dispensary - 01 (Required)',
          location_name: 'Azizia (Required)',
          branch_name: 'Branch 1 (Required)',
          center: 'Center A (Optional)',
          poll: 'Poll 1 (Optional)',
          latitude: '21.4225 (Optional)',
          longitude: '39.8262 (Optional)'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);
      
      // Add headers with required/optional indicators
      utils.sheet_add_aoa(ws, [[
        'name (Required)',
        'location_name (Required)',
        'branch_name (Required)',
        'center (Optional)',
        'poll (Optional)',
        'latitude (Optional)',
        'longitude (Optional)'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 30 }, // name
        { wch: 30 }, // location_name
        { wch: 30 }, // branch_name
        { wch: 20 }, // center
        { wch: 20 }, // poll
        { wch: 20 }, // latitude
        { wch: 20 }  // longitude
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
      link.download = 'clinic_upload_template.xlsx';
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
          <h1 className="text-2xl font-bold">Clinic Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredClinicData.length} clinics
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
            <h2 className="text-lg font-bold mb-4">Add New Clinic</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={newClinic.name}
                onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Center</label>
              <input
                type="text"
                value={newClinic.center}
                onChange={(e) => setNewClinic({ ...newClinic, center: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll</label>
              <input
                type="text"
                value={newClinic.poll}
                onChange={(e) => setNewClinic({ ...newClinic, poll: e.target.value })}
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
                    value={newClinic.location.lat}
                    onChange={(e) => setNewClinic({
                      ...newClinic,
                      location: { ...newClinic.location, lat: e.target.value }
                    })}
                    placeholder="Enter latitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">Longitude</label>
                  <input
                    type="number"
                    value={newClinic.location.lng}
                    onChange={(e) => setNewClinic({
                      ...newClinic,
                      location: { ...newClinic.location, lng: e.target.value }
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
                value={newClinic.ref}
                onChange={(e) => setNewClinic({ ...newClinic, ref: e.target.value })}
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
            <div className="mb-4">
              <label className="block text-sm font-medium">Branch Reference</label>
              <select
                value={newClinic.branchRef}
                onChange={(e) => setNewClinic({ ...newClinic, branchRef: e.target.value })}
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
              onClick={handleAddClinic}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Clinic
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clinics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredClinicData.length === 0 ? (
          <p className="text-center">No items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {clinicColumns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClinicData.map((row) => (
                  <tr key={row._id}>
                    {clinicColumns.map((column) => (
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
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected clinics? This action cannot be undone.`
                : 'Are you sure you want to delete this clinic? This action cannot be undone.'}
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
  );
};

export default Clinic;

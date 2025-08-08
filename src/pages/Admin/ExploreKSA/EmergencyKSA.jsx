import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';

const Emergency = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newEmergency, setNewEmergency] = useState({
    name: '',
    nameMalayalam: '',
    nameUrdu: '',
    contact: '',
    ref: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(emergencyData.map(row => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select single row
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

  // Define table columns
  const emergencyColumns = useMemo(() => [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={emergencyData.length > 0 && selectedRows.length === emergencyData.length}
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
        const values = [row.name, row.nameMalayalam, row.nameUrdu].filter(Boolean).join(' | ');
        return values || '-';
      }
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (row) => {
        return row.contact;
      }
    },
    {
      key: 'ref',
      title: 'Location Reference',
      render: (row) => {
        return row.ref?.title || 'N/A';
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
  ], [selectedRows, emergencyData.length]);

  // Fetch emergency data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/emergency`);
        setEmergencyData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Emergency data:', error);
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
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Filter data based on search
  const filteredEmergencyData = useMemo(() => {
    return emergencyData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ref?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emergencyData, searchTerm]);

  // Handle edit change
  const handleEditChange = (id, field, value) => {
    setEmergencyData(emergencyData.map(item => {
      if (item._id === id) {
        if (field === 'ref') {
          return {
            ...item,
            ref: value ? {
              _id: value,
              name: locations.find(loc => loc._id === value)?.name
            } : null
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Handle save edit
  const handleSaveEdit = async (row) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL_V2}/emergency/${row._id}`,
        {
          name: row.name,
          nameMalayalam: row.nameMalayalam,
          nameUrdu: row.nameUrdu,
          contact: row.contact,
          ref: row.ref?._id || row.ref || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmergencyData(emergencyData.map(item =>
        item._id === row._id ? response.data : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating emergency data:", error);
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const ids = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];

      await Promise.all(ids.map(id =>
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/emergency/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setEmergencyData(emergencyData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting emergency data:', error);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle add new emergency
  const handleAddEmergency = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/emergency`,
        newEmergency,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmergencyData([...emergencyData, response.data]);
      setNewEmergency({ name: '', nameMalayalam: '', nameUrdu: '', contact: '', ref: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding emergency data:", error);
    }
  };

  // Handle edit click
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEmergencyData(emergencyData.map(item =>
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} />
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />

      <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Emergency Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredEmergencyData.length} contacts
            </div>
          </div>
          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Delete Selected ({selectedRows.length})
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600"
            >
              {showAddForm ? 'Cancel' : 'Add New'}
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (English)</label>
                <input
                  type="text"
                  value={newEmergency.name}
                  onChange={(e) => setNewEmergency({ ...newEmergency, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (Malayalam)</label>
                <input
                  type="text"
                  value={newEmergency.nameMalayalam}
                  onChange={(e) => setNewEmergency({ ...newEmergency, nameMalayalam: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (Urdu)</label>
                <input
                  type="text"
                  value={newEmergency.nameUrdu}
                  onChange={(e) => setNewEmergency({ ...newEmergency, nameUrdu: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact</label>
                <input
                  type="text"
                  value={newEmergency.contact}
                  onChange={(e) => setNewEmergency({ ...newEmergency, contact: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  value={newEmergency.ref}
                  onChange={(e) => setNewEmergency({ ...newEmergency, ref: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {[location.title, location.titleMalayalam, location.titleUrdu].filter(Boolean).join(' | ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleAddEmergency}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Emergency Contact
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search emergency contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredEmergencyData.length === 0 ? (
          <p className="text-center">No emergency contacts found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {emergencyColumns.map((column) => (
                    <th key={column.key} className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmergencyData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr className={`${editingId === row._id ? 'bg-blue-50' : ''}`}>
                      {emergencyColumns.map((column) => (
                        <td key={`${row._id}-${column.key}`} className="px-4 py-1 whitespace-nowrap">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={emergencyColumns.length} className="p-0">
                          <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-lg font-semibold text-gray-900">Edit Emergency Contact</h3>
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
                                    Name (English) *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.name || ""}
                                    onChange={(e) => handleEditChange(row._id, 'name', e.target.value)}
                                    placeholder="Emergency contact name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.nameMalayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'nameMalayalam', e.target.value)}
                                    placeholder="അടിയന്തിര സമ്പർക്കം"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.nameUrdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'nameUrdu', e.target.value)}
                                    placeholder="ہنگامی رابطہ"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>

                              {/* Contact & Location */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Contact & Location</h4>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.contact || ""}
                                    onChange={(e) => handleEditChange(row._id, 'contact', e.target.value)}
                                    placeholder="Contact number or email"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location Reference
                                  </label>
                                  <select
                                    value={row.ref?._id || row.ref || ""}
                                    onChange={(e) => handleEditChange(row._id, 'ref', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select Location</option>
                                    {locations.map(location => (
                                      <option key={location._id} value={location._id}>
                                        {[location.title, location.titleMalayalam, location.titleUrdu].filter(Boolean).join(' | ')}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
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
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected contacts?`
                : 'Are you sure you want to delete this contact?'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
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
  );
};

export default Emergency; 
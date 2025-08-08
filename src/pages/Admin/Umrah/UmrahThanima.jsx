import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  HandHelping,
  Phone,
  Calendar,
  IdCard,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';

const UmrahThanima = ({ isOpen }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thanimas, setThanimas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    malayalamName: '',
    urduName: '',
    phone: '',
    id: ''
  });

  useEffect(() => {
    fetchThanimas();
  }, []);

  const fetchThanimas = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah`);
      setThanimas(response.data);
    } catch (error) {
      setError('Error fetching thanimas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.phone.trim() || !formData.id.trim()) {
      setError('Name, phone, and ID are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        name: formData.name.trim(),
        malayalamName: formData.malayalamName.trim() || undefined,
        urduName: formData.urduName.trim() || undefined,
        phone: formData.phone.trim(),
        id: formData.id.trim()
      };

      let response;
      if (editingId) {
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah/${editingId}`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
      }

      setSuccess(editingId ? 'Thanima updated successfully!' : 'Thanima created successfully!');
      resetForm();
      fetchThanimas();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.id;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setSuccess('Thanima deleted successfully!');
      setDeleteConfirm({ show: false, id: null });
      fetchThanimas();
    } catch (error) {
      setError(error.response?.data?.message || 'Delete failed');
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    setDeleteConfirm({ show: true, id: selectedItems });
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = deleteConfirm.id;
    try {
      const token = localStorage.getItem('token');
      const deletePromises = ids.map(id =>
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
      );

      await Promise.all(deletePromises);
      setSuccess(`${ids.length} thanimas deleted successfully!`);
      setSelectedItems([]);
      setDeleteConfirm({ show: false, id: null });
      fetchThanimas();
    } catch (error) {
      setError('Error during bulk delete: ' + error.message);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setSuccess(`Bulk upload successful! ${response.data.count} thanimas added.`);
      fetchThanimas();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.duplicates) {
        setError(`Upload failed: Duplicate thanimas found - ${errorData.duplicates.join(', ')}`);
      } else if (errorData?.invalidRows) {
        setError(`Upload failed: Invalid data in rows ${errorData.invalidRows.join(', ')}`);
      } else {
        setError(errorData?.message || 'Upload failed');
      }
    }

    event.target.value = '';
  };

  const downloadTemplate = () => {
    // Create template with sample data
    const template = [
      { 
        name: 'Sample Thanima', 
        malayalam_name: 'സാമ്പിൾ തനിമ',
        urdu_name: 'نمونہ تھانیما',
        phone: '+966501234567', 
        id: 'TH001' 
      },
      { 
        name: 'Helper Service', 
        malayalam_name: 'സഹായ സേവനം',
        urdu_name: 'مددگار خدمات',
        phone: '+966509876543', 
        id: 'TH002' 
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 20 }, // name
      { wch: 20 }, // malayalam_name
      { wch: 20 }, // urdu_name
      { wch: 15 }, // phone
      { wch: 10 }  // id
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thanima Template');
    XLSX.writeFile(wb, 'thanima_template.xlsx');
  };

  const resetForm = () => {
    setFormData({ name: '', malayalamName: '', urduName: '', phone: '', id: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  const startEdit = (thanima) => {
    setFormData({
      name: thanima.name,
      malayalamName: thanima.malayalamName || '',
      urduName: thanima.urduName || '',
      phone: thanima.phone,
      id: thanima.id
    });
    setEditingId(thanima._id);
    setShowAddForm(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedThanimas = React.useMemo(() => {
    let sortableThanimas = [...thanimas];
    if (sortConfig.key) {
      sortableThanimas.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableThanimas;
  }, [thanimas, sortConfig]);

  const filteredThanimas = sortedThanimas.filter(thanima =>
    thanima.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (thanima.malayalamName && thanima.malayalamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (thanima.urduName && thanima.urduName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    thanima.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thanima.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredThanimas.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredThanimas.map(thanima => thanima._id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        <Sidebar isOpen={sidebarOpen} />
        
        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0 md:ml-16'} pt-16`}>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      <Sidebar isOpen={sidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0 md:ml-16'} pt-16`}>
        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Thanima Management</h1>
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Total: {thanimas.length} thanimas
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Download Template
              </button>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer flex items-center gap-2 text-sm"
              >
                Upload Excel
              </label>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
              >
                Add More
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search thanimas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          )}

          {showAddForm && (
            <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {editingId ? 'Edit Thanima' : 'Add New Thanima'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Malayalam Name
                  </label>
                  <input
                    type="text"
                    value={formData.malayalamName}
                    onChange={(e) => setFormData({ ...formData, malayalamName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="തനിമ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urdu Name
                  </label>
                  <input
                    type="text"
                    value={formData.urduName}
                    onChange={(e) => setFormData({ ...formData, urduName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="تھانیما"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+966501234567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID *
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="TH001"
                    required
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {editingId ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-1 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredThanimas.length && filteredThanimas.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      MALAYALAM NAME
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      URDU NAME
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      PHONE
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      CREATED
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredThanimas.map((thanima, index) => (
                    <React.Fragment key={thanima._id}>
                      <tr className={`hover:bg-gray-50 transition-colors ${editingId === thanima._id ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(thanima._id)}
                            onChange={() => toggleSelectItem(thanima._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-1">
                          <div className="text-sm font-medium text-gray-900">{thanima.name}</div>
                        </td>
                        <td className="px-4 py-1">
                          <div className="text-sm text-gray-700">{thanima.malayalamName || '-'}</div>
                        </td>
                        <td className="px-4 py-1">
                          <div className="text-sm text-gray-700" dir="rtl">{thanima.urduName || '-'}</div>
                        </td>
                        <td className="px-4 py-1">
                          <div className="text-sm text-gray-700">{thanima.phone}</div>
                        </td>
                        <td className="px-4 py-1">
                          <div className="text-sm text-gray-700 font-mono">{thanima.id}</div>
                        </td>
                        <td className="px-4 py-1">
                          <div className="text-sm text-gray-700">
                            {new Date(thanima.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-1">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(thanima)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(thanima._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingId === thanima._id && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Thanima</h3>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleSubmit({ preventDefault: () => {} })}
                                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={resetForm}
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
                                      value={formData.name || ""}
                                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                      placeholder="Thanima name"
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
                                      value={formData.malayalamName || ""}
                                      onChange={(e) => setFormData({ ...formData, malayalamName: e.target.value })}
                                      placeholder="തനിമ"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Name
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.urduName || ""}
                                      onChange={(e) => setFormData({ ...formData, urduName: e.target.value })}
                                      placeholder="تھانیما"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      dir="rtl"
                                    />
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Contact Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Phone *
                                    </label>
                                    <input
                                      type="tel"
                                      value={formData.phone || ""}
                                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                      placeholder="+966501234567"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      ID *
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.id || ""}
                                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                      placeholder="TH001"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
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

            {filteredThanimas.length === 0 && (
              <div className="text-center py-12">
                <HandHelping className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No thanimas found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new thanima.'}
                </p>
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
                    onClick={Array.isArray(deleteConfirm.id) ? handleBulkDeleteConfirm : handleDeleteConfirm}
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
    </div>
  );
};

export default UmrahThanima;
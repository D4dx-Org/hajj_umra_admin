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
  IdCard
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this thanima?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setSuccess('Thanima deleted successfully!');
      fetchThanimas();
    } catch (error) {
      setError(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} selected thanimas?`)) return;

    try {
      const token = localStorage.getItem('token');
      const deletePromises = selectedItems.map(id =>
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/thanima-umrah/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
      );

      await Promise.all(deletePromises);
      setSuccess(`${selectedItems.length} thanimas deleted successfully!`);
      setSelectedItems([]);
      fetchThanimas();
    } catch (error) {
      setError('Error during bulk delete: ' + error.message);
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
    // Create empty template with just headers
    const headers = [['name', 'phone', 'id']];
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 20 }, // name
      { wch: 15 }, // phone
      { wch: 10 }  // id
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thanima Template');
    XLSX.writeFile(wb, 'thanima_template.xlsx');
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', id: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  const startEdit = (thanima) => {
    setFormData({
      name: thanima.name,
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
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="md:col-span-3 flex gap-2">
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
                    <tr key={thanima._id} className="hover:bg-gray-50 transition-colors">
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
        </div>
      </div>
    </div>
  );
};

export default UmrahThanima;
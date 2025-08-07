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
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';

const UmrahNusuk = ({ isOpen }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nusuks, setNusuks] = useState([]);
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
    building: '',
    malayalamBuilding: '',
    urduBuilding: '',
    location: { lat: '', lng: '' }
  });

  useEffect(() => {
    fetchNusuks();
  }, []);

  const fetchNusuks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/nusuk-umrah`);
      setNusuks(response.data);
    } catch (error) {
      setError('Error fetching nusuks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.building.trim()) {
      setError('Name and building are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        name: formData.name.trim(),
        malayalamName: formData.malayalamName.trim() || undefined,
        urduName: formData.urduName.trim() || undefined,
        building: formData.building.trim(),
        malayalamBuilding: formData.malayalamBuilding.trim() || undefined,
        urduBuilding: formData.urduBuilding.trim() || undefined,
        location: {}
      };

      if (formData.location.lat && formData.location.lng) {
        submitData.location = {
          lat: parseFloat(formData.location.lat),
          lng: parseFloat(formData.location.lng)
        };
      }

      let response;
      if (editingId) {
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk-umrah/${editingId}`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk-umrah`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
      }

      setSuccess(editingId ? 'Nusuk updated successfully!' : 'Nusuk created successfully!');
      resetForm();
      fetchNusuks();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this nusuk?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/nusuk-umrah/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setSuccess('Nusuk deleted successfully!');
      fetchNusuks();
    } catch (error) {
      setError(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} selected nusuks?`)) return;

    try {
      const token = localStorage.getItem('token');
      const deletePromises = selectedItems.map(id =>
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/nusuk-umrah/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
      );

      await Promise.all(deletePromises);
      setSuccess(`${selectedItems.length} nusuks deleted successfully!`);
      setSelectedItems([]);
      fetchNusuks();
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setSuccess(`Bulk upload successful! ${response.data.count} nusuks added.`);
      fetchNusuks();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.duplicates) {
        setError(`Upload failed: Duplicate nusuks found - ${errorData.duplicates.join(', ')}`);
      } else if (errorData?.invalidRows) {
        setError(`Upload failed: Invalid data in rows ${errorData.invalidRows.join(', ')}`);
      } else {
        setError(errorData?.message || 'Upload failed');
      }
    }

    event.target.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      { 
        name: 'Nusuk Care Center', 
        malayalam_name: 'നുസുക് കെയർ സെന്റർ',
        urdu_name: 'نسک کیئر سینٹر',
        building: 'Alyad', 
        malayalam_building: 'അലിയാദ്',
        urdu_building: 'الیاد',
        latitude: 21.4201507503122235, 
        longitude: 39.8269900531054 
      },
      { 
        name: 'B200', 
        malayalam_name: 'ബി200',
        urdu_name: 'بی200',
        building: '1/110', 
        malayalam_building: '1/110',
        urdu_building: '1/110',
        latitude: 21.412691, 
        longitude: 39.883142 
      },
      { 
        name: 'B201', 
        malayalam_name: 'ബി201',
        urdu_name: 'بی201',
        building: 'Jamrat', 
        malayalam_building: 'ജമ്രത്',
        urdu_building: 'جمرات',
        latitude: '', 
        longitude: '' 
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nusuk Template');
    XLSX.writeFile(wb, 'nusuk_template.xlsx');
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      malayalamName: '',
      urduName: '',
      building: '', 
      malayalamBuilding: '',
      urduBuilding: '',
      location: { lat: '', lng: '' } 
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const startEdit = (nusuk) => {
    setFormData({
      name: nusuk.name,
      malayalamName: nusuk.malayalamName || '',
      urduName: nusuk.urduName || '',
      building: nusuk.building,
      malayalamBuilding: nusuk.malayalamBuilding || '',
      urduBuilding: nusuk.urduBuilding || '',
      location: {
        lat: nusuk.location?.lat || '',
        lng: nusuk.location?.lng || ''
      }
    });
    setEditingId(nusuk._id);
    setShowAddForm(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedNusuks = React.useMemo(() => {
    let sortableNusuks = [...nusuks];
    if (sortConfig.key) {
      sortableNusuks.sort((a, b) => {
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
    return sortableNusuks;
  }, [nusuks, sortConfig]);

  const filteredNusuks = sortedNusuks.filter(nusuk =>
    nusuk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nusuk.malayalamName && nusuk.malayalamName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nusuk.urduName && nusuk.urduName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    nusuk.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nusuk.malayalamBuilding && nusuk.malayalamBuilding.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nusuk.urduBuilding && nusuk.urduBuilding.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredNusuks.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredNusuks.map(nusuk => nusuk._id));
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
              <h1 className="text-2xl font-bold text-gray-900">Nusuk Management</h1>
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Total: {nusuks.length} nusuks
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
                placeholder="Search nusuks..."
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
                {editingId ? 'Edit Nusuk' : 'Add New Nusuk'}
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
                    placeholder="നുസുക്"
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
                    placeholder="نسک"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building *
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Malayalam Building
                  </label>
                  <input
                    type="text"
                    value={formData.malayalamBuilding}
                    onChange={(e) => setFormData({ ...formData, malayalamBuilding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="കെട്ടിടം"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urdu Building
                  </label>
                  <input
                    type="text"
                    value={formData.urduBuilding}
                    onChange={(e) => setFormData({ ...formData, urduBuilding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="عمارت"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.lat}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: { ...formData.location, lat: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="21.4225"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.lng}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: { ...formData.location, lng: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="39.8262"
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
                        checked={selectedItems.length === filteredNusuks.length && filteredNusuks.length > 0}
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
                      BUILDING
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      MALAYALAM BUILDING
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      URDU BUILDING
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      LOCATION
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredNusuks.map((nusuk, index) => (
                    <tr key={nusuk._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(nusuk._id)}
                          onChange={() => toggleSelectItem(nusuk._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm font-medium text-gray-900">{nusuk.name}</div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700">{nusuk.malayalamName || '-'}</div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700" dir="rtl">{nusuk.urduName || '-'}</div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700">{nusuk.building}</div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700">{nusuk.malayalamBuilding || '-'}</div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700" dir="rtl">{nusuk.urduBuilding || '-'}</div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700">
                          {nusuk.location?.lat && nusuk.location?.lng 
                            ? `${nusuk.location.lat}, ${nusuk.location.lng}`
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(nusuk)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(nusuk._id)}
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

            {filteredNusuks.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No nusuks found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new nusuk.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UmrahNusuk;
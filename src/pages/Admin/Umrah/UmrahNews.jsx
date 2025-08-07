import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, ArrowUpDown, ExternalLink, Download } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';
import { utils, write } from 'xlsx';

const UmrahNews = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newNews, setNewNews] = useState({
    title: '',
    malayalamTitle: '',
    urduTitle: '',
    link: '',
    description: '',
    malayalamDescription: '',
    urduDescription: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', direction: 'desc', type: 'date' });

  // Define the table columns
  const newsColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === newsData.length && newsData.length > 0}
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
      key: 'title',
      title: 'Title',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.title}
              onChange={(e) => handleEditChange(row._id, 'title', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return (
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate" title={row.title}>
              {row.title}
            </div>
          </div>
        );
      }
    },
    {
      key: 'malayalamTitle',
      title: 'Malayalam Title',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.malayalamTitle || ''}
              onChange={(e) => handleEditChange(row._id, 'malayalamTitle', e.target.value)}
              className="w-full p-1 border rounded"
            />
          );
        }
        return (
          <div className="max-w-xs">
            <div className="text-sm text-gray-900 truncate" title={row.malayalamTitle}>
              {row.malayalamTitle || '-'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'urduTitle',
      title: 'Urdu Title',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="text"
              value={row.urduTitle || ''}
              onChange={(e) => handleEditChange(row._id, 'urduTitle', e.target.value)}
              className="w-full p-1 border rounded"
              dir="rtl"
            />
          );
        }
        return (
          <div className="max-w-xs">
            <div className="text-sm text-gray-900 truncate" title={row.urduTitle} dir="rtl">
              {row.urduTitle || '-'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <textarea
              value={row.description || ''}
              onChange={(e) => handleEditChange(row._id, 'description', e.target.value)}
              className="w-full p-1 border rounded"
              rows="2"
            />
          );
        }
        return (
          <div className="max-w-sm">
            <div className="text-sm text-gray-600 line-clamp-2" title={row.description}>
              {row.description || 'N/A'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'malayalamDescription',
      title: 'Malayalam Description',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <textarea
              value={row.malayalamDescription || ''}
              onChange={(e) => handleEditChange(row._id, 'malayalamDescription', e.target.value)}
              className="w-full p-1 border rounded"
              rows="2"
            />
          );
        }
        return (
          <div className="max-w-sm">
            <div className="text-sm text-gray-600 line-clamp-2" title={row.malayalamDescription}>
              {row.malayalamDescription || '-'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'urduDescription',
      title: 'Urdu Description',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <textarea
              value={row.urduDescription || ''}
              onChange={(e) => handleEditChange(row._id, 'urduDescription', e.target.value)}
              className="w-full p-1 border rounded"
              rows="2"
              dir="rtl"
            />
          );
        }
        return (
          <div className="max-w-sm">
            <div className="text-sm text-gray-600 line-clamp-2" title={row.urduDescription} dir="rtl">
              {row.urduDescription || '-'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'link',
      title: 'Link',
      render: (row) => {
        if (editingId === row._id) {
          return (
            <input
              type="url"
              value={row.link || ''}
              onChange={(e) => handleEditChange(row._id, 'link', e.target.value)}
              className="w-full p-1 border rounded"
              placeholder="https://example.com"
            />
          );
        }
        return row.link ? (
          <a 
            href={row.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={14} />
            View Link
          </a>
        ) : 'N/A';
      }
    },
    {
      key: 'createdAt',
      title: 'Created At',
      render: (row) => {
        return new Date(row.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
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

  // Sorting options
  const sortOptions = [
    { value: 'title-alpha-asc', label: 'Title (A-Z)', field: 'title', direction: 'asc', type: 'alpha' },
    { value: 'title-alpha-desc', label: 'Title (Z-A)', field: 'title', direction: 'desc', type: 'alpha' },
    { value: 'malayalamTitle-alpha-asc', label: 'Malayalam Title (A-Z)', field: 'malayalamTitle', direction: 'asc', type: 'alpha' },
    { value: 'malayalamTitle-alpha-desc', label: 'Malayalam Title (Z-A)', field: 'malayalamTitle', direction: 'desc', type: 'alpha' },
    { value: 'urduTitle-alpha-asc', label: 'Urdu Title (A-Z)', field: 'urduTitle', direction: 'asc', type: 'alpha' },
    { value: 'urduTitle-alpha-desc', label: 'Urdu Title (Z-A)', field: 'urduTitle', direction: 'desc', type: 'alpha' },
    { value: 'createdAt-date-desc', label: 'Newest First', field: 'createdAt', direction: 'desc', type: 'date' },
    { value: 'createdAt-date-asc', label: 'Oldest First', field: 'createdAt', direction: 'asc', type: 'date' }
  ];

  // Fetch news data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah`);
        setNewsData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching umrah news data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setNewsData(newsData.map(item => {
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewsData(newsData.map(item => 
        item._id === row._id ? { ...item, ...response.data } : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah news data:", error);
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
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setNewsData(newsData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting umrah news data:', error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New News
  const handleAddNews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah`,
        newNews,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah`);
        setNewsData(updatedResponse.data);
        setNewNews({ 
          title: '',
          malayalamTitle: '',
          urduTitle: '',
          link: '',
          description: '',
          malayalamDescription: '',
          urduDescription: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah news data:", error);
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
      
      if (sortConfig.type === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
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

  // Filtered and sorted data
  const filteredNewsData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = newsData;
    
    if (lowerCaseSearch) {
      filtered = newsData.filter((item) => {
        return (
          (item.title && item.title.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamTitle && item.malayalamTitle.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduTitle && item.urduTitle.toLowerCase().includes(lowerCaseSearch)) ||
          (item.description && item.description.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamDescription && item.malayalamDescription.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduDescription && item.urduDescription.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }
    
    return sortData(filtered);
  }, [newsData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setNewsData(newsData.map(item => 
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredNewsData.map(row => row._id));
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

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          title: 'Sample News Title',
          malayalam_title: 'വാർത്ത ശീർഷകം സാമ്പിൾ',
          urdu_title: 'نمونہ خبر کا عنوان',
          link: 'https://example.com/news',
          description: 'Sample news description',
          malayalam_description: 'വാർത്തയുടെ വിവരണം സാമ്പിൾ',
          urdu_description: 'نمونہ خبر کی تفصیل',
        },
      ];

      const ws = utils.json_to_sheet([]);

      utils.sheet_add_aoa(
        ws,
        [["title", "malayalam_title", "urdu_title", "link", "description", "malayalam_description", "urdu_description"]],
        { origin: "A1" }
      );

      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      ws["!cols"] = [
        { wch: 30 }, // title
        { wch: 30 }, // malayalam_title
        { wch: 30 }, // urdu_title
        { wch: 40 }, // link
        { wch: 50 }, // description
        { wch: 50 }, // malayalam_description
        { wch: 50 }, // urdu_description
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "umrah_news_upload_template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating template:", error);
      setUploadError("Failed to download template. Please try again.");
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setUploadError("Please upload an Excel file (.xlsx or .xls)");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        setUploadError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(`Successfully uploaded ${response.data.count} news items`);
      setUploadError(null);

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/news-umrah`
      );
      setNewsData(updatedResponse.data);

      // Reset the file input
      event.target.value = "";
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError(
        error.response?.data?.message ||
          "Error processing file. Please try again."
      );
      setUploadSuccess(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0 md:ml-16"
        } pt-16`}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} />

      <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Umrah News Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredNewsData.length} news items
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
              {showAddForm ? 'Cancel' : 'Add News'}
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

        {/* New News Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah News</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Malayalam Title</label>
                <input
                  type="text"
                  value={newNews.malayalamTitle}
                  onChange={(e) => setNewNews({ ...newNews, malayalamTitle: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="വാർത്ത ശീർഷകം"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Title</label>
                <input
                  type="text"
                  value={newNews.urduTitle}
                  onChange={(e) => setNewNews({ ...newNews, urduTitle: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="خبر کا عنوان"
                  dir="rtl"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Link</label>
                <input
                  type="url"
                  value={newNews.link}
                  onChange={(e) => setNewNews({ ...newNews, link: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="https://example.com"
                />
              </div>
              <div className="mb-4 md:col-span-2">
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={newNews.description}
                  onChange={(e) => setNewNews({ ...newNews, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  rows="4"
                  placeholder="Enter news description..."
                />
              </div>
              <div className="mb-4 md:col-span-2">
                <label className="block text-sm font-medium">Malayalam Description</label>
                <textarea
                  value={newNews.malayalamDescription}
                  onChange={(e) => setNewNews({ ...newNews, malayalamDescription: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  rows="4"
                  placeholder="വാർത്തയുടെ വിവരണം..."
                />
              </div>
              <div className="mb-4 md:col-span-2">
                <label className="block text-sm font-medium">Urdu Description</label>
                <textarea
                  value={newNews.urduDescription}
                  onChange={(e) => setNewNews({ ...newNews, urduDescription: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  rows="4"
                  placeholder="خبر کی تفصیل..."
                  dir="rtl"
                />
              </div>
            </div>
            <button
              onClick={handleAddNews}
              disabled={!newNews.title}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add News
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search news..."
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
            <table className="min-w-full full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {newsColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-1text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNewsData.length === 0 ? (
                  <tr>
                    <td colSpan={newsColumns.length} className="px-4 py-1 text-center text-gray-500">
                      No news items found
                    </td>
                  </tr>
                ) : (
                  filteredNewsData.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      {newsColumns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <h3 className="text-lg font-semibold">Confirm Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id) 
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected news items?`
                  : 'Are you sure you want to delete this news item?'
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

export default UmrahNews;
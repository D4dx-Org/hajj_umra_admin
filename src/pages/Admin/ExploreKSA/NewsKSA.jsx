import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';

const News = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newNews, setNewNews] = useState({
    title: {
      english: '',
      malayalam: '',
      urdu: ''
    },
    link: '',
    description: {
      english: '',
      malayalam: '',
      urdu: ''
    }
  });
  const [originalData, setOriginalData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(newsData.map(row => row._id));
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
  const newsColumns = useMemo(() => [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={newsData.length > 0 && selectedRows.length === newsData.length}
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
    },    { 
      key: 'title', 
      title: 'Title (English)',
      render: (row) => <span className="truncate" title={row.title?.english || row.title || '-'}>{row.title?.english || row.title || '-'}</span>
    },    { 
      key: 'titleMalayalam', 
      title: 'Title (Malayalam)',
      render: (row) => <span className="truncate" title={row.title?.malayalam || '-'}>{row.title?.malayalam || '-'}</span>
    },    { 
      key: 'titleUrdu', 
      title: 'Title (Urdu)',
      render: (row) => <span className="truncate" title={row.title?.urdu || '-'}>{row.title?.urdu || '-'}</span>
    },
    {
      key: 'link',
      title: 'Link',
      render: (row) => {
        return row.link ? (
          <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {row.link}
          </a>
        ) : 'N/A';
      }
    },    { 
      key: 'description', 
      title: 'Description (English)',
      render: (row) => <span className="truncate" title={row.description?.english || row.description || '-'}>{row.description?.english || row.description || '-'}</span>
    },    { 
      key: 'descriptionMalayalam', 
      title: 'Description (Malayalam)',
      render: (row) => <span className="truncate" title={row.description?.malayalam || '-'}>{row.description?.malayalam || '-'}</span>
    },    { 
      key: 'descriptionUrdu', 
      title: 'Description (Urdu)',
      render: (row) => <span className="truncate" title={row.description?.urdu || '-'}>{row.description?.urdu || '-'}</span>
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
  ], [selectedRows, newsData.length]);

  // Fetch news data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/news`);
        setNewsData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching News data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on search
  const filteredNewsData = useMemo(() => {
    return newsData.filter(item =>
      (item.title?.english || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.title?.malayalam || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.title?.urdu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.english || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.malayalam || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.urdu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.link || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [newsData, searchTerm]);

  // Handle edit change
  const handleEditChange = (id, field, value) => {
    setNewsData(newsData.map(item => {
      if (item._id === id) {
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/news/${row._id}`,
        {
          title: row.title,
          link: row.link,
          description: row.description
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewsData(newsData.map(item =>
        item._id === row._id ? response.data : item
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating news data:", error);
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
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/news/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setNewsData(newsData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting news data:', error);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle add new news
  const handleAddNews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/news`,
        newNews,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewsData([...newsData, response.data]);
      setNewNews({ 
        title: { english: '', malayalam: '', urdu: '' }, 
        link: '', 
        description: { english: '', malayalam: '', urdu: '' } 
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding news data:", error);
    }
  };

  // Handle edit click
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setNewsData(newsData.map(item =>
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
            <h1 className="text-2xl font-bold">News Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredNewsData.length} news items
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
            <h2 className="text-lg font-bold mb-4">Add New News Item</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={newNews.title.english}
                    onChange={(e) => setNewNews({ 
                      ...newNews, 
                      title: { ...newNews.title, english: e.target.value } 
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title (Malayalam)</label>
                  <input
                    type="text"
                    value={newNews.title.malayalam}
                    onChange={(e) => setNewNews({ 
                      ...newNews, 
                      title: { ...newNews.title, malayalam: e.target.value } 
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title (Urdu)</label>
                  <input
                    type="text"
                    value={newNews.title.urdu}
                    onChange={(e) => setNewNews({ 
                      ...newNews, 
                      title: { ...newNews.title, urdu: e.target.value } 
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link</label>
                <input
                  type="text"
                  value={newNews.link}
                  onChange={(e) => setNewNews({ ...newNews, link: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={newNews.description.english}
                    onChange={(e) => setNewNews({ 
                      ...newNews, 
                      description: { ...newNews.description, english: e.target.value } 
                    })}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Malayalam)</label>
                  <textarea
                    value={newNews.description.malayalam}
                    onChange={(e) => setNewNews({ 
                      ...newNews, 
                      description: { ...newNews.description, malayalam: e.target.value } 
                    })}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Urdu)</label>
                  <textarea
                    value={newNews.description.urdu}
                    onChange={(e) => setNewNews({ 
                      ...newNews, 
                      description: { ...newNews.description, urdu: e.target.value } 
                    })}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAddNews}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add News Item
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredNewsData.length === 0 ? (
          <p className="text-center">No news items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {newsColumns.map((column) => (
                    <th key={column.key} className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNewsData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr className={`${editingId === row._id ? 'bg-blue-50' : ''}`}>
                      {newsColumns.map((column) => (
                        <td key={`${row._id}-${column.key}`} className="px-4 py-1 whitespace-nowrap">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={newsColumns.length} className="p-4">
                          <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold mb-4">Edit News Item</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">Title (English) *</label>
                                <input
                                  type="text"
                                  value={row.title?.english || ""}
                                  onChange={(e) => handleEditChange(row._id, 'title', { ...row.title, english: e.target.value })}
                                  placeholder="News title in English"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Title (Malayalam)</label>
                                <input
                                  type="text"
                                  value={row.title?.malayalam || ""}
                                  onChange={(e) => handleEditChange(row._id, 'title', { ...row.title, malayalam: e.target.value })}
                                  placeholder="വാർത്താ ശീർഷകം"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Title (Urdu)</label>
                                <input
                                  type="text"
                                  value={row.title?.urdu || ""}
                                  onChange={(e) => handleEditChange(row._id, 'title', { ...row.title, urdu: e.target.value })}
                                  placeholder="خبر کا عنوان"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Link</label>
                                <input
                                  type="url"
                                  value={row.link || ""}
                                  onChange={(e) => handleEditChange(row._id, 'link', e.target.value)}
                                  placeholder="https://example.com"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">Description (English)</label>
                                <textarea
                                  value={row.description?.english || ""}
                                  onChange={(e) => handleEditChange(row._id, 'description', { ...row.description, english: e.target.value })}
                                  placeholder="News description in English"
                                  rows="3"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Description (Malayalam)</label>
                                <textarea
                                  value={row.description?.malayalam || ""}
                                  onChange={(e) => handleEditChange(row._id, 'description', { ...row.description, malayalam: e.target.value })}
                                  placeholder="വാർത്താ വിവരണം"
                                  rows="3"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Description (Urdu)</label>
                                <textarea
                                  value={row.description?.urdu || ""}
                                  onChange={(e) => handleEditChange(row._id, 'description', { ...row.description, urdu: e.target.value })}
                                  placeholder="خبر کی تفصیل"
                                  rows="3"
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  dir="rtl"
                                />
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
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected news items?`
                : 'Are you sure you want to delete this news item?'}
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

export default News; 
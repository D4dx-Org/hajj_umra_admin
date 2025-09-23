import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import axios from "axios";

const News = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newNews, setNewNews] = useState({
    title: "",
    link: "",
    description: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedNews, setSelectedNews] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(newsData.map((row) => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select single row
  const handleSelectRow = (id) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
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
      isBulk: true,
    });
  };

  // Define the table columns
  const newsColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === newsData.length}
          onChange={(event) => handleSelectAll(event)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(event) => handleSelectRow(row._id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: "title",
      title: "Title",
      render: (row) => (
        <span className="truncate" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => (
        <span className="truncate" title={row.description || "N/A"}>
          {row.description || "N/A"}
        </span>
      ),
    },
    {
      key: "link",
      title: "Link",
      render: (row) => (
        <span className="truncate" title={row.link || "N/A"}>
          {row.link ? (
            <a
              href={row.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {row.link.length > 30
                ? `${row.link.substring(0, 30)}...`
                : row.link}
            </a>
          ) : (
            "N/A"
          )}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
      ),
    },
  ];

  // Fetch news data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/news`
        );
        setNewsData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching News data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on search
  const filteredNewsData = useMemo(() => {
    return newsData.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.link || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [newsData, searchTerm]);

  // Handle edit change
  const handleEditChange = (id, field, value) => {
    setNewsData(
      newsData.map((item) => {
        if (item._id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
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
        `${import.meta.env.VITE_BACKEND_URL}/news/${row._id}`,
        {
          title: row.title,
          link: row.link,
          description: row.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewsData(
        newsData.map((item) => (item._id === row._id ? response.data : item))
      );
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

      const ids = Array.isArray(deleteConfirm.id)
        ? deleteConfirm.id
        : [deleteConfirm.id];

      await Promise.all(
        ids.map((id) =>
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/news/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setNewsData(newsData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting news data:", error);
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
        `${import.meta.env.VITE_BACKEND_URL}/news`,
        newNews,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewsData([...newsData, response.data]);
      setNewNews({ title: "", link: "", description: "" });
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
    setNewsData(
      newsData.map((item) => (item._id === editingId ? originalData : item))
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle row click to show details
  const handleRowClick = (news) => {
    setSelectedNews(news);
    setShowDetails(true);
  };

  // Handle close details
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedNews(null);
  };

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} />
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />

      <div className={`${sidebarOpen ? "ml-72" : "ml-20"}`}>
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
              {showAddForm ? "Cancel" : "Add New"}
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New News Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) =>
                    setNewNews({ ...newNews, title: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link</label>
                <input
                  type="text"
                  value={newNews.link}
                  onChange={(e) =>
                    setNewNews({ ...newNews, link: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={newNews.description}
                  onChange={(e) =>
                    setNewNews({ ...newNews, description: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  rows="3"
                  dir="rtl"
                  style={{ textAlign: 'right' }}
                />
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
            <Search
              size={20}
              className="absolute left-3 top-3.5 text-gray-400"
            />
          </div>
        </div>

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredNewsData.length === 0 ? (
          <p className="text-center">No news found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {newsColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.key === "select"
                            ? "w-12"
                            : column.key === "title"
                            ? "w-32"
                            : column.key === "description"
                            ? "w-40"
                            : column.key === "link"
                            ? "w-40"
                            : column.key === "actions"
                            ? "w-20"
                            : ""
                        }`}
                      >
                        {column.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNewsData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={newsColumns.length}
                        className="px-2 py-2 text-center text-gray-500"
                      >
                        No news found
                      </td>
                    </tr>
                  ) : (
                    filteredNewsData.map((row) => (
                      <React.Fragment key={row._id}>
                        <tr
                          className={`hover:bg-gray-50 cursor-pointer ${
                            editingId === row._id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleRowClick(row)}
                        >
                          {newsColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-2 py-2 text-sm text-gray-900 ${
                                column.key === "title"
                                  ? "max-w-32 truncate"
                                  : column.key === "description"
                                  ? "max-w-40 truncate"
                                  : column.key === "link"
                                  ? "max-w-40 truncate"
                                  : column.key === "actions"
                                  ? "whitespace-nowrap"
                                  : "whitespace-nowrap"
                              }`}
                            >
                              {column.render(row)}
                            </td>
                          ))}
                        </tr>
                        {editingId === row._id && (
                          <tr>
                            <td colSpan={newsColumns.length} className="p-4">
                              <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                                <h2 className="text-lg font-bold mb-4">
                                  Edit News
                                </h2>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.title || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      placeholder="News title"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Link
                                    </label>
                                    <input
                                      type="url"
                                      value={row.link || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "link",
                                          e.target.value
                                        )
                                      }
                                      placeholder="News link (optional)"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Description
                                    </label>
                                    <textarea
                                      value={row.description || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      placeholder="News description (optional)"
                                      dir="rtl"
                                      style={{ textAlign: 'right' }}
                                      rows="4"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* News Details Modal */}
      {showDetails && selectedNews && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">News Details</h3>
              <button
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title:
                </label>
                <p className="text-sm text-gray-900">{selectedNews.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedNews.description || "No description available"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Link:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedNews.link ? (
                    <a
                      href={selectedNews.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedNews.link}
                    </a>
                  ) : (
                    "No link available"
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedNews.createdAt
                    ? new Date(selectedNews.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedNews.updatedAt
                    ? new Date(selectedNews.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                : "Are you sure you want to delete this news item?"}
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

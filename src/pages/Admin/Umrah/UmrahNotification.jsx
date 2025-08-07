import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Edit2,
  Save,
  X,
  Bell,
  FileText,
  Image,
  Link,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";

const UmrahNotification = ({ isOpen }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: "",
    malayalamTitle: "",
    urduTitle: "",
    description: "",
    malayalamDescription: "",
    urduDescription: "",
    type: "text",
    content: "",
    malayalamContent: "",
    urduContent: "",
  });

  const notificationTypes = [
    { value: "text", label: "Text", icon: <FileText size={16} /> },
    { value: "link", label: "Link", icon: <Link size={16} /> },
    { value: "image", label: "Image", icon: <Image size={16} /> },
    { value: "pdf", label: "PDF", icon: <FileText size={16} /> },
  ];

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL_V2
        }/notification-umrah?page=${currentPage}&limit=${itemsPerPage}`
      );
      setNotifications(response.data.notifications);
      setTotalPages(response.data.totalPages);
      setTotalNotifications(response.data.total);
    } catch (error) {
      setError("Error fetching notifications: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;

    setUploadingFile(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/notification-umrah/upload`,
        uploadFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.url;
    } catch (error) {
      setError("File upload failed: " + error.message);
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const submitData = {
        title: formData.title.trim(),
        malayalamTitle: formData.malayalamTitle.trim() || undefined,
        urduTitle: formData.urduTitle.trim() || undefined,
        description: formData.description.trim(),
        malayalamDescription: formData.malayalamDescription.trim() || undefined,
        urduDescription: formData.urduDescription.trim() || undefined,
        type: formData.type,
        content: formData.content.trim(),
        malayalamContent: formData.malayalamContent.trim() || undefined,
        urduContent: formData.urduContent.trim() || undefined,
      };

      let response;
      if (editingId) {
        response = await axios.put(
          `${
            import.meta.env.VITE_BACKEND_URL_V2
          }/notification-umrah/${editingId}`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/notification-umrah`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setSuccess(
        editingId
          ? "Notification updated successfully!"
          : "Notification created successfully!"
      );
      resetForm();
      fetchNotifications();
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL_V2}/notification-umrah/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Notification deleted successfully!");
      fetchNotifications();
    } catch (error) {
      setError(error.response?.data?.message || "Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedItems.length} selected notifications?`
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/notification-umrah/bulk-delete`,
        { ids: selectedItems },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(`${selectedItems.length} notifications deleted successfully!`);
      setSelectedItems([]);
      fetchNotifications();
    } catch (error) {
      setError("Error during bulk delete: " + error.message);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      pdf: ["application/pdf"],
    };

    const isValidType =
      formData.type === "image"
        ? allowedTypes.image.includes(file.type)
        : formData.type === "pdf"
        ? allowedTypes.pdf.includes(file.type)
        : false;

    if (!isValidType) {
      setError(`Please select a valid ${formData.type} file`);
      return;
    }

    const uploadedUrl = await handleFileUpload(file);
    if (uploadedUrl) {
      setFormData({ ...formData, content: uploadedUrl });
    }

    event.target.value = "";
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      malayalamTitle: "",
      urduTitle: "",
      description: "", 
      malayalamDescription: "",
      urduDescription: "",
      type: "text", 
      content: "",
      malayalamContent: "",
      urduContent: ""
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const startEdit = (notification) => {
    setFormData({
      title: notification.title,
      malayalamTitle: notification.malayalamTitle || "",
      urduTitle: notification.urduTitle || "",
      description: notification.description || "",
      malayalamDescription: notification.malayalamDescription || "",
      urduDescription: notification.urduDescription || "",
      type: notification.type,
      content: notification.content,
      malayalamContent: notification.malayalamContent || "",
      urduContent: notification.urduContent || "",
    });
    setEditingId(notification._id);
    setShowAddForm(true);
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.malayalamTitle && notification.malayalamTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notification.urduTitle && notification.urduTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.malayalamDescription && notification.malayalamDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notification.urduDescription && notification.urduDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.malayalamContent && notification.malayalamContent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notification.urduContent && notification.urduContent.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredNotifications.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        filteredNotifications.map((notification) => notification._id)
      );
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "image":
        return <Image size={16} className="text-green-600" />;
      case "pdf":
        return <FileText size={16} className="text-red-600" />;
      case "link":
        return <Link size={16} className="text-blue-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const renderContent = (notification) => {
    const { type, content } = notification;

    switch (type) {
      case "image":
        return (
          <div className="flex items-center gap-2">
            <img
              src={content}
              alt="Preview"
              className="w-8 h-8 object-cover rounded"
            />
            <span className="text-sm text-gray-600 truncate max-w-xs">
              {content}
            </span>
          </div>
        );
      case "pdf":
        return (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm truncate max-w-xs block"
          >
            View PDF
          </a>
        );
      case "link":
        return (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm truncate max-w-xs block"
          >
            {content}
          </a>
        );
      default:
        return (
          <div className="space-y-1">
            <div className="text-sm text-gray-700 truncate max-w-xs">
              <span className="font-medium">EN:</span> {content}
            </div>
            {notification.malayalamContent && (
              <div className="text-sm text-gray-600 truncate max-w-xs">
                <span className="font-medium">ML:</span> {notification.malayalamContent}
              </div>
            )}
            {notification.urduContent && (
              <div className="text-sm text-gray-600 truncate max-w-xs" dir="rtl">
                <span className="font-medium">UR:</span> {notification.urduContent}
              </div>
            )}
          </div>
        );
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

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0 md:ml-16"
        } pt-16`}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Notification Management
              </h1>
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Total: {totalNotifications} notifications
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Notification
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search notifications..."
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
                {editingId ? "Edit Notification" : "Add New Notification"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Malayalam Title
                    </label>
                    <input
                      type="text"
                      value={formData.malayalamTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, malayalamTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="അറിയിപ്പ് ശീർഷകം"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urdu Title
                    </label>
                    <input
                      type="text"
                      value={formData.urduTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, urduTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="اطلاع کا عنوان"
                      dir="rtl"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value,
                          content: "",
                          malayalamContent: "",
                          urduContent: "",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Malayalam Description
                    </label>
                    <textarea
                      value={formData.malayalamDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, malayalamDescription: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="വിവരണം നൽകുക..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urdu Description
                    </label>
                    <textarea
                      value={formData.urduDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, urduDescription: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="تفصیل درج کریں..."
                      dir="rtl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  {formData.type === "text" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          English Content *
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your text content..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Malayalam Content
                        </label>
                        <textarea
                          value={formData.malayalamContent}
                          onChange={(e) =>
                            setFormData({ ...formData, malayalamContent: e.target.value })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="മലയാളം ഉള്ളടക്കം നൽകുക..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Urdu Content
                        </label>
                        <textarea
                          value={formData.urduContent}
                          onChange={(e) =>
                            setFormData({ ...formData, urduContent: e.target.value })
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="اردو مواد درج کریں..."
                          dir="rtl"
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === "link" && (
                    <input
                      type="url"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                      required
                    />
                  )}

                  {(formData.type === "image" || formData.type === "pdf") && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept={formData.type === "image" ? "image/*" : ".pdf"}
                        onChange={handleFileSelect}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={uploadingFile}
                      />
                      {uploadingFile && (
                        <div className="text-sm text-blue-600">
                          Uploading file...
                        </div>
                      )}
                      {formData.content && (
                        <div className="text-sm text-green-600">
                          File uploaded: {formData.content}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploadingFile}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {editingId ? "Update" : "Save"}
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
                        checked={
                          selectedItems.length ===
                            filteredNotifications.length &&
                          filteredNotifications.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      TITLE
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      MALAYALAM TITLE
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      URDU TITLE
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      TYPE
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      CONTENT
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
                  {filteredNotifications.map((notification) => (
                    <tr
                      key={notification._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(notification._id)}
                          onChange={() => toggleSelectItem(notification._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </div>
                        {notification.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {notification.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700">
                          {notification.malayalamTitle || '-'}
                        </div>
                        {notification.malayalamDescription && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {notification.malayalamDescription}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700" dir="rtl">
                          {notification.urduTitle || '-'}
                        </div>
                        {notification.urduDescription && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs" dir="rtl">
                            {notification.urduDescription}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span className="text-sm text-gray-700 capitalize">
                            {notification.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1">
                        {renderContent(notification)}
                      </td>
                      <td className="px-4 py-1">
                        <div className="text-sm text-gray-700">
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(notification)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(notification._id)}
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

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No notifications found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "Get started by adding a new notification."}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalNotifications)} of{" "}
                {totalNotifications} notifications
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UmrahNotification;

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
  AlertTriangle,
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
    coverImage: "",
    coverImageFile: null,
  });
  const [contents, setContents] = useState([
    { type: "text", value: "", valueMalayalam: "", valueUrdu: "" },
  ]);

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

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (contents.length === 0 || contents.every(c => !c.value.trim())) {
      setError("At least one content item is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Upload cover image if provided
      let coverImageUrl = formData.coverImage;
      if (formData.coverImageFile) {
        coverImageUrl = await handleFileUpload(formData.coverImageFile);
        if (!coverImageUrl) {
          setError("Failed to upload cover image");
          return;
        }
      }

      // Process multiple contents
      const processedContents = [];
      for (const content of contents) {
        if (!content.value.trim()) continue;

        let finalValue = content.value.trim();
        let finalValueMalayalam = content.valueMalayalam?.trim() || "";
        let finalValueUrdu = content.valueUrdu?.trim() || "";

        // Upload file if it's a new file for image/pdf
        if ((content.type === "image" || content.type === "pdf") && content.file) {
          const uploadedUrl = await handleFileUpload(content.file);
          if (!uploadedUrl) {
            setError(`Failed to upload ${content.type} file`);
            return;
          }
          finalValue = uploadedUrl;
        }

        processedContents.push({
          type: content.type,
          value: finalValue,
          valueMalayalam: finalValueMalayalam,
          valueUrdu: finalValueUrdu,
        });
      }

      if (processedContents.length === 0) {
        setError("Please add at least one content item");
        return;
      }

      const submitData = {
        title: formData.title.trim(),
        malayalamTitle: formData.malayalamTitle.trim() || undefined,
        urduTitle: formData.urduTitle.trim() || undefined,
        description: formData.description.trim() || undefined,
        malayalamDescription: formData.malayalamDescription.trim() || undefined,
        urduDescription: formData.urduDescription.trim() || undefined,
        coverImage: coverImageUrl || "",
        contents: processedContents,
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

  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.id;
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
      setDeleteConfirm({ show: false, id: null });
      fetchNotifications();
    } catch (error) {
      setError(error.response?.data?.message || "Delete failed");
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
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/notification-umrah/bulk-delete`,
        { ids: ids },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(`${ids.length} notifications deleted successfully!`);
      setSelectedItems([]);
      setDeleteConfirm({ show: false, id: null });
      fetchNotifications();
    } catch (error) {
      setError("Error during bulk delete: " + error.message);
      setDeleteConfirm({ show: false, id: null });
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
      coverImage: "",
      coverImageFile: null,
    });
    setContents([{ type: "text", value: "", valueMalayalam: "", valueUrdu: "" }]);
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
      coverImage: notification.coverImage || "",
      coverImageFile: null,
    });
    
    // Set contents for editing
    if (notification.contents && notification.contents.length > 0) {
      setContents(
        notification.contents.map((c) => ({
          type: c.type,
          value: c.value || "",
          valueMalayalam: c.valueMalayalam || "",
          valueUrdu: c.valueUrdu || "",
          file: null,
        }))
      );
    } else {
      setContents([{ type: "text", value: "", valueMalayalam: "", valueUrdu: "" }]);
    }
    
    setEditingId(notification._id);
    setShowAddForm(true);
  };

  const addContentItem = () => {
    setContents([
      ...contents,
      { type: "text", value: "", valueMalayalam: "", valueUrdu: "", file: null },
    ]);
  };

  const removeContentItem = (index) => {
    const newContents = contents.filter((_, i) => i !== index);
    if (newContents.length === 0) {
      setContents([{ type: "text", value: "", valueMalayalam: "", valueUrdu: "" }]);
    } else {
      setContents(newContents);
    }
  };

  const updateContentType = (index, newType) => {
    const newContents = [...contents];
    newContents[index].type = newType;
    newContents[index].value = "";
    newContents[index].valueMalayalam = "";
    newContents[index].valueUrdu = "";
    newContents[index].file = null;
    setContents(newContents);
  };

  const filteredNotifications = notifications.filter((notification) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesTitle =
      notification.title?.toLowerCase().includes(searchLower) ||
      notification.malayalamTitle?.toLowerCase().includes(searchLower) ||
      notification.urduTitle?.toLowerCase().includes(searchLower);
    const matchesDescription =
      notification.description?.toLowerCase().includes(searchLower) ||
      notification.malayalamDescription?.toLowerCase().includes(searchLower) ||
      notification.urduDescription?.toLowerCase().includes(searchLower);
    const matchesContent = (notification.contents || []).some(
      (content) =>
        content.value?.toLowerCase().includes(searchLower) ||
        content.valueMalayalam?.toLowerCase().includes(searchLower) ||
        content.valueUrdu?.toLowerCase().includes(searchLower)
    );
    return matchesTitle || matchesDescription || matchesContent;
  });

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
    const contents = notification.contents || [];
    if (contents.length === 0) return "-";

    return (
      <div className="space-y-2">
        {contents.map((content, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              {content.type.toUpperCase()}:
            </span>
            {content.type === "image" && (
              <div className="flex items-center gap-2">
                <img
                  src={content.value}
                  alt="Preview"
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-sm text-gray-600 truncate max-w-xs">
                  {content.value}
                </span>
              </div>
            )}
            {content.type === "pdf" && (
              <a
                href={content.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm truncate max-w-xs"
              >
                View PDF
              </a>
            )}
            {content.type === "link" && (
              <a
                href={content.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm truncate max-w-xs"
              >
                {content.value}
              </a>
            )}
            {content.type === "text" && (
              <div className="space-y-1">
                <div className="text-sm text-gray-700 truncate max-w-xs">
                  <span className="font-medium">EN:</span> {content.value}
                </div>
                {content.valueMalayalam && (
                  <div className="text-sm text-gray-600 truncate max-w-xs">
                    <span className="font-medium">ML:</span> {content.valueMalayalam}
                  </div>
                )}
                {content.valueUrdu && (
                  <div className="text-sm text-gray-600 truncate max-w-xs" dir="rtl">
                    <span className="font-medium">UR:</span> {content.valueUrdu}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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

                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coverImageFile: e.target.files[0],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.coverImage && !formData.coverImageFile && (
                    <div className="mt-2">
                      <img
                        src={formData.coverImage}
                        alt="Current cover"
                        className="max-w-xs max-h-48 object-cover rounded"
                      />
                    </div>
                  )}
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

                {/* Multiple Contents */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Contents *
                    </label>
                    <button
                      type="button"
                      onClick={addContentItem}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Content
                    </button>
                  </div>
                  {contents.map((content, index) => (
                    <div
                      key={index}
                      className="mb-4 p-4 border border-gray-300 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <select
                          value={content.type}
                          onChange={(e) => updateContentType(index, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {notificationTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {contents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContentItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {content.type === "text" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              English Content *
                            </label>
                            <textarea
                              value={content.value}
                              onChange={(e) => {
                                const newContents = [...contents];
                                newContents[index].value = e.target.value;
                                setContents(newContents);
                              }}
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
                              value={content.valueMalayalam}
                              onChange={(e) => {
                                const newContents = [...contents];
                                newContents[index].valueMalayalam = e.target.value;
                                setContents(newContents);
                              }}
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
                              value={content.valueUrdu}
                              onChange={(e) => {
                                const newContents = [...contents];
                                newContents[index].valueUrdu = e.target.value;
                                setContents(newContents);
                              }}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="اردو مواد درج کریں..."
                              dir="rtl"
                            />
                          </div>
                        </div>
                      )}

                      {content.type === "link" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Link URL *
                          </label>
                          <input
                            type="url"
                            value={content.value}
                            onChange={(e) => {
                              const newContents = [...contents];
                              newContents[index].value = e.target.value;
                              setContents(newContents);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com"
                            required
                          />
                        </div>
                      )}

                      {(content.type === "image" || content.type === "pdf") && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept={content.type === "image" ? "image/*" : ".pdf"}
                            onChange={(e) => {
                              const newContents = [...contents];
                              newContents[index].file = e.target.files[0];
                              setContents(newContents);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={uploadingFile}
                          />
                          {uploadingFile && (
                            <div className="text-sm text-blue-600">
                              Uploading file...
                            </div>
                          )}
                          {content.value && !content.file && (
                            <div className="text-sm text-green-600">
                              Current: {content.type === "image" ? (
                                <img src={content.value} alt="Current" className="max-w-xs max-h-32 object-cover rounded mt-2" />
                              ) : (
                                <a href={content.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View Current PDF
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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
              <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left w-12">
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
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-24">
                      TITLE
                    </th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-24">
                      MALAYALAM TITLE
                    </th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-24">
                      URDU TITLE
                    </th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-20">
                      COVER IMAGE
                    </th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-24">
                      CONTENTS
                    </th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-20">
                      CREATED
                    </th>
                    <th className="px-2 py-2 text-left text-sm font-medium text-gray-700 uppercase tracking-wider w-20">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <React.Fragment key={notification._id}>
                      <tr
                        className={`hover:bg-gray-50 transition-colors ${editingId === notification._id ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(notification._id)}
                            onChange={() => toggleSelectItem(notification._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-sm font-medium text-gray-900 max-w-24 truncate" title={notification.title}>
                            {notification.title}
                          </div>
                          {notification.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-24" title={notification.description}>
                              {notification.description}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-sm text-gray-700 max-w-24 truncate" title={notification.malayalamTitle || '-'}>
                            {notification.malayalamTitle || '-'}
                          </div>
                          {notification.malayalamDescription && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-24" title={notification.malayalamDescription}>
                              {notification.malayalamDescription}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-sm text-gray-700 max-w-24 truncate" dir="rtl" title={notification.urduTitle || '-'}>
                            {notification.urduTitle || '-'}
                          </div>
                          {notification.urduDescription && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-24" dir="rtl" title={notification.urduDescription}>
                              {notification.urduDescription}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {notification.coverImage ? (
                            <img
                              src={notification.coverImage}
                              alt="Cover"
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No cover</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
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
                      {editingId === notification._id && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Notification</h3>
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
                                {/* Title Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Title Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.title || ""}
                                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                      placeholder="Notification title"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Malayalam Title
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.malayalamTitle || ""}
                                      onChange={(e) => setFormData({ ...formData, malayalamTitle: e.target.value })}
                                      placeholder="മലയാളം ശീർഷകം"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Title
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.urduTitle || ""}
                                      onChange={(e) => setFormData({ ...formData, urduTitle: e.target.value })}
                                      placeholder="اردو عنوان"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      dir="rtl"
                                    />
                                  </div>
                                </div>

                                {/* Type and Content */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Type & Content</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Type
                                    </label>
                                    <select
                                      value={formData.type || ""}
                                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      {notificationTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                          {type.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Content
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.content || ""}
                                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                      placeholder="Notification content"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Description - Full Width */}
                              <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-4">Description Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Description
                                    </label>
                                    <textarea
                                      value={formData.description || ""}
                                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                      placeholder="Notification description"
                                      rows="4"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Malayalam Description
                                    </label>
                                    <textarea
                                      value={formData.malayalamDescription || ""}
                                      onChange={(e) => setFormData({ ...formData, malayalamDescription: e.target.value })}
                                      placeholder="മലയാളം വിവരണം"
                                      rows="4"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Description
                                    </label>
                                    <textarea
                                      value={formData.urduDescription || ""}
                                      onChange={(e) => setFormData({ ...formData, urduDescription: e.target.value })}
                                      placeholder="اردو تفصیل"
                                      rows="4"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      dir="rtl"
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
                    ? `Are you sure you want to delete ${deleteConfirm.id.length} selected notifications? This action cannot be undone.`
                    : 'Are you sure you want to delete this notification? This action cannot be undone.'}
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

export default UmrahNotification;

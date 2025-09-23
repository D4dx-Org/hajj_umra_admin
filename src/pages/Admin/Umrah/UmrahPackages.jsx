import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  Upload,
  Image,
  Checkbox,
  DatePicker,
} from "antd";

import {
  Settings,
  Search,
  AlertTriangle,
  Trash2,
  Edit,
  Plus,
  UploadCloud,
  X,
  RotateCcw,
  Download,
  Play,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { read, utils, write } from "xlsx";
// Import your Sidebar and Navbar components
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const UmrahPackages = () => {
  
  const API_URL = `${import.meta.env.VITE_BACKEND_URL_V2}/umrah-umrah-packages`;
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRows, setSelectedRows] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Image upload states (only initialize for image fields)
  const [uploadedFiles, setUploadedFiles] = useState({
    image: []
  });
  const [fileList, setFileList] = useState({
    image: []
  });
  const [existingImage, setExistingImage] = useState([]);

  // Fetch data
  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}?page=${page}&limit=${pageSize}`);
      
      setData(response.data.entries || response.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.count || response.data.total || response.data.entries?.length || 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} entries`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // File upload validation function
  const beforeUploadFile = (file, fileType) => {
    const isValidType = fileType === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/");
    
    if (!isValidType) {
      message.error(`Please upload a valid ${fileType} file!`);
      return false;
    }
    
    const maxSize = fileType === "image" ? 5 : 50; // 5MB for images, 50MB for videos
    const isValidSize = file.size / 1024 / 1024 < maxSize;
    if (!isValidSize) {
      message.error(`${fileType} must be smaller than ${maxSize}MB!`);
      return false;
    }
    
    return false; // Prevent automatic upload
  };

  // File upload configuration for images
  const imageUploadProps = {
    showUploadList: false,
    multiple: false,
  };

  // Handle file change for images
  const handleFileChange = (info, fieldName) => {
    const { fileList } = info;
    const maxImages = 20;

    if (fileList.length > maxImages) {
      message.warning(`Maximum ${maxImages} images allowed. Only the first ${maxImages} images will be kept.`);
    }

    const limitedFileList = fileList.slice(0, maxImages);
    const files = limitedFileList.map((item) => item.originFileObj || item).filter(Boolean);

    setUploadedFiles((prev) => ({
      ...prev,
      [fieldName]: files,
    }));
    setFileList((prev) => ({
      ...prev,
      [fieldName]: limitedFileList,
    }));
  };

  // Remove specific image from image
  const removeImageFile = (index) => {
    setUploadedFiles((prev) => {
      const newImages = prev.image.filter((_, i) => i !== index);
      return { ...prev, image: newImages };
    });
    setFileList((prev) => {
      const newFileList = prev.image.filter((_, i) => i !== index);
      return { ...prev, image: newFileList };
    });
    message.success("Image removed successfully");
  };

  // Remove existing image from image
  const removeExistingImage = (index) => {
    const updatedImages = existingImage.filter((_, i) => i !== index);
    setExistingImage(updatedImages);
    form.setFieldsValue({ image: updatedImages });
    form.validateFields(["image"]);
    message.success("Existing image removed successfully");
  };

  // Clear all new uploaded images for image
  const clearAllNewImage = () => {
    setUploadedFiles((prev) => ({ ...prev, image: [] }));
    setFileList((prev) => ({ ...prev, image: [] }));
    message.success("All new images cleared");
  };

  // Clear all existing images for image
  const clearAllExistingImage = () => {
    setExistingImage([]);
    form.setFieldsValue({ image: [] });
    form.validateFields(["image"]);
    message.success("All existing images cleared");
  };

  // Upload file to server
  const uploadFileToServer = async (file, fileType) => {
    if (!file) return null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data.url;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      throw new Error(`Failed to upload ${fileType}: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // Handle bulk file upload
  const handleBulkFileUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post(`${API_URL}/bulk-upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      if (response.data.details?.errors?.length > 0) {
        message.warning(
          `Upload completed with ${response.data.details.errors.length} errors. Check console for details.`
        );
        console.log("Upload errors:", response.data.details.errors);
      } else {
        message.success(response.data.message || "Upload completed successfully");
      }
      
      setUploadModalVisible(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
    
    return false; // Prevent default upload behavior
  };

  // Upload props for Dragger
  const bulkUploadProps = {
    beforeUpload: handleBulkFileUpload,
    accept: ".xlsx, .xls",
    showUploadList: false,
  };

  // Handle pagination change
  const handleTableChange = (paginationInfo, filters, sorter) => {
    fetchData(paginationInfo.current, paginationInfo.pageSize);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      let imageUrls = existingImage || [];

      // Upload multiple images for image if they exist
      if (uploadedFiles.image && uploadedFiles.image.length > 0) {
        try {
          message.loading("Uploading image images...", 0);
          const uploadPromises = uploadedFiles.image.map((file) => uploadFileToServer(file, "image"));
          const uploadedUrls = await Promise.all(uploadPromises);
          imageUrls = [...imageUrls, ...uploadedUrls.filter((url) => url)];
          message.destroy();
        } catch (error) {
          message.destroy();
          message.error("Failed to upload image images");
          return;
        }
      }

      const formData = {
        ...values,
        image: imageUrls
      };

      if (editingId) {
        // Update existing entry
        const response = await axios.put(`${API_URL}/${editingId}`, formData);
        message.success("Entry updated successfully");
      } else {
        // Create new entry
        const response = await axios.post(API_URL, formData);
        message.success("Entry created successfully");
      }

      resetModalState();
      fetchData();
    } catch (error) {
      console.error("Error saving data:", error);
      message.error(error.response?.data?.message || "Failed to save data");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset modal state
  const resetModalState = () => {
    setModalVisible(false);
    setEditingId(null);
    setSubmitting(false);
    form.resetFields();
    setUploadedFiles({ image: []
    });
    setFileList({ image: []
    });
    setExistingImage([]);
  };

  // Handle deletion
  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    const ids = Array.isArray(deleteConfirm.id)
      ? deleteConfirm.id
      : [deleteConfirm.id];

    try {
      for (const id of ids) {
        await axios.delete(`${API_URL}/${id}`);
      }

      setData(data.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
      message.success("Entry(s) deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting entries:", error);
      message.error("Failed to delete entry(s)");
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0) return;

    if (action === "delete") {
      setDeleteConfirm({
        show: true,
        id: selectedRows,
        isBulk: true,
      });
      return;
    }

    message.info("Bulk actions other than delete are not implemented");
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      return Object.keys(item).some(key => 
        String(item[key] || '').toLowerCase().includes(searchStr)
      );
    });
  }, [data, searchTerm]);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredData.map((row) => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select row
  const handleSelectRow = (id) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle row click to show details
  const handleRowClick = (item, event) => {
    // Prevent row click when clicking on buttons or checkboxes
    if (event.target.closest('button') || event.target.closest('input[type="checkbox"]')) {
      return;
    }
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // Download template function
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API_URL}/template/download`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "umrahpackages_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Failed to download template");
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === filteredData.length && filteredData.length > 0}
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
      ),
    },
    {
      key: "id",
      title: "ID",
      render: (row) => (
        <span className="truncate" title={row.id}>
          {row.id}
        </span>
      ),
    },
    {
      key: "packageName",
      title: "packageName",
      render: (row) => (
        <span className="truncate" title={row.packageName || '-'}>
          {row.packageName || '-'}
        </span>
      ),
    },
              {
      key: "price",
      title: "price",
      render: (row) => (
        <span className="truncate" title={row.price || '-'}>
          {row.price || '-'}
        </span>
      ),
    },
              {
      key: "duration",
      title: "duration",
      render: (row) => (
        <span className="truncate" title={row.duration || '-'}>
          {row.duration || '-'}
        </span>
      ),
    },
              {
      key: "description",
      title: "description",
      render: (row) => (
        <span className="truncate" title={row.description || '-'}>
          {row.description || '-'}
        </span>
      ),
    },
              {
        key: "image",
        title: "image",
        render: (row) => {
          if (row.image && Array.isArray(row.image) && row.image.length > 0) {
            return (
              <div className="flex items-center gap-1">
                <Image src={row.image[0]} width={40} height={40} className="object-cover rounded" />
                {row.image.length > 1 && (
                  <span className="text-xs text-gray-500">+{row.image.length - 1}</span>
                )}
              </div>
            );
          }
          return '-';
        },
      },
              {
      key: "inclusions",
      title: "inclusions",
      render: (row) => (
        <span className="truncate" title={row.inclusions || '-'}>
          {row.inclusions || '-'}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingId(row._id);
              const recordImage = row.image || [];
              setExistingImage(recordImage);
              
              form.setFieldsValue({
                ...row,
                image: row.image || []
              });
              
              setUploadedFiles({ image: []
              });
              setFileList({ image: []
              });
              setModalVisible(true);
            }}
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

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} className="hidden md:block w-64" />
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
        className="md:px-6 px-4"
      />

      <div className={(sidebarOpen ? "ml-72" : "ml-20") + " transition-all duration-300 pr-6"}>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mt-20 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings size={24} />
              Umrah Packages
            </h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm w-fit">
              Total: {filteredData.length} entries
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 border-0 font-normal min-w-[120px] h-[40px]"
              >
                <Trash2 size={16} />
                Delete ({selectedRows.length})
              </button>
            )}

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600 border-0 font-normal min-w-[120px] h-[40px]"
            >
              <Download size={16} />
              Template
            </button>

            <button
              onClick={() => setUploadModalVisible(true)}
              className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 border-0 font-normal min-w-[120px] h-[40px]"
            >
              <UploadCloud size={16} />
              Upload
            </button>

            <button
              onClick={() => {
                setEditingId(null);
                form.resetFields();
                setModalVisible(true);
              }}
              className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 border-0 font-normal min-w-[120px] h-[40px]"
            >
              <Plus size={16} />
              Add Entry
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search
              size={20}
              className="absolute left-3 top-3.5 text-gray-400"
            />
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id)
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected entries? This action cannot be undone.`
                  : "Are you sure you want to delete this entry? This action cannot be undone."}
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
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.key === "select" ? "w-12" : column.key === "id" ? "w-16" : column.key === "actions" ? "w-20" : ""}`}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No entries found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr 
                      key={row._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-2 py-2 text-sm text-gray-900 ${column.key === "id" ? "max-w-16 truncate" : column.key === "actions" ? "whitespace-nowrap" : ""}`}
                        >
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

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Entry Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">ID</label>
                        <p className="text-gray-900 font-medium">{selectedItem.id}</p>
                      </div>
                      <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">packageName</label>
      <p className="text-gray-900">{`${selectedItem.packageName || 'Not provided'}`}</p>
    </div>
              <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">price</label>
      <p className="text-gray-900">{`${selectedItem.price || 'Not provided'}`}</p>
    </div>
              <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">duration</label>
      <p className="text-gray-900">{`${selectedItem.duration || 'Not provided'}`}</p>
    </div>
              <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">description</label>
      <p className="text-gray-900">{`${selectedItem.description || 'Not provided'}`}</p>
    </div>
              <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">image</label>
        {selectedItem.image && Array.isArray(selectedItem.image) && selectedItem.image.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {selectedItem.image.map((imageUrl, index) => (
              <div key={index} className="relative">
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full h-20 object-cover rounded border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-20 hidden items-center justify-center text-xs text-gray-500 bg-gray-100 rounded border">
                  IMG {index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images available</p>
        )}
      </div>
              <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">inclusions</label>
      <p className="text-gray-900">{`${selectedItem.inclusions || 'Not provided'}`}</p>
    </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Created At</label>
                        <p className="text-gray-900 text-sm">
                          {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Updated At</label>
                        <p className="text-gray-900 text-sm">
                          {selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Database ID</label>
                        <p className="text-gray-900 text-sm font-mono">{selectedItem._id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Settings size={20} />
              <span>
                {editingId
                  ? "Edit Entry"
                  : "Add New Entry"}
              </span>
            </div>
          }
          open={modalVisible}
          onCancel={resetModalState}
          footer={null}
          width={700}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="id"
                  label="Entry ID"
                  rules={[
                    { required: true, message: "Please enter entry ID" },
                    { min: 1, message: "Entry ID cannot be empty" },
                    {
                      max: 50,
                      message: "Entry ID cannot exceed 50 characters",
                    },
                  ]}
                >
                  <Input placeholder="Enter unique entry ID" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="packageName" label="packageName">
          <Input placeholder="Enter packageName" />
        </Form.Item>
          <Form.Item name="price" label="price">
          <Input type="number" placeholder="Enter price" />
        </Form.Item>
          <Form.Item name="duration" label="duration">
          <Input placeholder="Enter duration" />
        </Form.Item>
          <Form.Item name="description" label="description">
          <TextArea rows={4} placeholder="Enter description" />
        </Form.Item>
          <Form.Item label={`Multiple Images Upload (${uploadedFiles.image?.length || 0}/20)`}>
          <Dragger
            {...imageUploadProps}
            accept="image/*"
            multiple={true}
            maxCount={20}
            onChange={(info) => handleFileChange(info, "image")}
            beforeUpload={(file) => beforeUploadFile(file, "image")}
          >
            <p className="ant-upload-drag-icon">
              <UploadCloud size={40} className="mx-auto text-blue-500" />
            </p>
            <p className="ant-upload-text">Click or drag images to upload</p>
            <p className="ant-upload-hint">Support for jpg, png, gif. Max size 5MB each. Maximum 20 images allowed.</p>
          </Dragger>
          {/* Display images preview */}
          {((editingId && existingImage && existingImage.length > 0) || (uploadedFiles.image && uploadedFiles.image.length > 0)) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-700">
                  Images ({(existingImage?.length || 0) + (uploadedFiles.image?.length || 0)}/20)
                </div>
                <div className="flex gap-2">
                  {editingId && existingImage && existingImage.length > 0 && (
                    <button type="button" onClick={clearAllExistingImage} className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors">Clear Existing</button>
                  )}
                  {uploadedFiles.image && uploadedFiles.image.length > 0 && (
                    <button type="button" onClick={clearAllNewImage} className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors">Clear New</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {editingId && existingImage && existingImage.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="relative w-16 h-16 border-2 border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                      <img src={imageUrl} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 rounded-br">E{index + 1}</div>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeExistingImage(index); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 z-20 opacity-90 hover:opacity-100">×</button>
                  </div>
                ))}
                {uploadedFiles.image && uploadedFiles.image.map((file, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <div className="relative w-16 h-16 border-2 border-green-200 rounded-lg overflow-hidden bg-green-50">
                      {file && file.type?.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-full h-full object-cover" /> : null}
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 rounded-br">N{index + 1}</div>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImageFile(index); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 z-20 opacity-90 hover:opacity-100">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form.Item>
          <Form.Item name="inclusions" label="inclusions">
          <TextArea rows={4} placeholder="Enter inclusions" />
        </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Plus size={18} />}
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"} Entry
                </Button>
                <Button onClick={resetModalState} disabled={submitting}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Upload Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <UploadCloud size={20} />
              <span>Upload Excel File</span>
            </div>
          }
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Download the template first to see the required format</li>
                <li>• Fill in your data following the template structure</li>
                <li>• Upload only .xlsx or .xls files</li>
                <li>• Duplicate IDs will be skipped</li>
              </ul>
            </div>

            <Dragger {...bulkUploadProps} className="upload-dragger">
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for single Excel file upload (.xlsx, .xls)
              </p>
            </Dragger>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button onClick={() => setUploadModalVisible(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UmrahPackages;
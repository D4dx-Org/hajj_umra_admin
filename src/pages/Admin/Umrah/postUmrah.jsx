import React, { useState, useEffect, useMemo } from "react";
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
} from "antd";

import {
  CheckCircle,
  Search,
  AlertTriangle,
  Trash2,
  Edit,
  Plus,
  UploadCloud,
  X,
  RotateCcw,
  Download,
} from "lucide-react";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { read, utils, write } from "xlsx";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const PostUmrahManagement = () => {
  const [postUmrahData, setPostUmrahData] = useState([]);
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
  const [uploadedFiles, setUploadedFiles] = useState({
    images: [],
    video: null,
  });
  const [fileList, setFileList] = useState({
    images: [],
    video: [],
  });
  const [existingImages, setExistingImages] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [selectedPostUmrah, setSelectedPostUmrah] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Handle row click to show details
  const handleRowClick = (postUmrah, event) => {
    // Prevent row click when clicking on buttons or checkboxes
    if (
      event.target.closest("button") ||
      event.target.closest('input[type="checkbox"]')
    ) {
      return;
    }
    setSelectedPostUmrah(postUmrah);
    setShowDetailModal(true);
  };

  // Fetch post-umrah data
  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah?limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPostUmrahData(response.data.postUmrah || []);
      setPagination({
        ...pagination,
        total: response.data.count || 0,
      });
    } catch (error) {
      console.error(
        "Error fetching post-umrah data:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        message.error("Authentication failed. Please log in again.");
        localStorage.removeItem("token");
      } else {
        message.error("Failed to fetch data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // File upload configuration
  const uploadProps = {
    beforeUpload: (file, fileType) => {
      const isValidType =
        fileType === "image"
          ? file.type.startsWith("image/")
          : file.type.startsWith("video/");

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
    },
    showUploadList: false,
    multiple: false,
  };

  // Handle file change
  const handleFileChange = (info, fileType) => {
    if (fileType === "images") {
      // Handle multiple images with limit
      const { fileList } = info;
      const maxImages = 20;

      if (fileList.length > maxImages) {
        message.warning(
          `Maximum ${maxImages} images allowed. Only the first ${maxImages} images will be kept.`
        );
      }

      const limitedFileList = fileList.slice(0, maxImages);
      const files = limitedFileList
        .map((item) => item.originFileObj || item)
        .filter(Boolean);

      // Replace existing images instead of merging
      setUploadedFiles((prev) => ({
        ...prev,
        images: files,
      }));
      setFileList((prev) => ({
        ...prev,
        images: limitedFileList,
      }));
    } else {
      // Handle single file (video)
      const { file } = info;
      if (file) {
        setUploadedFiles((prev) => ({
          ...prev,
          [fileType]: file,
        }));
        setFileList((prev) => ({
          ...prev,
          [fileType]: [file],
        }));
      }
    }
  };

  // Remove uploaded file
  const removeFile = (fileType) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: fileType === "images" ? [] : null,
    }));
    setFileList((prev) => ({
      ...prev,
      [fileType]: [],
    }));
  };

  // Remove specific image from multiple images
  const removeImageFile = (index) => {
    setUploadedFiles((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
      };
    });
    setFileList((prev) => {
      const newFileList = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newFileList,
      };
    });
    message.success("Image removed successfully");
  };

  // Remove existing image from form
  const removeExistingImage = (index) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedImages);
    form.setFieldsValue({ images: updatedImages });
    form.validateFields(["images"]);
    message.success("Existing image removed successfully");
  };

  // Clear all new uploaded images
  const clearAllNewImages = () => {
    setUploadedFiles((prev) => ({
      ...prev,
      images: [],
    }));
    setFileList((prev) => ({
      ...prev,
      images: [],
    }));
    message.success("All new images cleared");
  };

  // Clear all existing images
  const clearAllExistingImages = () => {
    setExistingImages([]);
    form.setFieldsValue({ images: [] });
    form.validateFields(["images"]);
    message.success("All existing images cleared");
  };

  // Upload file to server
  const uploadFileToServer = async (file, fileType) => {
    if (!file) return null;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.url;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/admin-login";
      }
      throw new Error(
        `Failed to upload ${fileType}: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      let imageUrls = existingImages || [];

      // Upload multiple images if they exist
      if (uploadedFiles.images && uploadedFiles.images.length > 0) {
        try {
          message.loading("Uploading images...", 0);
          const uploadPromises = uploadedFiles.images.map((file) =>
            uploadFileToServer(file, "image")
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          imageUrls = [...imageUrls, ...uploadedUrls.filter((url) => url)];
          message.destroy();
        } catch (error) {
          message.destroy();
          message.error("Failed to upload images");
          return;
        }
      }

      const postUmrahData = {
        id: values.id.trim(),
        title: values.title?.trim() || "",
        title_malayalam: values.title_malayalam?.trim() || "",
        title_urdu: values.title_urdu?.trim() || "",
        description: values.description?.trim() || "",
        description_malayalam: values.description_malayalam?.trim() || "",
        description_urdu: values.description_urdu?.trim() || "",
        images: imageUrls,
        video: values.video?.trim() || "",
      };

      if (editingId) {
        // Update existing post-umrah data
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah/${editingId}`,
          postUmrahData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        message.success("Post-Umrah entry updated successfully");
      } else {
        // Create new post-umrah data
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah`,
          postUmrahData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        message.success("Post-Umrah entry created successfully");
      }

      resetModalState();
      fetchData();
    } catch (error) {
      console.error(
        "Error saving post-umrah data:",
        error.response?.data || error.message
      );
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already exists")
      ) {
        message.error(
          "An entry with this ID already exists. Please use a different ID."
        );
      } else {
        message.error(
          error.response?.data?.message || "Failed to save post-umrah data"
        );
      }
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
    setUploadedFiles({ images: [], video: null });
    setFileList({ images: [], video: [] });
    setExistingImages([]);
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
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      if (ids.length > 1) {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah/bulk-delete`,
          { ids },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah/${ids[0]}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setPostUmrahData(postUmrahData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
      message.success("Entry(s) deleted successfully");
      fetchData();
    } catch (error) {
      console.error(
        "Error deleting entries:",
        error.response?.data || error.message
      );
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
  const filteredPostUmrahData = useMemo(() => {
    return postUmrahData.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchStr) ||
        item.title_malayalam?.toLowerCase().includes(searchStr) ||
        item.title_urdu?.toLowerCase().includes(searchStr) ||
        item.description?.toLowerCase().includes(searchStr) ||
        item.description_malayalam?.toLowerCase().includes(searchStr) ||
        item.description_urdu?.toLowerCase().includes(searchStr) ||
        item.id?.toLowerCase().includes(searchStr)
      );
    })
      .sort((a, b) => {
        // Sort by ID number (extract numeric part and sort numerically)
        const aId = parseInt(a.id?.replace(/\D/g, "")) || 0;
        const bId = parseInt(b.id?.replace(/\D/g, "")) || 0;
        return aId - bId;
      });
  }, [postUmrahData, searchTerm]);

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize,
    });
  };

  // Get paginated data
  const paginatedPostUmrahData = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filteredPostUmrahData.slice(startIndex, endIndex);
    console.log(
      `Pagination: Page ${pagination.current}, showing ${paginated.length} of ${filteredPostUmrahData.length} total items`
    );
    return paginated;
  }, [filteredPostUmrahData, pagination.current, pagination.pageSize]);

  // Reset to first page when search changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: filteredPostUmrahData.length,
    }));
  }, [searchTerm]);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(paginatedPostUmrahData.map((row) => row._id));
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

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          id: "sample_post_umrah_001",
          title: "Sample Post-Umrah Entry (Optional)",
          title_malayalam: "സാമ്പിൾ പോസ്റ്റ്-ഉംറ എൻട്രി (Required)",
          title_urdu: "نمونہ پوسٹ عمرہ انٹری (Optional)",
          description: "Sample description for post-umrah content (Optional)",
          description_malayalam:
            "പോസ്റ്റ്-ഉംറ ഉള്ളടക്കത്തിനുള്ള സാമ്പിൾ വിവരണം (Required)",
          description_urdu: "پوسٹ عمرہ مواد کے لیے نمونہ تفصیل (Optional)",
          video: "https://www.youtube.com/watch?v=sample_video_id",
        },
      ];

      const ws = utils.json_to_sheet([]);

      // Add headers
      utils.sheet_add_aoa(
        ws,
        [
          [
            "id",
            "title",
            "title_malayalam",
            "title_urdu",
            "description",
            "description_malayalam",
            "description_urdu",
            "video",
          ],
        ],
        { origin: "A1" }
      );

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      // Set column widths
      ws["!cols"] = [
        { wch: 20 }, // id
        { wch: 30 }, // title
        { wch: 30 }, // title_malayalam
        { wch: 30 }, // title_urdu
        { wch: 40 }, // description
        { wch: 40 }, // description_malayalam
        { wch: 40 }, // description_urdu
        { wch: 50 }, // video
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "post_umrah_upload_template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
      message.success("Template downloaded successfully");
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

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = read(e.target.result, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = utils.sheet_to_json(worksheet);

          if (data.length === 0) {
            setUploadError("The Excel file is empty. Please add some data.");
            return;
          }

          // Check required columns
          const firstRow = data[0];
          const hasRequiredColumns =
            "id" in firstRow &&
            "title_malayalam" in firstRow &&
            "description_malayalam" in firstRow;

          if (!hasRequiredColumns) {
            setUploadError(
              "Excel file must have required columns: id, title_malayalam, and description_malayalam"
            );
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            if (!row.id || !row.title_malayalam || !row.description_malayalam) {
              setUploadError(
                `Row ${rowNumber}: Missing required data. Each row must have id, title_malayalam, and description_malayalam.`
              );
              return;
            }
          }

          const formData = new FormData();
          formData.append("file", file);

          const token = localStorage.getItem("token");
          if (!token) {
            setUploadError(
              "Authentication token not found. Please log in again."
            );
            return;
          }

          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL_V2}/post-umrah/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          setUploadSuccess(
            `Successfully uploaded ${response.data.count} post-umrah entries`
          );
          setUploadError(null);
          fetchData();
          event.target.value = "";
        } catch (error) {
          console.error("Excel processing error:", error);
          setUploadError(
            error.response?.data?.message || "Error processing the Excel file"
          );
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError("Error processing file. Please try again.");
      setUploadSuccess(null);
    }
  };

  // Table columns configuration
  const postUmrahColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === paginatedPostUmrahData.length && paginatedPostUmrahData.length > 0}
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
      key: "title",
      title: "Title",
      render: (row) => (
        <span className="truncate" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: "title_malayalam",
      title: "Ml Title",
      render: (row) => (
        <span className="truncate" title={row.title_malayalam || "-"}>
          {row.title_malayalam || "-"}
        </span>
      ),
    },
    {
      key: "title_urdu",
      title: "Ur Title",
      render: (row) => (
        <span className="truncate" title={row.title_urdu || "-"}>
          {row.title_urdu || "-"}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => (
        <span className="truncate" title={row.description || "-"}>
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "description_malayalam",
      title: "Ml Description",
      render: (row) => (
        <span className="truncate" title={row.description_malayalam || "-"}>
          {row.description_malayalam || "-"}
        </span>
      ),
    },
    {
      key: "description_urdu",
      title: "Ur Description",
      render: (row) => (
        <span className="truncate" title={row.description_urdu || "-"}>
          {row.description_urdu || "-"}
        </span>
      ),
    },
    {
      key: "media",
      title: "Media",
      render: (row) => {
        const mediaItems = [];
        if (row.images && row.images.length > 0) {
          mediaItems.push(`Images (${row.images.length})`);
        }
        if (row.video) {
          mediaItems.push("Video");
        }
        const mediaText = mediaItems.length > 0 ? mediaItems.join(", ") : "N/A";
        return (
          <span className="truncate" title={mediaText}>
            {mediaText}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingId(row._id);
              const recordImages = row.images || [];

              setExistingImages(recordImages);
              form.setFieldsValue({
                id: row.id,
                title: row.title,
                title_malayalam: row.title_malayalam || "",
                title_urdu: row.title_urdu || "",
                description: row.description || "",
                description_malayalam: row.description_malayalam || "",
                description_urdu: row.description_urdu || "",
                images: recordImages,
                video: row.video || "",
              });

              setUploadedFiles({ images: [], video: null });
              setFileList({ images: [], video: [] });
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

      <div className={`${sidebarOpen ? "ml-72" : "ml-20"}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle size={24} />
              Post-Umrah Management
            </h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredPostUmrahData.length} entries
            </div>
          </div>

          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 border-0 font-normal"
                style={{
                  backgroundColor: "#ef4444 !important",
                  color: "white !important",
                  border: "none !important",
                  borderRadius: "6px !important",
                }}
              >
                Delete Selected ({selectedRows.length})
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600 border-0 font-normal"
              style={{
                backgroundColor: "#6b7280 !important",
                color: "white !important",
                border: "none !important",
                borderRadius: "6px !important",
              }}
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
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 border-0 font-normal"
              style={{
                backgroundColor: "#3b82f6 !important",
                color: "white !important",
                border: "none !important",
                borderRadius: "6px !important",
                display: "flex !important",
              }}
            >
              Upload Excel
            </label>
            <button
              onClick={() => {
                setEditingId(null);
                // Reset form and file states when adding new entry
                form.resetFields();
                setUploadedFiles({ images: [], video: null });
                setFileList({ images: [], video: [] });
                setExistingImages([]);
                setModalVisible(true);
              }}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600 border-0 font-normal"
              style={{
                backgroundColor: "#22c55e !important",
                color: "white !important",
                border: "none !important",
                borderRadius: "6px !important",
              }}
            >
              Add Entry
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {uploadError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              {uploadError}
            </div>
          </div>
        )}
        {uploadSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center gap-2">✓ {uploadSuccess}</div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search post-umrah entries..."
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
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
                  {postUmrahColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === "select"
                          ? "w-12"
                          : column.key === "id"
                          ? "w-16"
                          : column.key === "title"
                          ? "w-24"
                          : column.key === "title_malayalam"
                          ? "w-20"
                          : column.key === "title_urdu"
                          ? "w-20"
                          : column.key === "description"
                          ? "w-32"
                          : column.key === "description_malayalam"
                          ? "w-28"
                          : column.key === "description_urdu"
                          ? "w-28"
                          : column.key === "media"
                          ? "w-20"
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={postUmrahColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedPostUmrahData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={postUmrahColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No post-umrah entries found
                    </td>
                  </tr>
                ) : (
                  paginatedPostUmrahData.map((row) => (
                    <tr
                      key={row._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {postUmrahColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-2 py-2 text-sm text-gray-900 ${
                            column.key === "id"
                              ? "max-w-16 truncate"
                              : column.key === "title"
                              ? "max-w-24 truncate"
                              : column.key === "title_malayalam"
                              ? "max-w-20 truncate"
                              : column.key === "title_urdu"
                              ? "max-w-20 truncate"
                              : column.key === "description"
                              ? "max-w-32 truncate"
                              : column.key === "description_malayalam"
                              ? "max-w-28 truncate"
                              : column.key === "description_urdu"
                              ? "max-w-28 truncate"
                              : column.key === "media"
                              ? "max-w-20 truncate"
                              : column.key === "actions"
                              ? "whitespace-nowrap"
                              : "whitespace-nowrap"
                          }`}
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

        {/* Pagination Controls */}
        {filteredPostUmrahData.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-4 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.current - 1) * pagination.pageSize + 1} to{" "}
                {Math.min(
                  pagination.current * pagination.pageSize,
                  filteredPostUmrahData.length
                )}{" "}
                of {filteredPostUmrahData.length} post-umrah entries
              </div>

              <div className="flex items-center gap-2">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      const newPageSize = parseInt(e.target.value);
                      setPagination({
                        ...pagination,
                        pageSize: newPageSize,
                        current: 1, // Reset to first page when changing page size
                      });
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    onClick={() =>
                      handlePaginationChange(1, pagination.pageSize)
                    }
                    disabled={pagination.current === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First page"
                  >
                    ««
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() =>
                      handlePaginationChange(
                        pagination.current - 1,
                        pagination.pageSize
                      )
                    }
                    disabled={pagination.current === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    ‹
                  </button>

                  {/* Page Numbers */}
                  {(() => {
                    const totalPages = Math.ceil(
                      filteredPostUmrahData.length / pagination.pageSize
                    );
                    const currentPage = pagination.current;
                    const maxVisiblePages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePaginationChange(i, pagination.pageSize)}
                          className={`px-3 py-1 text-sm border rounded ${
                            i === currentPage
                              ? "bg-blue-500 text-white border-blue-500"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    return pages;
                  })()}

                  {/* Next Page */}
                  <button
                    onClick={() =>
                      handlePaginationChange(
                        pagination.current + 1,
                        pagination.pageSize
                      )
                    }
                    disabled={
                      pagination.current >=
                      Math.ceil(filteredPostUmrahData.length / pagination.pageSize)
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    ›
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() =>
                      handlePaginationChange(
                        Math.ceil(filteredPostUmrahData.length / pagination.pageSize),
                        pagination.pageSize
                      )
                    }
                    disabled={
                      pagination.current >=
                      Math.ceil(filteredPostUmrahData.length / pagination.pageSize)
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last page"
                  >
                    »»
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
              <CheckCircle size={20} />
              <span>
                {editingId
                  ? "Edit Post-Umrah Entry"
                  : "Add New Post-Umrah Entry"}
              </span>
            </div>
          }
          open={modalVisible}
          onCancel={resetModalState}
          footer={null}
          width={900}
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
                    {
                      pattern: /^[a-zA-Z0-9_-]+$/,
                      message:
                        "Entry ID can only contain letters, numbers, hyphens, and underscores",
                    },
                  ]}
                >
                  <Input placeholder="Enter unique entry ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Title"
                  rules={[
                    { max: 200, message: "Title cannot exceed 200 characters" },
                  ]}
                >
                  <Input placeholder="Enter entry title (optional)" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description">
              <TextArea
                rows={4}
                placeholder="Enter a detailed description..."
                showCount
              />
            </Form.Item>

            {/* Multilingual Fields */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title_malayalam"
                  label="Title (Malayalam) *"
                  rules={[
                    { required: true, message: "Please enter Malayalam title" },
                    { min: 1, message: "Malayalam title cannot be empty" },
                    {
                      max: 200,
                      message: "Malayalam title cannot exceed 200 characters",
                    },
                  ]}
                >
                  <Input placeholder="Enter title in Malayalam" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="title_urdu" label="Title (Urdu)">
                  <Input placeholder="Enter title in Urdu" dir="rtl" 
    style={{ textAlign: 'right' }}/>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="description_malayalam"
                  label="Description (Malayalam) *"
                  rules={[
                    {
                      required: true,
                      message: "Please enter Malayalam description",
                    },
                    {
                      min: 1,
                      message: "Malayalam description cannot be empty",
                    },
                  ]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Enter description in Malayalam..."
                    showCount
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="description_urdu" label="Description (Urdu)">
                  <TextArea
                    rows={3}
                    placeholder="اردو میں تفصیل درج کریں..."
                    showCount
                    dir="rtl" 
    style={{ textAlign: 'right' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* File Upload Sections */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={`Multiple Images Upload (${
                    uploadedFiles.images?.length || 0
                  }/20)`}
                >
                  <Dragger
                    {...uploadProps}
                    accept="image/*"
                    multiple={true}
                    maxCount={20}
                    fileList={fileList.images}
                    onChange={(info) => handleFileChange(info, "images")}
                    beforeUpload={(file) =>
                      uploadProps.beforeUpload(file, "image")
                    }
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadCloud
                        size={40}
                        className="mx-auto text-blue-500"
                      />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag images to upload
                    </p>
                    <p className="ant-upload-hint">
                      Support for jpg, png, gif. Max size 5MB each. Maximum 20
                      images allowed.
                    </p>
                  </Dragger>

                  {/* Display all images in a compact grid */}
                  {((editingId &&
                    existingImages &&
                    existingImages.length > 0) ||
                    (uploadedFiles.images &&
                      uploadedFiles.images.length > 0)) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-medium text-gray-700">
                          Images (
                          {(existingImages?.length || 0) +
                            (uploadedFiles.images?.length || 0)}
                          /20)
                          <span className="ml-2 text-xs text-gray-500">
                            (Existing: {existingImages?.length || 0}, New:{" "}
                            {uploadedFiles.images?.length || 0})
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {editingId &&
                            existingImages &&
                            existingImages.length > 0 && (
                              <button
                                type="button"
                                onClick={clearAllExistingImages}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                title="Clear all existing images"
                              >
                                Clear Existing
                              </button>
                            )}
                          {uploadedFiles.images &&
                            uploadedFiles.images.length > 0 && (
                              <button
                                type="button"
                                onClick={clearAllNewImages}
                                className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                title="Clear all new images"
                              >
                                Clear New
                              </button>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-2">
                        {/* Existing images */}
                        {editingId &&
                          existingImages &&
                          existingImages.map((imageUrl, index) => (
                            <div
                              key={`existing-${index}`}
                              className="relative group"
                            >
                              <div className="relative w-16 h-16 border-2 border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                                <img
                                  src={imageUrl}
                                  alt={`Existing ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div className="w-full h-full hidden items-center justify-center text-xs text-gray-500 bg-gray-100">
                                  IMG
                                </div>
                                <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 rounded-br">
                                  E{index + 1}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeExistingImage(index);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 z-20 opacity-90 hover:opacity-100"
                                title="Remove this existing image"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                        {/* New images */}
                        {uploadedFiles.images &&
                          uploadedFiles.images.map((file, index) => (
                            <div
                              key={`new-${index}`}
                              className="relative group"
                            >
                              <div className="relative w-16 h-16 border-2 border-green-200 rounded-lg overflow-hidden bg-green-50">
                                {file && file.type?.startsWith("image/") ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`New ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "flex";
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full hidden items-center justify-center text-xs text-gray-500">
                                  IMG
                                </div>
                                <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 rounded-br">
                                  N{index + 1}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeImageFile(index);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 z-20 opacity-90 hover:opacity-100"
                                title="Remove this new image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Legend */}
                      <div className="mt-2 flex gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Existing Images</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>New Images</span>
                        </div>
                        <div className="text-gray-500">Hover to delete</div>
                      </div>
                    </div>
                  )}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="video"
                  label="Video URL"
                  rules={[
                    {
                      type: "url",
                      message: "Please enter a valid URL",
                    },
                  ]}
                >
                  <Input
                    placeholder="https://example.com/video.mp4"
                    addonBefore="🎥"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Plus size={18} />}
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}{" "}
                  Entry
                </Button>
                <Button onClick={resetModalState} disabled={submitting}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Detail Modal */}
        {showDetailModal && selectedPostUmrah && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 mx-4">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle size={20} />
                  Post-Umrah Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Entry ID
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedPostUmrah.id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Created Date
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedPostUmrah.createdAt
                          ? moment(selectedPostUmrah.createdAt).format(
                              "YYYY-MM-DD HH:mm"
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multilingual Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Content
                  </h3>
                  <div className="space-y-4">
                    {/* English Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        English
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Title
                          </label>
                          <p className="text-gray-900">
                            {selectedPostUmrah.title || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedPostUmrah.description || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Malayalam Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Malayalam
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Title
                          </label>
                          <p className="text-gray-900">
                            {selectedPostUmrah.title_malayalam ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedPostUmrah.description_malayalam ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Urdu Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">Urdu</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Title
                          </label>
                          <p className="text-gray-900">
                            {selectedPostUmrah.title_urdu || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedPostUmrah.description_urdu ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Media Content
                  </h3>

                  {/* Images */}
                  {selectedPostUmrah.images &&
                  selectedPostUmrah.images.length > 0 ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Images ({selectedPostUmrah.images.length})
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedPostUmrah.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Post-Umrah Image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => window.open(imageUrl, "_blank")}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div className="w-full h-32 hidden items-center justify-center text-gray-500 bg-gray-100 rounded-lg border border-gray-200">
                              <span className="text-sm">Image {index + 1}</span>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Images
                      </label>
                      <p className="text-gray-500 bg-white p-4 rounded border">
                        No images available
                      </p>
                    </div>
                  )}

                  {/* Video */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Video
                    </label>
                    {selectedPostUmrah.video ? (
                      <div className="bg-white p-4 rounded border">
                        <a
                          href={selectedPostUmrah.video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {selectedPostUmrah.video}
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500 bg-white p-4 rounded border">
                        No video available
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Last Updated
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedPostUmrah.updatedAt
                          ? moment(selectedPostUmrah.updatedAt).format(
                              "YYYY-MM-DD HH:mm"
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Database ID
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border font-mono text-sm">
                        {selectedPostUmrah._id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostUmrahManagement;

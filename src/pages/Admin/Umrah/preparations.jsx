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

const PreparationManagement = () => {
  const [preparationData, setPreparationData] = useState([]);
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
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [selectedPreparation, setSelectedPreparation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Handle row click to show details
  const handleRowClick = (preparation, event) => {
    // Prevent row click when clicking on buttons or checkboxes
    if (event.target.closest('button') || event.target.closest('input[type="checkbox"]')) {
      return;
    }
    setSelectedPreparation(preparation);
    setShowDetailModal(true);
  };

  // Toggle description expansion
  const toggleDescription = (recordId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  // Render description with read more functionality
  const renderDescription = (text, record, language = "english") => {
    if (!text) return "-";

    const maxLength = 150;
    const expandKey = `${record._id}_${language}`;
    const isExpanded = expandedDescriptions[expandKey];
    const shouldTruncate = text.length > maxLength;

    if (!shouldTruncate) {
      return <span className="text-gray-700">{text}</span>;
    }

    return (
      <div className="max-w-md">
        <span className="text-gray-700">
          {isExpanded ? text : `${text.substring(0, maxLength)}...`}
        </span>
        <button
          onClick={() =>
            setExpandedDescriptions((prev) => ({
              ...prev,
              [expandKey]: !prev[expandKey],
            }))
          }
          className="ml-2 text-blue-500 hover:text-blue-700 text-sm font-medium underline"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      </div>
    );
  };

  // Fetch preparation data with retry logic
  const fetchData = async (page = 1, pageSize = 10, retryCount = 0, maxRetries = 5) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/preparation?limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPreparationData(response.data.preparation || []);
      setPagination({
        ...pagination,
        total: response.data.count || 0,
      });
    } catch (error) {
      console.error(
        `Error fetching preparation data (attempt ${retryCount + 1}):`,
        error.response?.data || error.message
      );
      
      // Check if it's a connection error and retry
      if (retryCount < maxRetries && 
          (error.code === 'ERR_NETWORK' || 
           error.message.includes('Network Error') ||
           error.code === 'ECONNREFUSED')) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => {
          fetchData(page, pageSize, retryCount + 1, maxRetries);
        }, delay);
        return;
      }
      
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

  // Handle pagination change
  const handleTableChange = (paginationInfo, filters, sorter) => {
    fetchData(paginationInfo.current, paginationInfo.pageSize);
  };

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
        `${import.meta.env.VITE_BACKEND_URL_V2}/preparation/upload`,
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

  // Check if listingOrder is unique within the same category
  const checkUniqueListingOrder = (listingOrder, isHajj, isCommon, editingId) => {
    if (!listingOrder && listingOrder !== 0) return true; // Allow empty values
    
    let existingEntry;
    if (isCommon) {
      // For common entries, check uniqueness across all common entries
      existingEntry = preparationData.find(entry => 
        entry.isCommon === true && 
        entry.listingOrder === Number(listingOrder) &&
        entry._id !== editingId
      );
    } else {
      // For specific category entries, check within that category
      existingEntry = preparationData.find(entry => 
        entry.isHajj === isHajj && 
        entry.isCommon === false &&
        entry.listingOrder === Number(listingOrder) &&
        entry._id !== editingId
      );
    }
    
    return !existingEntry;
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

      // Validate unique listingOrder within category
      if (!checkUniqueListingOrder(values.listingOrder, values.isHajj, values.isCommon, editingId)) {
        const category = values.isCommon ? 'Common' : (values.isHajj ? 'Hajj' : 'Umrah');
        message.error(`Listing order ${values.listingOrder} already exists in ${category} category. Please use a different order number.`);
        setSubmitting(false);
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

      const preparationData = {
        id: values.id.trim(),
        title: values.title?.trim() || undefined,
        malayalamTitle: values.malayalamTitle?.trim(),
        urduTitle: values.urduTitle?.trim() || "",
        description: values.description?.trim() || "",
        malayalamDescription: values.malayalamDescription?.trim() || "",
        urduDescription: values.urduDescription?.trim() || "",
        images: imageUrls,
        video: values.video?.trim() || "",
        map: values.map?.trim() || "",
        isHajj: Boolean(values.isHajj),
        isCommon: Boolean(values.isCommon),
        listingOrder: values.listingOrder || 0,
      };

      console.log('Form values:', values);
      console.log('isHajj value from form:', values.isHajj);
      console.log('isHajj boolean conversion:', Boolean(values.isHajj));
      console.log('Final preparation data:', preparationData);

      if (editingId) {
        // Update existing preparation data
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL_V2}/preparation/${editingId}`,
          preparationData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        message.success("Preparation entry updated successfully");
      } else {
        // Create new preparation data
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/preparation`,
          preparationData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        message.success("Preparation entry created successfully");
      }

      resetModalState();
      fetchData();
    } catch (error) {
      console.error(
        "Error saving preparation data:",
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
          error.response?.data?.message || "Failed to save preparation data"
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
          `${import.meta.env.VITE_BACKEND_URL_V2}/preparation/bulk-delete`,
          { ids },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL_V2}/preparation/${ids[0]}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setPreparationData(
        preparationData.filter((item) => !ids.includes(item._id))
      );
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
  const filteredPreparationData = useMemo(() => {
    return preparationData.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchStr) ||
        item.malayalamTitle?.toLowerCase().includes(searchStr) ||
        item.urduTitle?.toLowerCase().includes(searchStr) ||
        item.description?.toLowerCase().includes(searchStr) ||
        item.malayalamDescription?.toLowerCase().includes(searchStr) ||
        item.urduDescription?.toLowerCase().includes(searchStr) ||
        item.id?.toLowerCase().includes(searchStr)
      );
    })
      .sort((a, b) => {
        // Sort by ID number (extract numeric part and sort numerically)
        const aId = parseInt(a.id?.replace(/\D/g, "")) || 0;
        const bId = parseInt(b.id?.replace(/\D/g, "")) || 0;
        return aId - bId;
      });
  }, [preparationData, searchTerm]);

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize,
    });
  };

  // Get paginated data
  const paginatedPreparationData = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filteredPreparationData.slice(startIndex, endIndex);
    console.log(
      `Pagination: Page ${pagination.current}, showing ${paginated.length} of ${filteredPreparationData.length} total items`
    );
    return paginated;
  }, [filteredPreparationData, pagination.current, pagination.pageSize]);

  // Reset to first page when search changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: filteredPreparationData.length,
    }));
  }, [searchTerm]);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(paginatedPreparationData.map((row) => row._id));
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
          id: "sample_preparation_001",
          title: "Sample Preparation Entry (Required)",
          malayalam_title: "സാമ്പിൾ തയ്യാറെടുപ്പ് എൻട്രി",
          urdu_title: "نمونہ تیاری انٹری",
          description: "Sample description for preparation content",
          malayalam_description:
            "തയ്യാറെടുപ്പ് ഉള്ളടക്കത്തിനുള്ള സാമ്പിൾ വിവരണം",
          urdu_description: "تیاری کے مواد کے لیے نمونہ تفصیل",
          video: "https://www.youtube.com/watch?v=sample_video_id",
          map: "https://maps.google.com/sample_map_link",
          is_hajj: false,
          is_common: false,
          listing_order: 1,
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
            "malayalam_title",
            "urdu_title",
            "description",
            "malayalam_description",
            "urdu_description",
            "video",
            "map",
            "is_hajj",
            "is_common",
            "listing_order",
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
        { wch: 25 }, // malayalam_title
        { wch: 25 }, // urdu_title
        { wch: 40 }, // description
        { wch: 35 }, // malayalam_description
        { wch: 35 }, // urdu_description
        { wch: 50 }, // video
        { wch: 50 }, // map
        { wch: 12 }, // is_hajj
        { wch: 12 }, // is_common
        { wch: 15 }, // listing_order
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "preparation_upload_template.xlsx";
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
            ("malayalam_title" in firstRow || "malayalamTitle" in firstRow);

          if (!hasRequiredColumns) {
            setUploadError(
              "Excel file must have required columns: id and malayalam_title"
            );
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            if (!row.id || !(row.malayalam_title || row.malayalamTitle)) {
              setUploadError(
                `Row ${rowNumber}: Missing required data. Each row must have id and malayalam_title.`
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/preparation/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          setUploadSuccess(
            `Successfully uploaded ${response.data.count} preparation entries`
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
  const preparationColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === paginatedPreparationData.length && paginatedPreparationData.length > 0}
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
      key: "malayalamTitle",
      title: "Ml Title",
      render: (row) => (
        <span className="truncate" title={row.malayalamTitle || "-"}>
          {row.malayalamTitle || "-"}
        </span>
      ),
    },
    {
      key: "urduTitle",
      title: "Ur Title",
      render: (row) => (
        <span className="truncate" title={row.urduTitle || "-"}>
          {row.urduTitle || "-"}
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
      key: "malayalamDescription",
      title: "Ml Description",
      render: (row) => (
        <span className="truncate" title={row.malayalamDescription || "-"}>
          {row.malayalamDescription || "-"}
        </span>
      ),
    },
    {
      key: "urduDescription",
      title: "Ur Description",
      render: (row) => (
        <span className="truncate" title={row.urduDescription || "-"}>
          {row.urduDescription || "-"}
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
        if (row.map) {
          mediaItems.push("Map");
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
      key: "category",
      title: "Category",
      render: (row) => (
        <span className="inline-flex items-center">
          {row.isCommon ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ✓ Common
            </span>
          ) : row.isHajj ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Hajj
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Umrah
            </span>
          )}
        </span>
      ),
    },
    {
      key: "listingOrder",
      title: "Order",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.listingOrder || 0}
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
              const recordImages = row.images || [];
              setExistingImages(recordImages);
              form.setFieldsValue({
                id: row.id,
                title: row.title,
                malayalamTitle: row.malayalamTitle || "",
                urduTitle: row.urduTitle || "",
                description: row.description || "",
                malayalamDescription: row.malayalamDescription || "",
                urduDescription: row.urduDescription || "",
                images: recordImages,
                video: row.video || "",
                map: row.map || "",
                isHajj: row.isHajj || false,
                isCommon: row.isCommon || false,
                listingOrder: row.listingOrder || 0,
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
              <Settings size={24} />
              Preparation Management
            </h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredPreparationData.length} entries
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
              placeholder="Search preparation entries..."
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
                  {preparationColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === "select"
                          ? "w-12"
                          : column.key === "id"
                          ? "w-16"
                          : column.key === "title"
                          ? "w-24"
                          : column.key === "malayalamTitle"
                          ? "w-20"
                          : column.key === "urduTitle"
                          ? "w-20"
                          : column.key === "description"
                          ? "w-32"
                          : column.key === "malayalamDescription"
                          ? "w-28"
                          : column.key === "urduDescription"
                          ? "w-28"
                          : column.key === "media"
                          ? "w-20"
                          : column.key === "category"
                          ? "w-20"
                          : column.key === "listingOrder"
                          ? "w-16"
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
                      colSpan={preparationColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedPreparationData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={preparationColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No preparation entries found
                    </td>
                  </tr>
                ) : (
                  paginatedPreparationData.map((row) => (
                    <tr 
                      key={row._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {preparationColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-2 py-2 text-sm text-gray-900 ${
                            column.key === "id"
                              ? "max-w-16 truncate"
                              : column.key === "title"
                              ? "max-w-24 truncate"
                              : column.key === "malayalamTitle"
                              ? "max-w-20 truncate"
                              : column.key === "urduTitle"
                              ? "max-w-20 truncate"
                              : column.key === "description"
                              ? "max-w-32 truncate"
                              : column.key === "malayalamDescription"
                              ? "max-w-28 truncate"
                              : column.key === "urduDescription"
                              ? "max-w-28 truncate"
                              : column.key === "media"
                              ? "max-w-20 truncate"
                              : column.key === "category"
                              ? "max-w-20 whitespace-nowrap"
                              : column.key === "listingOrder"
                              ? "max-w-16 whitespace-nowrap"
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

        {/* Detail Modal */}
        {showDetailModal && selectedPreparation && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Preparation Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                        <p className="text-gray-900 font-medium">{selectedPreparation.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Title (English)</label>
                        <p className="text-gray-900 font-medium">{selectedPreparation.title || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                        <p className="text-gray-900 font-medium">
                          {selectedPreparation.isHajj ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Hajj Preparation
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Umrah Preparation
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Common Status</label>
                        <p className="text-gray-900 font-medium">
                          {selectedPreparation.isCommon ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              ✓ Common for Both
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Category Specific
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Listing Order</label>
                        <p className="text-gray-900 font-medium">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedPreparation.listingOrder || 0}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Multilingual Titles */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Multilingual Titles</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Malayalam Title</label>
                        <p className="text-gray-900">{selectedPreparation.malayalamTitle || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Urdu Title</label>
                        <p className="text-gray-900" dir="rtl">{selectedPreparation.urduTitle || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Descriptions</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">English Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedPreparation.description || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Malayalam Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedPreparation.malayalamDescription || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Urdu Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap" dir="rtl">{selectedPreparation.urduDescription || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Media Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Media & Resources</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Images</label>
                        {selectedPreparation.images && selectedPreparation.images.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {selectedPreparation.images.map((imageUrl, index) => (
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
                        <label className="block text-sm font-medium text-gray-600 mb-1">Video</label>
                        {selectedPreparation.video ? (
                          <a
                            href={selectedPreparation.video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                          >
                            🎥 View Video
                          </a>
                        ) : (
                          <p className="text-gray-500">No video available</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Map</label>
                        {selectedPreparation.map ? (
                          <a
                            href={selectedPreparation.map}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                          >
                            🗺 View Map
                          </a>
                        ) : (
                          <p className="text-gray-500">No map available</p>
                        )}
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
                          {selectedPreparation.createdAt ? new Date(selectedPreparation.createdAt).toLocaleString() : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Updated At</label>
                        <p className="text-gray-900 text-sm">
                          {selectedPreparation.updatedAt ? new Date(selectedPreparation.updatedAt).toLocaleString() : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Database ID</label>
                        <p className="text-gray-900 text-sm font-mono">{selectedPreparation._id}</p>
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

        {/* Pagination Controls */}
        {filteredPreparationData.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-4 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.current - 1) * pagination.pageSize + 1} to{" "}
                {Math.min(
                  pagination.current * pagination.pageSize,
                  filteredPreparationData.length
                )}{" "}
                of {filteredPreparationData.length} preparation entries
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
                      filteredPreparationData.length / pagination.pageSize
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
                      Math.ceil(filteredPreparationData.length / pagination.pageSize)
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
                        Math.ceil(filteredPreparationData.length / pagination.pageSize),
                        pagination.pageSize
                      )
                    }
                    disabled={
                      pagination.current >=
                      Math.ceil(filteredPreparationData.length / pagination.pageSize)
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
              <Settings size={20} />
              <span>
                {editingId
                  ? "Edit Preparation Entry"
                  : "Add New Preparation Entry"}
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
                  label="Title (English)"
                  rules={[
                    { max: 200, message: "Title cannot exceed 200 characters" },
                  ]}
                >
                  <Input placeholder="Enter entry title in English" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="malayalamTitle"
                  label="Title (Malayalam)"
                  rules={[
                    { required: true, message: "Please enter Malayalam title" },
                    { min: 1, message: "Malayalam title cannot be empty" },
                    {
                      max: 200,
                      message: "Malayalam title cannot exceed 200 characters",
                    },
                  ]}
                >
                  <Input
                    placeholder="മലയാളത്തിൽ ശീർഷകം നൽകുക"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="urduTitle"
                  label="Title (Urdu)"
                  rules={[
                    {
                      max: 200,
                      message: "Urdu title cannot exceed 200 characters",
                    },
                  ]}
                >
                  <Input
                    placeholder="اردو میں عنوان درج کریں"
                    dir="rtl"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description (English)">
              <TextArea
                rows={4}
                placeholder="Enter a detailed description in English..."
                showCount
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="malayalamDescription"
                  label="Description (Malayalam)"
                >
                  <TextArea
                    rows={4}
                    placeholder="മലയാളത്തിൽ വിശദമായ വിവരണം നൽകുക..."
                    showCount
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="urduDescription" label="Description (Urdu)">
                  <TextArea
                    rows={4}
                    placeholder="اردو میں تفصیلی تفصیل درج کریں..."
                    showCount
                    dir="rtl"
                    style={{ fontFamily: "Arial, sans-serif" }}
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

            <Form.Item
              name="map"
              label="Map Link URL"
              rules={[
                {
                  type: "url",
                  message: "Please enter a valid URL",
                },
              ]}
            >
              <Input
                placeholder="https://maps.google.com/... or any map URL"
                addonBefore="🗺"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="isHajj"
                  label="Is Hajj Related"
                  valuePropName="checked"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      onChange={(e) => {
                        // Re-validate listingOrder when isHajj changes
                        setTimeout(() => {
                          form.validateFields(['listingOrder']);
                        }, 100);
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Check if this preparation is specifically for Hajj
                    </span>
                  </div>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="isCommon"
                  label="Is Common for Both"
                  valuePropName="checked"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      onChange={(e) => {
                        // Re-validate listingOrder when isCommon changes
                        setTimeout(() => {
                          form.validateFields(['listingOrder']);
                        }, 100);
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Check if this preparation is common for both Hajj and Umrah
                    </span>
                  </div>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="listingOrder"
                  label="Listing Order"
                  rules={[
                    { 
                      validator: (_, value) => {
                        if (value === undefined || value === null || value === '') {
                          return Promise.resolve();
                        }
                        const num = Number(value);
                        if (isNaN(num)) {
                          return Promise.reject(new Error('Please enter a valid number'));
                        }
                        if (num < 0) {
                          return Promise.reject(new Error('Listing order must be 0 or greater'));
                        }
                        
                        // Check for uniqueness within category
                        const isHajjValue = form.getFieldValue('isHajj');
                        const isCommonValue = form.getFieldValue('isCommon');
                        if (!checkUniqueListingOrder(value, isHajjValue, isCommonValue, editingId)) {
                          const category = isCommonValue ? 'Common' : (isHajjValue ? 'Hajj' : 'Umrah');
                          return Promise.reject(new Error(`Order ${value} already exists in ${category} category`));
                        }
                        
                        return Promise.resolve();
                      }
                    },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Enter listing order (0 for default)"
                    min="0"
                    addonBefore="🔢"
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
      </div>
    </div>
  );
};

export default PreparationManagement;

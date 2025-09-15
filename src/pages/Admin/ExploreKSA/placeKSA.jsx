import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  Upload,
} from "antd";
import {
  MapPin,
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

const PlaceKSA = () => {
  const [places, setPlaces] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRows, setSelectedRows] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Fetch only locations
  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/locations`
      );

      // Handle different possible response formats - backend returns array directly
      let locationData = [];
      if (Array.isArray(response.data)) {
        locationData = response.data;
      } else if (response.data.locations) {
        locationData = response.data.locations;
      } else if (response.data.data) {
        locationData = response.data.data;
      }

      setLocations(locationData);
      message.success(`Loaded ${locationData.length} locations`);
      console.log("Refreshed locations:", locationData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      message.error("Failed to fetch locations");
    }
  };

  // Fetch places and locations
  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      // Fetch both places and locations in parallel
      const [placesResponse, locationsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/places`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 1000 },
        }),
        axios
          .get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`)
          .catch((err) => {
            console.error("Locations fetch failed:", err);
            console.error(
              "Locations URL:",
              `${import.meta.env.VITE_BACKEND_URL_V2}/locations`
            );
            return { data: [] }; // Return empty data instead of failing completely
          }),
      ]);
      console.log("placeResponse", placesResponse);

      // Handle places response
      setPlaces(placesResponse.data.placesKSA || []);
      setPagination({
        ...pagination,
        total:
          placesResponse.data.total ||
          placesResponse.data.placesKSA?.length ||
          0,
      });

      // Handle locations response - backend returns array directly
      let locationData = [];
      if (Array.isArray(locationsResponse.data)) {
        locationData = locationsResponse.data;
      } else if (locationsResponse.data.locations) {
        locationData = locationsResponse.data.locations;
      } else if (locationsResponse.data.data) {
        locationData = locationsResponse.data.data;
      }

      setLocations(locationData);
      console.log("Fetched locations:", locationData); // Debug log
      console.log("Locations response structure:", locationsResponse.data); // Debug log
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );

      // More specific error handling
      if (error.response?.status === 401) {
        message.error("Authentication failed. Please log in again.");
        localStorage.removeItem("token");
      } else if (error.message.includes("locations")) {
        message.error(
          "Failed to fetch locations. Please check your connection."
        );
      } else {
        message.error("Failed to fetch data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Also try to fetch locations separately if the main fetch fails
    if (locations.length === 0) {
      setTimeout(() => {
        fetchLocations();
      }, 1000);
    }
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

      // Completely replace images - don't merge with existing state
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
    console.log("Removing new image at index:", index);
    setUploadedFiles((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      console.log("Updated uploaded files:", newImages);
      return {
        ...prev,
        images: newImages,
      };
    });
    setFileList((prev) => {
      const newFileList = prev.images.filter((_, i) => i !== index);
      console.log("Updated file list:", newFileList);
      return {
        ...prev,
        images: newFileList,
      };
    });
    message.success("Image removed successfully");
  };

  // Remove existing image from form
  const removeExistingImage = (index) => {
    console.log("Removing existing image at index:", index);
    console.log("Current existingImages state:", existingImages);
    const updatedImages = existingImages.filter((_, i) => i !== index);
    console.log("Updated images:", updatedImages);
    setExistingImages(updatedImages);
    form.setFieldsValue({ images: updatedImages });
    // Force form to re-render
    form.validateFields(["images"]);
    message.success("Existing image removed successfully");
  };

  // Clear all new uploaded images
  const clearAllNewImages = () => {
    console.log("Clearing all new images");
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
    console.log("Clearing all existing images");
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

      console.log("Uploading file:", file.name, "Type:", fileType);

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/places/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type manually for FormData, let browser set it
          },
        }
      );

      console.log("Upload successful:", response.data);
      return response.data.url;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        // Optionally redirect to login
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

      let imageUrls = existingImages || []; // Keep existing URLs if editing

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

      const placeData = {
        id: values.id.trim(),
        title: values.title?.trim() || "",
        titleMalayalam: values.titleMalayalam?.trim() || "",
        titleUrdu: values.titleUrdu?.trim() || "",
        description: values.description?.trim() || "",
        descriptionMalayalam: values.descriptionMalayalam?.trim() || "",
        descriptionUrdu: values.descriptionUrdu?.trim() || "",
        images: imageUrls,
        video: values.video?.trim() || "", // YouTube URL
        map: values.map?.trim() || "", // Map link
        locationRef: values.locationRef || null,
      };

      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Form values:", values);
      console.log("Place data being sent:", placeData);
      console.log("Selected locationRef:", values.locationRef);
      console.log("LocationRef type:", typeof values.locationRef);
      console.log(
        "Available locations:",
        locations.map((l) => ({ id: l._id, title: l.title }))
      );

      if (editingId) {
        // Update existing place - backend expects _id
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL_V2}/places/${editingId}`,
          placeData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        message.success("Place updated successfully");
      } else {
        // Create new place
        console.log(
          "Sending POST request to:",
          `${import.meta.env.VITE_BACKEND_URL_V2}/places`
        );
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/places`,
          placeData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Backend response:", response.data);
        message.success("Place created successfully");
      }

      resetModalState();
      fetchData();
    } catch (error) {
      console.error(
        "Error saving place:",
        error.response?.data || error.message
      );

      // Handle specific error cases
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already exists")
      ) {
        message.error(
          "A place with this ID already exists. Please use a different ID."
        );
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("Invalid location")
      ) {
        message.error(
          "Invalid location selected. Please choose a valid location."
        );
      } else {
        message.error(error.response?.data?.message || "Failed to save place");
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

  // Handle place deletion
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
          `${import.meta.env.VITE_BACKEND_URL_V2}/places/bulk-delete`,
          { ids },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Send _id directly to backend
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL_V2}/places/${ids[0]}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setPlaces(places.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
      message.success("Place(s) deleted successfully");
      fetchData();
    } catch (error) {
      console.error(
        "Error deleting places:",
        error.response?.data || error.message
      );
      message.error("Failed to delete place(s)");
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setUploadError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = utils.sheet_to_json(worksheet);

          const isValid = data.every(row => row.title && row.titleMalayalam && row.titleUrdu);
          if (!isValid) {
            setUploadError('Invalid data format. Please ensure all required fields (title, titleMalayalam, titleUrdu) are present.');
            return;
          }

          const formData = new FormData();
          formData.append('file', file);

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL_V2}/places/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          setUploadSuccess(`Successfully uploaded ${response.data.count} places`);
          setUploadError(null);
          fetchData();
        } catch (error) {
          setUploadError(error.response?.data?.message || 'Error uploading file');
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setUploadError('Error processing file');
      setUploadSuccess(null);
    }
  };

  // Add download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          title: 'Sample Place',
          titleMalayalam: 'Sample Malayalam',
          titleUrdu: 'Sample Urdu',
          description: 'Sample Description',
          descriptionMalayalam: 'Sample Malayalam Description',
          descriptionUrdu: 'Sample Urdu Description',
          location: 'Sample Location Name'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);
      
      // Add headers
      utils.sheet_add_aoa(ws, [[
        'title',
        'titleMalayalam',
        'titleUrdu',
        'description',
        'descriptionMalayalam',
        'descriptionUrdu',
        'location'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, { 
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 25 }, // title
        { wch: 25 }, // titleMalayalam
        { wch: 25 }, // titleUrdu
        { wch: 30 }, // description
        { wch: 30 }, // descriptionMalayalam
        { wch: 30 }, // descriptionUrdu
        { wch: 25 }  // location
      ];

      // Create workbook
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Template');

      // Generate Excel file
      write(wb, { 
        bookType: 'xlsx',
        type: 'array'
      });

      // Convert to blob and download
      const blob = new Blob(
        [write(wb, { bookType: 'xlsx', type: 'array' })], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'place_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
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

    message.info(
      "Bulk actions other than delete are not implemented for places"
    );
  };

  // Filter data based on search
  const filteredPlaces = useMemo(() => {
    return places
      .filter((item) => {
        const searchStr = searchTerm.toLowerCase();
        return (
          item.title?.toLowerCase().includes(searchStr) ||
          item.description?.toLowerCase().includes(searchStr) ||
          item.id?.toLowerCase().includes(searchStr)
        );
      })
      .sort((a, b) => {
        // Sort by ID number (extract numeric part and sort numerically)
        const aId = parseInt(a.id?.replace(/\D/g, "")) || 0;
        const bId = parseInt(b.id?.replace(/\D/g, "")) || 0;
        return aId - bId;
      });
  }, [places, searchTerm]);

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize,
    });
  };

  // Get paginated data
  const paginatedPlaces = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filteredPlaces.slice(startIndex, endIndex);
    console.log(
      `Pagination: Page ${pagination.current}, showing ${paginated.length} of ${filteredPlaces.length} total items`
    );
    return paginated;
  }, [filteredPlaces, pagination.current, pagination.pageSize]);

  // Reset to first page when search changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: filteredPlaces.length,
    }));
  }, [searchTerm]);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(paginatedPlaces.map((row) => row._id));
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

  // Handle row click to view details
  const handleRowClick = (place, event) => {
    // Don't trigger if clicking on checkbox or action buttons
    if (
      event.target.type === "checkbox" ||
      event.target.closest("button") ||
      event.target.closest(".actions-cell")
    ) {
      return;
    }
    setSelectedPlace(place);
    setViewModalVisible(true);
  };

  // Truncate text with read more functionality
  const TruncatedText = ({ text, maxLength = 100, className = "" }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text || text.length <= maxLength) {
      return <span className={className}>{text || "-"}</span>;
    }

    return (
      <div className={className}>
        <span>{isExpanded ? text : `${text.substring(0, maxLength)}...`}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      </div>
    );
  };

  // Table columns configuration
  const placeColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === paginatedPlaces.length &&
            paginatedPlaces.length > 0
          }
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
        <span className="truncate" title={row.id || "-"}>
          {row.id || "-"}
        </span>
      ),
    },
    {
      key: "title",
      title: "Title",
      render: (row) => (
        <span className="truncate" title={row.title || "-"}>
          {row.title || "-"}
        </span>
      ),
    },
    {
      key: "titleMalayalam",
      title: "Ml Title",
      render: (row) => (
        <span className="truncate" title={row.titleMalayalam || "-"}>
          {row.titleMalayalam || "-"}
        </span>
      ),
    },
    {
      key: "titleUrdu",
      title: "Ur Title",
      render: (row) => (
        <span className="truncate" title={row.titleUrdu || "-"}>
          {row.titleUrdu || "-"}
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
      key: "descriptionMalayalam",
      title: "Ml Description",
      render: (row) => (
        <span className="truncate" title={row.descriptionMalayalam || "-"}>
          {row.descriptionMalayalam || "-"}
        </span>
      ),
    },
    {
      key: "descriptionUrdu",
      title: "Ur Description",
      render: (row) => (
        <span className="truncate" title={row.descriptionUrdu || "-"}>
          {row.descriptionUrdu || "-"}
        </span>
      ),
    },
    {
      key: "locationRef",
      title: "Location",
      render: (row) => {
        const locationText =
          row.locationRef?.title || row.locationRef?.name || "No location";
        return (
          <span className="truncate" title={locationText}>
            {locationText}
          </span>
        );
      },
    },
    {
      key: "media",
      title: "Media",
      render: (row) => {
        const imageCount = row.images?.length || 0;
        const hasVideo = row.video ? 1 : 0;
        const hasMap = row.map ? 1 : 0;
        const totalMedia = imageCount + hasVideo + hasMap;
        return (
          <span
            className="truncate"
            title={`${imageCount} images, ${hasVideo} video, ${hasMap} map`}
          >
            {totalMedia} items
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
              console.log("Setting up edit for record:", row);
              console.log("Record images:", recordImages);

              setExistingImages(recordImages);
              form.setFieldsValue({
                id: row.id,
                title: row.title,
                titleMalayalam: row.titleMalayalam || "",
                titleUrdu: row.titleUrdu || "",
                description: row.description || "",
                descriptionMalayalam: row.descriptionMalayalam || "",
                descriptionUrdu: row.descriptionUrdu || "",
                images: recordImages,
                video: row.video || "",
                map: row.map || "",
                locationRef: row.locationRef?._id || undefined,
              });

              // Reset upload state for editing
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
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapPin size={22} />
              PlaceKSA Management
            </h1>
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              Total: {filteredPlaces.length} places
            </div>
          </div>
          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <Button
                danger
                onClick={() => handleBulkAction("delete")}
                icon={<Trash2 size={18} />}
              >
                Delete Selected ({selectedRows.length})
              </Button>
            )}
            <Button
              onClick={handleDownloadTemplate}
              icon={<Download size={18} />}
              style={{ backgroundColor: '#6B7280', borderColor: '#6B7280', color: 'white' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4B5563';
                e.target.style.borderColor = '#4B5563';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#6B7280';
                e.target.style.borderColor = '#6B7280';
              }}
            >
              Download Template
            </Button>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
              id="excel-upload"
            />
            <Button
              onClick={() => document.getElementById('excel-upload').click()}
              icon={<UploadCloud size={18} />}
              className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
            >
              Upload Excel
            </Button>
            <Button
              className="mr-4"
              type="primary"
              onClick={() => {
                setEditingId(null);
                // Reset form and file states when adding new entry
                form.resetFields();
                setUploadedFiles({ images: [], video: null });
                setFileList({ images: [], video: [] });
                setExistingImages([]);
                setModalVisible(true);
              }}
              icon={<Plus size={18} />}
            >
              Add Place
            </Button>

            {/* Debug Info - Remove in production 
                        {process.env.NODE_ENV === 'development' && (
                            <div className="flex items-center gap-2">
                                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    Locations: {locations.length} loaded
                                </div>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        console.log('Current locations:', locations);
                                        fetchLocations();
                                    }}
                                >
                                    Debug Locations
                                </Button>
                            </div>
                        )}*/}
          </div>
        </div>

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

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-3 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-9 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-400"
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected places? This action cannot be undone.`
                  : "Are you sure you want to delete this place? This action cannot be undone."}
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
                  {placeColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === "select"
                          ? "w-12"
                          : column.key === "id"
                          ? "w-16"
                          : column.key === "title"
                          ? "w-24"
                          : column.key === "titleMalayalam"
                          ? "w-20"
                          : column.key === "titleUrdu"
                          ? "w-20"
                          : column.key === "description"
                          ? "w-32"
                          : column.key === "descriptionMalayalam"
                          ? "w-28"
                          : column.key === "descriptionUrdu"
                          ? "w-28"
                          : column.key === "locationRef"
                          ? "w-20"
                          : column.key === "media"
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
                      colSpan={placeColumns.length}
                      className="px-2 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedPlaces.length === 0 ? (
                  <tr>
                    <td
                      colSpan={placeColumns.length}
                      className="px-2 py-4 text-center text-gray-500"
                    >
                      No places found
                    </td>
                  </tr>
                ) : (
                  paginatedPlaces.map((row) => (
                    <tr
                      key={row._id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {placeColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-2 py-2 text-sm text-gray-900 ${
                            column.key === "select"
                              ? "w-12"
                              : column.key === "id"
                              ? "w-16 max-w-16 truncate"
                              : column.key === "title"
                              ? "w-24 max-w-24 truncate"
                              : column.key === "titleMalayalam"
                              ? "w-20 max-w-20 truncate"
                              : column.key === "titleUrdu"
                              ? "w-20 max-w-20 truncate"
                              : column.key === "description"
                              ? "w-32 max-w-32 truncate"
                              : column.key === "descriptionMalayalam"
                              ? "w-28 max-w-28 truncate"
                              : column.key === "descriptionUrdu"
                              ? "w-28 max-w-28 truncate"
                              : column.key === "locationRef"
                              ? "w-20 max-w-20 truncate"
                              : column.key === "media"
                              ? "w-16 max-w-16 truncate"
                              : column.key === "actions"
                              ? "w-20 actions-cell"
                              : ""
                          }`}
                        >
                          {column.render ? column.render(row) : row[column.key]}
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
        {filteredPlaces.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-4 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.current - 1) * pagination.pageSize + 1} to{" "}
                {Math.min(
                  pagination.current * pagination.pageSize,
                  filteredPlaces.length
                )}{" "}
                of {filteredPlaces.length} places
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
                      filteredPlaces.length / pagination.pageSize
                    );
                    const currentPage = pagination.current;
                    const pages = [];

                    // Calculate page range to show
                    let startPage = Math.max(1, currentPage - 2);
                    let endPage = Math.min(totalPages, currentPage + 2);

                    // Adjust range if we're near the beginning or end
                    if (endPage - startPage < 4) {
                      if (startPage === 1) {
                        endPage = Math.min(totalPages, startPage + 4);
                      } else if (endPage === totalPages) {
                        startPage = Math.max(1, endPage - 4);
                      }
                    }

                    // Add first page if not in range
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() =>
                            handlePaginationChange(1, pagination.pageSize)
                          }
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span
                            key="start-ellipsis"
                            className="px-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }
                    }

                    // Add page numbers in range
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() =>
                            handlePaginationChange(i, pagination.pageSize)
                          }
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

                    // Add last page if not in range
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span
                            key="end-ellipsis"
                            className="px-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() =>
                            handlePaginationChange(
                              totalPages,
                              pagination.pageSize
                            )
                          }
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {totalPages}
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
                      Math.ceil(filteredPlaces.length / pagination.pageSize)
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
                        Math.ceil(filteredPlaces.length / pagination.pageSize),
                        pagination.pageSize
                      )
                    }
                    disabled={
                      pagination.current >=
                      Math.ceil(filteredPlaces.length / pagination.pageSize)
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

        {/* View Details Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <MapPin size={20} />
              <span>Place Details</span>
            </div>
          }
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false);
            setSelectedPlace(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setViewModalVisible(false);
                setSelectedPlace(null);
              }}
            >
              Close
            </Button>,
            // <Button
            //   key="edit"
            //   type="primary"
            //   icon={<Edit size={16} />}
            //   onClick={() => {
            //     if (selectedPlace) {
            //       setEditingId(selectedPlace._id);
            //       const recordImages = selectedPlace.images || [];

            //       setExistingImages(recordImages);
            //       form.setFieldsValue({
            //         id: selectedPlace.id,
            //         title: selectedPlace.title,
            //         titleMalayalam: selectedPlace.titleMalayalam || "",
            //         titleUrdu: selectedPlace.titleUrdu || "",
            //         description: selectedPlace.description || "",
            //         descriptionMalayalam:
            //           selectedPlace.descriptionMalayalam || "",
            //         descriptionUrdu: selectedPlace.descriptionUrdu || "",
            //         images: recordImages,
            //         video: selectedPlace.video || "",
            //         map: selectedPlace.map || "",
            //         locationRef: selectedPlace.locationRef?._id || undefined,
            //       });

            //       setUploadedFiles({ images: [], video: null });
            //       setFileList({ images: [], video: [] });
            //       setViewModalVisible(false);
            //       setModalVisible(true);
            //     }
            //   }}
            // >
            //   Edit Place
            // </Button>,
          ]}
          width={1000}
        >
          {selectedPlace && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Place ID
                      </label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedPlace.id || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Title (English)
                      </label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedPlace.title || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Title (Malayalam)
                      </label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedPlace.titleMalayalam || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Title (Urdu)
                      </label>
                      <div className="p-2 bg-gray-50 rounded border text-sm" dir="rtl">
                        {selectedPlace.titleUrdu || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Location & Media
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Location
                      </label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedPlace.locationRef?.title ||
                          selectedPlace.locationRef?.name ||
                          "No location assigned"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Media Count
                      </label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedPlace.images?.length || 0} images,
                        {selectedPlace.video ? " 1 video," : " 0 videos,"}
                        {selectedPlace.map ? " 1 map" : " 0 maps"}
                      </div>
                    </div>
                    {selectedPlace.video && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Video URL
                        </label>
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          <a
                            href={selectedPlace.video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            {selectedPlace.video}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedPlace.map && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Map URL
                        </label>
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          <a
                            href={selectedPlace.map}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            {selectedPlace.map}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Descriptions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Description (English)
                    </label>
                    <div className="p-3 bg-gray-50 rounded border text-sm min-h-[60px]">
                      <TruncatedText
                        text={selectedPlace.description}
                        maxLength={200}
                        className="text-gray-700 leading-relaxed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Description (Malayalam)
                    </label>
                    <div className="p-3 bg-gray-50 rounded border text-sm min-h-[60px]">
                      <TruncatedText
                        text={selectedPlace.descriptionMalayalam}
                        maxLength={200}
                        className="text-gray-700 leading-relaxed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Description (Urdu)
                    </label>
                    <div className="p-3 bg-gray-50 rounded border text-sm min-h-[60px]">
                      <TruncatedText
                        text={selectedPlace.descriptionUrdu}
                        maxLength={200}
                        className="text-gray-700 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Gallery */}
              {selectedPlace.images && selectedPlace.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Images ({selectedPlace.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {selectedPlace.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={imageUrl}
                            alt={`Place image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-xs text-gray-500 bg-gray-100">
                            Image {index + 1}
                          </div>
                        </div>
                        <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Create/Edit Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <MapPin size={20} />
              <span>{editingId ? "Edit Place" : "Add New Place"}</span>
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
                  label="Place ID"
                  rules={[
                    { required: true, message: "Please enter place ID" },
                    { min: 1, message: "Place ID cannot be empty" },
                    {
                      max: 50,
                      message: "Place ID cannot exceed 50 characters",
                    },
                    {
                      pattern: /^[a-zA-Z0-9_-]+$/,
                      message:
                        "Place ID can only contain letters, numbers, hyphens, and underscores",
                    },
                  ]}
                >
                  <Input placeholder="Enter unique place ID" />
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
                  <Input placeholder="Enter place title in English (optional)" />
                </Form.Item>
                <Form.Item
                  name="titleMalayalam"
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
                  <Input placeholder="Enter place title in Malayalam" />
                </Form.Item>
                <Form.Item name="titleUrdu" label="Title (Urdu)">
                  <Input className="mt-1 block w-full border border-gray-300 rounded-md p-2 placeholder:text-left " placeholder="Enter place title in Urdu" dir="rtl" 
                  style={{ textAlign: 'right' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description (English)">
              <TextArea
                rows={2}
                placeholder="Enter a detailed description of the place in English..."
                showCount
              />
            </Form.Item>
            <Form.Item
              name="descriptionMalayalam"
              label="Description (Malayalam) *"
              rules={[
                {
                  required: true,
                  message: "Please enter Malayalam description",
                },
                { min: 1, message: "Malayalam description cannot be empty" },
              ]}
            >
              <TextArea
                rows={2}
                placeholder="Enter description in Malayalam..."
              />
            </Form.Item>
            <Form.Item name="descriptionUrdu" label="Description (Urdu)">
              <TextArea rows={2} className="mt-1 block w-full border border-gray-300 rounded-md p-2 placeholder:text-left " placeholder="Enter description in Urdu" dir="rtl" 
                  style={{ textAlign: 'right' }} />
            </Form.Item>

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
                      uploadProps.beforeUpload(file, "images")
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
                                  console.log(
                                    "Clicked remove existing image button for index:",
                                    index
                                  );
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
                                  console.log(
                                    "Clicked remove new image button for index:",
                                    index
                                  );
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
                  label="YouTube Video URL"
                  rules={[
                    {
                      pattern:
                        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
                      message: "Please enter a valid YouTube URL",
                    },
                  ]}
                >
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
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
                addonBefore="🗺️"
              />
            </Form.Item>

            <Form.Item
              name="locationRef"
              label={
                <div className="flex items-center gap-2">
                  <span>Location</span>
                  <button
                    type="button"
                    onClick={fetchLocations}
                    className="p-1 hover:bg-gray-100 rounded-full text-blue-500"
                    title="Refresh locations"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              }
              help={
                locations.length === 0
                  ? "No locations available. Please add locations first."
                  : `${locations.length} locations available`
              }
            >
              <Select
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
                allowClear
                placeholder={
                  locations.length > 0
                    ? "Select a location"
                    : "Loading locations..."
                }
                notFoundContent={
                  locations.length === 0
                    ? "No locations found"
                    : "No matches found"
                }
                loading={loading}
                onChange={(value) => {
                  console.log("Location selected:", value);
                  console.log(
                    "Selected location details:",
                    locations.find((l) => l._id === value)
                  );
                }}
              >
                {locations.map((location) => (
                  <Option key={location._id} value={location._id}>
                    {[
                      location.title,
                      location.titleMalayalam,
                      location.titleUrdu,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                    {location.id && (
                      <span className="text-gray-500 ml-2">
                        ({location.id})
                      </span>
                    )}
                  </Option>
                ))}
              </Select>
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
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}{" "}
                  Place
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

export default PlaceKSA;

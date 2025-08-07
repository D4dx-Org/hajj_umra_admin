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
  MapPin,
  Search,
  AlertTriangle,
  Trash2,
  Edit,
  Plus,
  UploadCloud,
  X,
  RotateCcw,
} from "lucide-react";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
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
        total: placesResponse.data.count || 0,
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
        title: values.title.trim(),
        titleMalayalam: values.titleMalayalam?.trim() || '',
        titleUrdu: values.titleUrdu?.trim() || '',
        description: values.description?.trim() || '',
        descriptionMalayalam: values.descriptionMalayalam?.trim() || '',
        descriptionUrdu: values.descriptionUrdu?.trim() || '',
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
    return places.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchStr) ||
        item.description?.toLowerCase().includes(searchStr) ||
        item.id?.toLowerCase().includes(searchStr)
      );
    });
  }, [places, searchTerm]);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredPlaces.map((row) => row._id));
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

  // Table columns configuration
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === filteredPlaces.length}
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
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (text) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {text}
        </span>
      ),
    },
    {
      title: "Title (Eng | Malayalam | Urdu)",
      dataIndex: "title",
      key: "title",
      width: 250,
      ellipsis: { showTitle: false },
      render: (_, row) => {
        const values = [row.title, row.titleMalayalam, row.titleUrdu].filter(Boolean).join(' | ');
        return <div title={values} className="font-medium text-sm">{values || '-'}</div>;
      },
    },
    {
      title: "Description (Eng | Malayalam | Urdu)",
      dataIndex: "description",
      key: "description",
      width: 300,
      ellipsis: { showTitle: false },
      render: (_, row) => {
        const values = [row.description, row.descriptionMalayalam, row.descriptionUrdu].filter(Boolean).join(' | ');
        return (
          <div title={values} className="max-w-[300px]">
            {values ? (
              <span className="text-sm text-gray-700">{values.length > 80 ? `${values.substring(0, 80)}...` : values}</span>
            ) : (
              <span className="text-gray-400 text-sm">No description</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Location",
      key: "location",
      width: 150,
      render: (_, record) => {
        if (record.locationRef) {
          return (
            <Tag color="blue" size="small" className="text-xs">
              📍 {record.locationRef.title || record.locationRef.name}
            </Tag>
          );
        } else {
          return (
            <Tag color="gray" size="small" className="text-xs">
              No location
            </Tag>
          );
        }
      },
    },
    {
      title: "Media",
      key: "media",
      width: 200,
      render: (_, record) => (
        <div className="space-y-1">
          {record.images && record.images.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag color="green" size="small">
                📷 {record.images.length}
              </Tag>
              <div className="flex gap-1">
                {record.images.slice(0, 2).map((img, index) => (
                  <Image
                    key={index}
                    width={24}
                    height={18}
                    src={img}
                    preview={{
                      src: img,
                      mask:
                        index === 1 && record.images.length > 2
                          ? `+${record.images.length - 2}`
                          : false,
                    }}
                    style={{ objectFit: "cover", borderRadius: "2px" }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-1">
            {record.video && (
              <Tag
                color="purple"
                size="small"
                className="cursor-pointer"
                onClick={() => window.open(record.video, "_blank")}
                title="Open YouTube video"
              >
                🎥 Video
              </Tag>
            )}
            {record.map && (
              <Tag
                color="orange"
                size="small"
                className="cursor-pointer"
                onClick={() => window.open(record.map, "_blank")}
                title="View map"
              >
                🗺️ Map
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setEditingId(record._id);
              const recordImages = record.images || [];
              console.log("Setting up edit for record:", record);
              console.log("Record images:", recordImages);

              setExistingImages(recordImages);
              form.setFieldsValue({
                id: record.id,
                title: record.title,
                titleMalayalam: record.titleMalayalam || '',
                titleUrdu: record.titleUrdu || '',
                description: record.description || "",
                descriptionMalayalam: record.descriptionMalayalam || '',
                descriptionUrdu: record.descriptionUrdu || '',
                images: recordImages,
                video: record.video || "",
                map: record.map || "",
                locationRef: record.locationRef?._id || undefined,
              });

              // Reset upload state for editing
              setUploadedFiles({ images: [], video: null });
              setFileList({ images: [], video: [] });
              setModalVisible(true);
            }}
            className="p-1 hover:bg-blue-50 rounded text-blue-500"
            title="Edit place"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(record._id)}
            className="p-1 hover:bg-red-50 rounded text-red-500"
            title="Delete place"
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
        <div className="flex justify-between items-center mt-16 mb-4">
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
              className="mr-4"
              type="primary"
              onClick={() => {
                setEditingId(null);
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredPlaces}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} places`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            size="small"
            scroll={{ x: "max-content" }}
          />
        </div>

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
                    { required: true, message: "Please enter title" },
                    { min: 1, message: "Title cannot be empty" },
                    { max: 200, message: "Title cannot exceed 200 characters" },
                  ]}
                >
                  <Input placeholder="Enter place title in English" />
                </Form.Item>
                <Form.Item name="titleMalayalam" label="Title (Malayalam)">
                  <Input placeholder="Enter place title in Malayalam" />
                </Form.Item>
                <Form.Item name="titleUrdu" label="Title (Urdu)">
                  <Input placeholder="Enter place title in Urdu" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description (English)">
              <TextArea
                rows={2}
                placeholder="Enter a detailed description of the place in English..."
                maxLength={500}
                showCount
              />
            </Form.Item>
            <Form.Item name="descriptionMalayalam" label="Description (Malayalam)">
              <TextArea rows={2} placeholder="Enter description in Malayalam..." maxLength={500} />
            </Form.Item>
            <Form.Item name="descriptionUrdu" label="Description (Urdu)">
              <TextArea rows={2} placeholder="Enter description in Urdu..." maxLength={500} />
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
                      location.titleUrdu
                    ].filter(Boolean).join(' | ')}
                    {location.id && (
                      <span className="text-gray-500 ml-2">({location.id})</span>
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

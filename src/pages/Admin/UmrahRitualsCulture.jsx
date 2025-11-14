import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Image,
  message,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Tag,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  Eye,
  RefreshCcw,
  Images,
  X,
} from "lucide-react";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (error) {
    console.warn("Failed to format date:", value);
    return value;
  }
};

const UmrahRitualsCulture = () => {
  const API_URL = `${import.meta.env.VITE_BACKEND_URL_V2}/rituals-culture`;

  const [form] = Form.useForm();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [detailModal, setDetailModal] = useState({
    open: false,
    record: null,
  });

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchRecords = async (
    page = 1,
    pageSize = pagination.pageSize,
    searchValue = ""
  ) => {
    console.log("Fetching Umrah rituals & culture entries", {
      page,
      pageSize,
      searchValue,
    });
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchValue) {
        params.append("search", searchValue);
      }

      const response = await axios.get(`${API_URL}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      console.log("Rituals & culture fetch response", response.data);

      const data =
        response.data.records ||
        response.data.data ||
        response.data.entries ||
        [];
      const total =
        response.data.count ||
        response.data.total ||
        response.data.recordsCount ||
        data.length;

      setRecords(data);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total,
      }));
    } catch (error) {
      console.error("Error fetching rituals & culture data", error);
      message.error(
        error.response?.data?.message || "Failed to load rituals & culture data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1, pagination.pageSize, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const resetModalState = () => {
  setModalVisible(false);
  setEditingId(null);
  setUploadedFiles([]);
  setFileList([]);
  setExistingImages([]);
  setUploading(false);
  form.resetFields();
  form.setFieldsValue({ videos: [{}] });
};

  const openCreateModal = () => {
    console.log("Opening create modal for rituals & culture");
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ videos: [{}] });
    setUploadedFiles([]);
    setFileList([]);
    setExistingImages([]);
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    console.log("Opening edit modal for rituals & culture", record);
    setEditingId(record._id);
    form.setFieldsValue({
      id: record.id,
      title: record.title,
      malayalamTitle: record.malayalamTitle,
      urduTitle: record.urduTitle,
      description: record.description,
      malayalamDescription: record.malayalamDescription,
      urduDescription: record.urduDescription,
      imageTitle: record.imageTitle,
      map: record.map,
      videos:
        Array.isArray(record.videos) && record.videos.length > 0
          ? record.videos.map((videoItem) => ({
              title: videoItem.title || "",
              url: videoItem.url || "",
            }))
          : [],
    });
    setExistingImages(record.images || []);
    setUploadedFiles([]);
    setFileList([]);
    setModalVisible(true);
  };

  const uploadImagesToCdn = async (files) => {
    if (!files || files.length === 0) {
      return [];
    }

    if (!token) {
      message.error("Authentication required. Please log in again.");
      throw new Error("Missing authentication token");
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    console.log("Uploading images to CDN", {
      count: files.length,
      names: files.map((file) => file.name),
    });

    try {
      const response = await axios.post(`${API_URL}/upload-images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded / event.total) * 100);
          console.log("Upload progress", percent);
        },
      });

      console.log("CDN upload response", response.data);

      return (
        response.data.images
          ?.map((item) => item.url)
          .filter((url) => typeof url === "string" && url.length > 0) || []
      );
    } catch (error) {
      console.error("Image upload failed", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const cleanedVideos = Array.isArray(values.videos)
        ? values.videos
            .map((videoItem) => ({
              title: videoItem?.title?.toString().trim() || "",
              url: videoItem?.url?.toString().trim() || "",
            }))
            .filter((videoItem) => videoItem.title || videoItem.url)
        : [];

      const payload = {
        id: values.id.trim(),
        title: values.title?.trim() || "",
        malayalamTitle: values.malayalamTitle?.trim(),
        urduTitle: values.urduTitle?.trim() || "",
        description: values.description?.trim() || "",
        malayalamDescription: values.malayalamDescription?.trim() || "",
        urduDescription: values.urduDescription?.trim() || "",
        imageTitle: values.imageTitle?.trim() || "",
        map: values.map?.trim() || "",
      };

      setUploading(true);
      message.loading({
        content: editingId
          ? "Updating entry, please wait..."
          : "Creating entry, please wait...",
        key: "rituals-culture-submit",
      });

      let combinedImages = [...existingImages];
      if (uploadedFiles.length > 0) {
        try {
          const uploadedUrls = await uploadImagesToCdn(uploadedFiles);
          combinedImages = [...combinedImages, ...uploadedUrls];
        } catch (error) {
          message.destroy("rituals-culture-submit");
          message.error(
            error.response?.data?.message || "Image upload failed. Try again."
          );
          setUploading(false);
          return;
        }
      }

      payload.images = combinedImages;
      payload.videos = cleanedVideos;

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      if (editingId) {
        console.log("Updating rituals & culture entry", {
          editingId,
          payload,
        });
        await axios.put(`${API_URL}/${editingId}`, payload, { headers });
        message.success({
          content: "Entry updated successfully",
          key: "rituals-culture-submit",
        });
      } else {
        console.log("Creating new rituals & culture entry", payload);
        await axios.post(API_URL, payload, { headers });
        message.success({
          content: "Entry created successfully",
          key: "rituals-culture-submit",
        });
      }

      setUploading(false);
      resetModalState();
      fetchRecords(pagination.current, pagination.pageSize, searchTerm.trim());
    } catch (error) {
      console.error("Error submitting rituals & culture form", error);
      message.destroy("rituals-culture-submit");
      if (error?.errorFields) {
        message.error("Please fix validation errors before submitting.");
      } else {
        message.error(
          error.response?.data?.message ||
            "Unable to save entry. Please try again."
        );
      }
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      message.error("Authentication required. Please log in again.");
      return;
    }

    try {
      console.log("Deleting rituals & culture entry", id);
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Entry deleted successfully");
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
      fetchRecords(pagination.current, pagination.pageSize, searchTerm.trim());
    } catch (error) {
      console.error("Error deleting rituals & culture entry", error);
      message.error(
        error.response?.data?.message || "Failed to delete the entry"
      );
    }
  };

  const handleBulkDelete = async () => {
    if (!token) {
      message.error("Authentication required. Please log in again.");
      return;
    }

    if (selectedRowKeys.length === 0) {
      message.info("Please select at least one entry to delete.");
      return;
    }

    try {
      console.log("Bulk deleting rituals & culture entries", selectedRowKeys);
      await axios.post(
        `${API_URL}/bulk-delete`,
        { ids: selectedRowKeys },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Selected entries deleted successfully");
      setSelectedRowKeys([]);
      fetchRecords(pagination.current, pagination.pageSize, searchTerm.trim());
    } catch (error) {
      console.error("Bulk delete failed", error);
      message.error(
        error.response?.data?.message || "Failed to delete selected entries"
      );
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => {
      console.log("Selected rituals & culture rows", keys);
      setSelectedRowKeys(keys);
    },
  };

  const handleTableChange = (paginationInfo) => {
    fetchRecords(
      paginationInfo.current,
      paginationInfo.pageSize,
      searchTerm.trim()
    );
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    const files = newFileList
      .map((item) => item.originFileObj)
      .filter(Boolean);
    setUploadedFiles(files);
    console.log("Updated upload file list", {
      count: files.length,
      names: files.map((file) => file.name),
    });
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      console.log("Removed existing image", {
        removedIndex: index,
        remainingCount: updated.length,
      });
      return updated;
    });
    message.success("Image removed from entry");
  };

  const clearNewUploads = () => {
    setUploadedFiles([]);
    setFileList([]);
    message.info("Cleared new image uploads");
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value === "") {
      fetchRecords(1, pagination.pageSize, "");
    }
  };

  const handleSearchSubmit = (value) => {
    const trimmed = value.trim();
    setSearchTerm(value);
    fetchRecords(1, pagination.pageSize, trimmed);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
      render: (value) => <span className="font-medium text-gray-800">{value}</span>,
    },
    {
      title: "Malayalam Title",
      dataIndex: "malayalamTitle",
      key: "malayalamTitle",
      render: (value) => (
        <span className="text-gray-700 font-medium">{value || "—"}</span>
      ),
    },
    {
      title: "English Title",
      dataIndex: "title",
      key: "title",
      responsive: ["lg"],
      render: (value) => value || "—",
    },
    {
      title: "Images",
      dataIndex: "images",
      key: "images",
      render: (images = []) =>
        images.length > 0 ? (
          <Tag color="blue">{images.length} image(s)</Tag>
        ) : (
          <Tag>No images</Tag>
        ),
    },
    {
      title: "Image Title",
      dataIndex: "imageTitle",
      key: "imageTitle",
      render: (value) => value || "—",
      responsive: ["lg"],
    },
    {
      title: "Videos",
      dataIndex: "videos",
      key: "videos",
      render: (videos = []) =>
        videos.length > 0 ? (
          <Tag color="purple">{videos.length} video(s)</Tag>
        ) : (
          <Tag>—</Tag>
        ),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Eye size={16} />}
            onClick={() => setDetailModal({ open: true, record })}
          />
          <Button
            size="small"
            icon={<Edit size={16} />}
            onClick={() => openEditModal(record)}
          />
          <Button
            size="small"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  const totalEntries = useMemo(() => records.length, [records]);

  const uploadButton = (
    <div className="text-center">
      <UploadCloud className="mx-auto text-blue-500" size={24} />
      <div className="mt-2 text-sm text-gray-600">Upload</div>
    </div>
  );

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} className="hidden md:block w-64" />
      <Navbar
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isOpen={sidebarOpen}
        className="md:px-6 px-4"
      />

      <div
        className={`transition-all duration-300 pr-6 ${
          sidebarOpen ? "ml-72" : "ml-20"
        }`}
      >
        <div className="mt-20 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Images size={28} className="text-blue-500" />
              <Title level={3} style={{ margin: 0 }}>
                Rituals & Culture
              </Title>
            </div>
          </div>

          <Space wrap>
            
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<Trash2 size={16} />}
                onClick={handleBulkDelete}
              >
                Delete ({selectedRowKeys.length})
              </Button>
            )}
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={openCreateModal}
            >
              Add Entry
            </Button>
          </Space>
        </div>

        <Card className="mb-6">
          <Input.Search
            placeholder="Search by title, description, or ID"
            allowClear
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearchSubmit}
            enterButton
            size="large"
          />
        </Card>

        <Card>
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={records}
            rowSelection={rowSelection}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} entries`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </Card>
      </div>

      <Modal
        destroyOnClose
        centered
        width={900}
        title={
          <div className="flex items-center gap-2">
            <Images size={20} className="text-blue-500" />
            <span>{editingId ? "Edit Entry" : "Create Entry"}</span>
          </div>
        }
        open={modalVisible}
        onCancel={resetModalState}
        onOk={handleSubmit}
        okText={editingId ? "Update" : "Create"}
        confirmLoading={uploading}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            id: "",
            title: "",
            malayalamTitle: "",
            urduTitle: "",
            description: "",
            malayalamDescription: "",
            urduDescription: "",
            imageTitle: "",
            map: "",
            videos: [{}],
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id"
                label="Unique ID"
                rules={[
                  { required: true, message: "ID is required" },
                  {
                    pattern: /^[A-Za-z0-9-_]+$/,
                    message: "Use letters, numbers, dash or underscore only",
                  },
                ]}
              >
                <Input placeholder="e.g. ritual-01" maxLength={32} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="malayalamTitle"
                label="Malayalam Title"
                rules={[{ required: true, message: "Malayalam title is required" }]}
              >
                <Input placeholder="മലയാളം ശീര്‍ഷകം" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="English Title">
                <Input placeholder="Enter English title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="urduTitle" label="Urdu Title">
                <Input placeholder="اردو عنوان درج کریں" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="description" label="Description (English)">
                <TextArea rows={3} placeholder="Enter detailed description..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="imageTitle" label="Image Title">
                <Input placeholder="Enter image section title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="map" label="Map URL">
                <Input placeholder="https://maps.google.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="malayalamDescription"
                label="Description (Malayalam)"
              >
                <TextArea rows={3} placeholder="മലയാളത്തിൽ വിവരണം നൽകുക..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="urduDescription" label="Description (Urdu)">
                <TextArea rows={3} placeholder="اردو میں تفصیل درج کریں..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="videos">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-700">Video Links</span>
                  <Button
                    type="dashed"
                    icon={<Plus size={14} />}
                    onClick={() => add({})}
                  >
                    Add Video
                  </Button>
                </div>

                {fields.length === 0 && (
                  <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                    No videos added yet. Use "Add Video" to include YouTube or other URLs with titles.
                  </div>
                )}

                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    className="border border-gray-200 bg-gray-50"
                  >
                    <Row gutter={16} align="middle">
                      <Col span={11}>
                        <Form.Item
                          {...field}
                          label="Video Title"
                          name={[field.name, "title"]}
                          fieldKey={[field.fieldKey, "title"]}
                        >
                          <Input placeholder="Enter video section title" />
                        </Form.Item>
                      </Col>
                      <Col span={11}>
                        <Form.Item
                          {...field}
                          label="Video URL"
                          name={[field.name, "url"]}
                          fieldKey={[field.fieldKey, "url"]}
                        >
                          <Input placeholder="https://youtube.com/..." />
                        </Form.Item>
                      </Col>
                      <Col span={2} className="flex justify-end">
                        <Button
                          danger
                          type="text"
                          icon={<Trash2 size={16} />}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Images">
                <Upload
                  multiple
                  accept="image/*"
                  listType="picture-card"
                  fileList={fileList}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith("image/");
                    if (!isImage) {
                      message.error("Only image files are allowed");
                    }
                    const isLt20M = file.size / 1024 / 1024 < 20;
                    if (!isLt20M) {
                      message.error("Image must be smaller than 20MB");
                    }
                    return false;
                  }}
                  onChange={handleUploadChange}
                  onRemove={() => true}
                  maxCount={10}
                >
                  {fileList.length >= 10 ? null : uploadButton}
                </Upload>
                {uploadedFiles.length > 0 && (
                  <Button
                    type="dashed"
                    icon={<X size={16} />}
                    onClick={clearNewUploads}
                  >
                    Clear New Uploads
                  </Button>
                )}
              </Form.Item>
            </Col>
          </Row>

          {existingImages.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Existing Images ({existingImages.length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingImages.map((imageUrl, index) => (
                  <div
                    key={imageUrl + index}
                    className="relative border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <Image
                      alt={`Existing-${index + 1}`}
                      src={imageUrl}
                      width="100%"
                      height={140}
                      style={{ objectFit: "cover" }}
                      placeholder
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={null}
        width={720}
        title={
          <div className="flex items-center gap-2">
            <Eye size={20} />
            <span>Entry details</span>
          </div>
        }
      >
        {detailModal.record && (
          <div className="space-y-4">
            <Card size="small" bordered={false} className="bg-gray-50">
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">ID</Text>
                  <div className="font-medium">{detailModal.record.id}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Malayalam Title</Text>
                  <div className="font-medium">
                    {detailModal.record.malayalamTitle}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card size="small" bordered={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">English Title</Text>
                  <div>{detailModal.record.title || "—"}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Urdu Title</Text>
                  <div>{detailModal.record.urduTitle || "—"}</div>
                </Col>
              </Row>
            </Card>

            <Card size="small" bordered={false}>
              <Text type="secondary">Description (English)</Text>
              <div>{detailModal.record.description || "—"}</div>
            </Card>

            <Card size="small" bordered={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Description (Malayalam)</Text>
                  <div>{detailModal.record.malayalamDescription || "—"}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Description (Urdu)</Text>
                  <div>{detailModal.record.urduDescription || "—"}</div>
                </Col>
              </Row>
            </Card>

            <Card size="small" bordered={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Image Title</Text>
                  <div>{detailModal.record.imageTitle || "—"}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Map</Text>
                  <div>
                    {detailModal.record.map ? (
                      <a
                        href={detailModal.record.map}
                        className="text-blue-500"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open map
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card size="small" bordered={false}>
              <Text type="secondary">Videos</Text>
              {detailModal.record.videos && detailModal.record.videos.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {detailModal.record.videos.map((videoItem, index) => (
                    <div
                      key={`${videoItem.title || "video"}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-md bg-gray-50 p-3 border border-gray-200"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {videoItem.title || `Video ${index + 1}`}
                        </div>
                        <div>
                          {videoItem.url ? (
                            <a
                              href={videoItem.url}
                              className="text-blue-500 text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Watch video
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">No URL provided</span>
                          )}
                        </div>
                      </div>
                      <Tag color="purple">#{index + 1}</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-1">No videos added.</div>
              )}
            </Card>

            {detailModal.record.images?.length > 0 && (
              <Card size="small" bordered={false} title="Images">
                <Image.PreviewGroup>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailModal.record.images.map((url, index) => (
                      <Image
                        key={url + index}
                        src={url}
                        alt={`Image-${index + 1}`}
                        height={160}
                        style={{ objectFit: "cover" }}
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </Card>
            )}

            <Card size="small" bordered={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Created</Text>
                  <div>{formatDateTime(detailModal.record.createdAt)}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Updated</Text>
                  <div>{formatDateTime(detailModal.record.updatedAt)}</div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UmrahRitualsCulture;


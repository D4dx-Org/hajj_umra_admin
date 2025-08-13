import React, { useState, useEffect, useMemo } from 'react';
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
  Image
} from 'antd';
import { BookOpen, Search, AlertTriangle, Trash2, Edit, Plus, UploadCloud, X, RotateCcw, Download } from 'lucide-react';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { read, utils, write } from 'xlsx';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const DuasManagement = () => {
  const [duasData, setDuasData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRows, setSelectedRows] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    images: [],
    video: null
  });
  const [fileList, setFileList] = useState({
    images: [],
    video: []
  });
  const [existingImages, setExistingImages] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Fetch duas data
  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/duas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDuasData(response.data.duas || []);
      setPagination({
        ...pagination,
        total: response.data.count || 0
      });

    } catch (error) {
      console.error('Error fetching duas data:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        message.error('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      } else {
        message.error('Failed to fetch data. Please try again.');
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
      const isValidType = fileType === 'image'
        ? file.type.startsWith('image/')
        : file.type.startsWith('video/');

      if (!isValidType) {
        message.error(`Please upload a valid ${fileType} file!`);
        return false;
      }

      const maxSize = fileType === 'image' ? 5 : 50; // 5MB for images, 50MB for videos
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        message.error(`${fileType} must be smaller than ${maxSize}MB!`);
        return false;
      }

      return false; // Prevent automatic upload
    },
    showUploadList: false,
    multiple: false
  };

  // Handle file change
  const handleFileChange = (info, fileType) => {
    if (fileType === 'images') {
      // Handle multiple images with limit
      const { fileList } = info;
      const maxImages = 20;

      if (fileList.length > maxImages) {
        message.warning(`Maximum ${maxImages} images allowed. Only the first ${maxImages} images will be kept.`);
      }

      const limitedFileList = fileList.slice(0, maxImages);
      const files = limitedFileList.map(item => item.originFileObj || item).filter(Boolean);

      setUploadedFiles(prev => ({
        ...prev,
        images: files
      }));
      setFileList(prev => ({
        ...prev,
        images: limitedFileList
      }));
    } else {
      // Handle single file (video)
      const { file } = info;
      if (file) {
        setUploadedFiles(prev => ({
          ...prev,
          [fileType]: file
        }));
        setFileList(prev => ({
          ...prev,
          [fileType]: [file]
        }));
      }
    }
  };

  // Remove uploaded file
  const removeFile = (fileType) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: fileType === 'images' ? [] : null
    }));
    setFileList(prev => ({
      ...prev,
      [fileType]: []
    }));
  };

  // Remove specific image from multiple images
  const removeImageFile = (index) => {
    setUploadedFiles(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages
      };
    });
    setFileList(prev => {
      const newFileList = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newFileList
      };
    });
    message.success('Image removed successfully');
  };

  // Remove existing image from form
  const removeExistingImage = (index) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedImages);
    form.setFieldsValue({ images: updatedImages });
    form.validateFields(['images']);
    message.success('Existing image removed successfully');
  };

  // Clear all new uploaded images
  const clearAllNewImages = () => {
    setUploadedFiles(prev => ({
      ...prev,
      images: []
    }));
    setFileList(prev => ({
      ...prev,
      images: []
    }));
    message.success('All new images cleared');
  };

  // Clear all existing images
  const clearAllExistingImages = () => {
    setExistingImages([]);
    form.setFieldsValue({ images: [] });
    form.validateFields(['images']);
    message.success('All existing images cleared');
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
      formData.append('file', file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/duas/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      return response.data.url;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = '/admin-login';
      }
      throw new Error(`Failed to upload ${fileType}: ${error.response?.data?.message || error.message}`);
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
          message.loading('Uploading images...', 0);
          const uploadPromises = uploadedFiles.images.map(file =>
            uploadFileToServer(file, 'image')
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          imageUrls = [...imageUrls, ...uploadedUrls.filter(url => url)];
          message.destroy();
        } catch (error) {
          message.destroy();
          message.error('Failed to upload images');
          return;
        }
      }

      const duasData = {
        id: values.id.trim(),
        title: values.title?.trim() || undefined,
        malayalamTitle: values.malayalamTitle?.trim(),
        urduTitle: values.urduTitle?.trim() || '',
        description: values.description?.trim() || '',
        malayalamDescription: values.malayalamDescription?.trim() || '',
        urduDescription: values.urduDescription?.trim() || '',
        images: imageUrls,
        video: values.video?.trim() || '',
        map: values.map?.trim() || ''
      };

      if (editingId) {
        // Update existing duas data
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL_V2}/duas/${editingId}`,
          duasData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        message.success('Duas entry updated successfully');
      } else {
        // Create new duas data
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL_V2}/duas`,
          duasData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        message.success('Duas entry created successfully');
      }

      resetModalState();
      fetchData();
    } catch (error) {
      console.error('Error saving duas data:', error.response?.data || error.message);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        message.error('An entry with this ID already exists. Please use a different ID.');
      } else {
        message.error(error.response?.data?.message || 'Failed to save duas data');
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
    const ids = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found. Please log in again.");
        return;
      }

      if (ids.length > 1) {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL_V2}/duas/bulk-delete`,
          { ids },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/duas/${ids[0]}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      setDuasData(duasData.filter(item => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
      message.success('Entry(s) deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting entries:', error.response?.data || error.message);
      message.error('Failed to delete entry(s)');
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0) return;

    if (action === 'delete') {
      setDeleteConfirm({
        show: true,
        id: selectedRows,
        isBulk: true
      });
      return;
    }

    message.info('Bulk actions other than delete are not implemented');
  };

  // Filter data based on search
  const filteredDuasData = useMemo(() => {
    return duasData.filter(item => {
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
    });
  }, [duasData, searchTerm]);

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredDuasData.map(row => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select row
  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
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
          id: 'sample_duas_001',
          title: 'Sample Duas Entry (Required)',
          malayalam_title: 'സാമ്പിൾ ദുആ എൻട്രി',
          urdu_title: 'نمونہ دعا انٹری',
          description: 'Sample description for duas content',
          malayalam_description: 'ദുആ ഉള്ളടക്കത്തിനുള്ള സാമ്പിൾ വിവരണം',
          urdu_description: 'دعا کے مواد کے لیے نمونہ تفصیل',
          video: 'https://www.youtube.com/watch?v=sample_video_id',
          map: 'https://maps.google.com/sample_map_link'
        }
      ];

      const ws = utils.json_to_sheet([]);

      // Add headers
      utils.sheet_add_aoa(ws, [[
        'id',
        'title',
        'malayalam_title',
        'urdu_title',
        'description',
        'malayalam_description',
        'urdu_description',
        'video',
        'map'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: 'A2',
        skipHeader: true
      });

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // id
        { wch: 30 }, // title
        { wch: 25 }, // malayalam_title
        { wch: 25 }, // urdu_title
        { wch: 40 }, // description
        { wch: 35 }, // malayalam_description
        { wch: 35 }, // urdu_description
        { wch: 50 }, // video
        { wch: 50 }  // map
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Template');

      const blob = new Blob(
        [write(wb, { bookType: 'xlsx', type: 'array' })],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'duas_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
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

          if (data.length === 0) {
            setUploadError('The Excel file is empty. Please add some data.');
            return;
          }

          // Check required columns
          const firstRow = data[0];
          const hasRequiredColumns = 'id' in firstRow && ('malayalam_title' in firstRow || 'malayalamTitle' in firstRow);

          if (!hasRequiredColumns) {
            setUploadError('Excel file must have required columns: id and malayalam_title');
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2;

            if (!row.id || !(row.malayalam_title || row.malayalamTitle)) {
              setUploadError(`Row ${rowNumber}: Missing required data. Each row must have id and malayalam_title.`);
              return;
            }
          }

          const formData = new FormData();
          formData.append('file', file);

          const token = localStorage.getItem("token");
          if (!token) {
            setUploadError('Authentication token not found. Please log in again.');
            return;
          }

          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL_V2}/duas/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          setUploadSuccess(`Successfully uploaded ${response.data.count} duas entries`);
          setUploadError(null);
          fetchData();
          event.target.value = '';
        } catch (error) {
          console.error('Excel processing error:', error);
          setUploadError(error.response?.data?.message || 'Error processing the Excel file');
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Error processing file. Please try again.');
      setUploadSuccess(null);
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === filteredDuasData.length}
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
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{text}</div>
          {record.malayalamTitle && (
            <div className="text-sm text-blue-600" style={{ fontFamily: 'Arial, sans-serif' }}>
              {record.malayalamTitle}
            </div>
          )}
          {record.urduTitle && (
            <div className="text-sm text-green-600" dir="rtl" style={{ fontFamily: 'Arial, sans-serif' }}>
              {record.urduTitle}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => (
        <div className="space-y-1">
          <div className="text-gray-900">{text || '-'}</div>
          {record.malayalamDescription && (
            <div className="text-sm text-blue-600" style={{ fontFamily: 'Arial, sans-serif' }}>
              {record.malayalamDescription}
            </div>
          )}
          {record.urduDescription && (
            <div className="text-sm text-green-600" dir="rtl" style={{ fontFamily: 'Arial, sans-serif' }}>
              {record.urduDescription}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Media',
      key: 'media',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.images && record.images.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag color="green" size="small">Images ({record.images.length})</Tag>
              <div className="flex gap-1">
                {record.images.slice(0, 3).map((img, index) => (
                  <Image
                    key={index}
                    width={40}
                    height={30}
                    src={img}
                    preview={{
                      src: img,
                      mask: index === 2 && record.images.length > 3 ? `+${record.images.length - 3}` : false
                    }}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                ))}
              </div>
            </div>
          )}
          {record.video && (
            <div className="flex items-center gap-2">
              <Tag color="purple" size="small">Video</Tag>
              <Button
                size="small"
                type="link"
                onClick={() => window.open(record.video, '_blank')}
                className="p-0 h-auto text-red-600"
                title="Open video"
              >
                ▶ Watch
              </Button>
            </div>
          )}
          {record.map && (
            <div className="flex items-center gap-2">
              <Tag color="orange" size="small">Map</Tag>
              <Button
                size="small"
                type="link"
                onClick={() => window.open(record.map, '_blank')}
                className="p-0 h-auto"
              >
                View Map
              </Button>
            </div>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <button
            onClick={() => {
              setEditingId(record._id);
              const recordImages = record.images || [];

              setExistingImages(recordImages);
              form.setFieldsValue({
                id: record.id,
                title: record.title,
                malayalamTitle: record.malayalamTitle || '',
                urduTitle: record.urduTitle || '',
                description: record.description || '',
                malayalamDescription: record.malayalamDescription || '',
                urduDescription: record.urduDescription || '',
                images: recordImages,
                video: record.video || '',
                map: record.map || ''
              });

              setUploadedFiles({ images: [], video: null });
              setFileList({ images: [], video: [] });
              setModalVisible(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Edit size={18} className="text-blue-500" />
          </button>
          <button
            onClick={() => handleDelete(record._id)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} className="hidden md:block w-64" />
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
        className="md:px-6 px-4"
      />

      <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen size={24} />
              Duas Management
            </h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredDuasData.length} entries
            </div>
          </div>

          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 border-0 font-normal"
                style={{
                  backgroundColor: '#ef4444 !important',
                  color: 'white !important',
                  border: 'none !important',
                  borderRadius: '6px !important'
                }}
              >
                Delete Selected ({selectedRows.length})
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600 border-0 font-normal"
              style={{
                backgroundColor: '#6b7280 !important',
                color: 'white !important',
                border: 'none !important',
                borderRadius: '6px !important'
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
                backgroundColor: '#3b82f6 !important',
                color: 'white !important',
                border: 'none !important',
                borderRadius: '6px !important',
                display: 'flex !important'
              }}
            >
              Upload Excel
            </label>
            <button
              onClick={() => {
                setEditingId(null);
                setModalVisible(true);
              }}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600 border-0 font-normal"
              style={{
                backgroundColor: '#22c55e !important',
                color: 'white !important',
                border: 'none !important',
                borderRadius: '6px !important'
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
            <div className="flex items-center gap-2">
              ✓ {uploadSuccess}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search duas entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
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
                  : 'Are you sure you want to delete this entry? This action cannot be undone.'}
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
            dataSource={filteredDuasData}
            rowKey="_id"
            loading={loading}
            pagination={pagination}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <BookOpen size={20} />
              <span>{editingId ? 'Edit Duas Entry' : 'Add New Duas Entry'}</span>
            </div>
          }
          open={modalVisible}
          onCancel={resetModalState}
          footer={null}
          width={900}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="id"
                  label="Entry ID"
                  rules={[
                    { required: true, message: 'Please enter entry ID' },
                    { min: 1, message: 'Entry ID cannot be empty' },
                    { max: 50, message: 'Entry ID cannot exceed 50 characters' },
                    { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Entry ID can only contain letters, numbers, hyphens, and underscores' }
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
                    { max: 200, message: 'Title cannot exceed 200 characters' }
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
                    { required: true, message: 'Please enter Malayalam title' },
                    { min: 1, message: 'Malayalam title cannot be empty' },
                    { max: 200, message: 'Malayalam title cannot exceed 200 characters' }
                  ]}
                >
                  <Input 
                    placeholder="മലയാളത്തിൽ ശീർഷകം നൽകുക" 
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="urduTitle"
                  label="Title (Urdu)"
                  rules={[
                    { max: 200, message: 'Urdu title cannot exceed 200 characters' }
                  ]}
                >
                  <Input 
                    placeholder="اردو میں عنوان درج کریں" 
                    dir="rtl"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description (English)"
            >
              <TextArea
                rows={4}
                placeholder="Enter a detailed description in English..."
                
                showCount
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="malayalamDescription" label="Description (Malayalam)">
                  <TextArea
                    rows={4}
                    placeholder="മലയാളത്തിൽ വിശദമായ വിവരണം നൽകുക..."
                    
                    showCount
                    style={{ fontFamily: 'Arial, sans-serif' }}
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
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* File Upload Sections */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={`Multiple Images Upload (${uploadedFiles.images?.length || 0}/20)`}>
                  <Dragger
                    {...uploadProps}
                    accept="image/*"
                    multiple={true}
                    maxCount={20}
                    onChange={(info) => handleFileChange(info, 'images')}
                    beforeUpload={(file) => uploadProps.beforeUpload(file, 'image')}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadCloud size={40} className="mx-auto text-blue-500" />
                    </p>
                    <p className="ant-upload-text">Click or drag images to upload</p>
                    <p className="ant-upload-hint">
                      Support for jpg, png, gif. Max size 5MB each. Maximum 20 images allowed.
                    </p>
                  </Dragger>

                  {/* Display all images in a compact grid */}
                  {((editingId && existingImages && existingImages.length > 0) ||
                    (uploadedFiles.images && uploadedFiles.images.length > 0)) && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm font-medium text-gray-700">
                            Images ({(existingImages?.length || 0) + (uploadedFiles.images?.length || 0)}/20)
                            <span className="ml-2 text-xs text-gray-500">
                              (Existing: {existingImages?.length || 0}, New: {uploadedFiles.images?.length || 0})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {editingId && existingImages && existingImages.length > 0 && (
                              <button
                                type="button"
                                onClick={clearAllExistingImages}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                title="Clear all existing images"
                              >
                                Clear Existing
                              </button>
                            )}
                            {uploadedFiles.images && uploadedFiles.images.length > 0 && (
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
                          {editingId && existingImages && existingImages.map((imageUrl, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <div className="relative w-16 h-16 border-2 border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                                <img
                                  src={imageUrl}
                                  alt={`Existing ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
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
                          {uploadedFiles.images && uploadedFiles.images.map((file, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <div className="relative w-16 h-16 border-2 border-green-200 rounded-lg overflow-hidden bg-green-50">
                                {file && file.type?.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`New ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
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
                  rules={[{
                    type: 'url',
                    message: 'Please enter a valid URL'
                  }]}
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
              rules={[{
                type: 'url',
                message: 'Please enter a valid URL'
              }]}
            >
              <Input
                placeholder="https://maps.google.com/... or any map URL"
                addonBefore="🗺"
              />
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
                  {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')} Entry
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

export default DuasManagement;
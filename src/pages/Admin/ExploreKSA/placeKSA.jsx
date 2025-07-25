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
import { MapPin, Search, AlertTriangle, Trash2, Edit, Plus, UploadCloud, X, RotateCcw } from 'lucide-react';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';

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

    // Fetch only locations
    const fetchLocations = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`);

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
            console.log('Refreshed locations:', locationData);

        } catch (error) {
            console.error('Error fetching locations:', error);
            message.error('Failed to fetch locations');
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
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`).catch(err => {
                    console.error('Locations fetch failed:', err);
                    console.error('Locations URL:', `${import.meta.env.VITE_BACKEND_URL_V2}/locations`);
                    return { data: [] }; // Return empty data instead of failing completely
                })
            ]);

            // Handle places response
            setPlaces(placesResponse.data.places || []);
            setPagination({
                ...pagination,
                total: placesResponse.data.count || 0
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
            console.log('Fetched locations:', locationData); // Debug log
            console.log('Locations response structure:', locationsResponse.data); // Debug log

        } catch (error) {
            console.error('Error fetching data:', error.response?.data || error.message);

            // More specific error handling
            if (error.response?.status === 401) {
                message.error('Authentication failed. Please log in again.');
                localStorage.removeItem('token');
            } else if (error.message.includes('locations')) {
                message.error('Failed to fetch locations. Please check your connection.');
            } else {
                message.error('Failed to fetch data. Please try again.');
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
        setUploadedFiles(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Upload file to server
    const uploadFileToServer = async (file, fileType) => {
        if (!file) return null;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found. Please log in again.");
            }

            console.log('Uploading file:', file.name, 'Type:', fileType);

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL_V2}/places/upload`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // Don't set Content-Type manually for FormData, let browser set it
                    }
                }
            );

            console.log('Upload successful:', response.data);
            return response.data.url;
        } catch (error) {
            console.error(`Error uploading ${fileType}:`, error);
            if (error.response?.status === 401) {
                alert("Your session has expired. Please log in again.");
                // Optionally redirect to login
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

            let imageUrls = values.images || []; // Keep existing URLs if editing

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

            const placeData = {
                id: values.id.trim(),
                title: values.title.trim(),
                description: values.description?.trim() || '',
                images: imageUrls,
                video: values.video?.trim() || '', // YouTube URL
                map: values.map?.trim() || '', // Map link
                locationRef: values.locationRef || null
            };

            console.log('=== FORM SUBMISSION DEBUG ===');
            console.log('Form values:', values);
            console.log('Place data being sent:', placeData);
            console.log('Selected locationRef:', values.locationRef);
            console.log('LocationRef type:', typeof values.locationRef);
            console.log('Available locations:', locations.map(l => ({ id: l._id, title: l.title })));

            if (editingId) {
                // Update existing place - backend expects custom id field
                const placeToUpdate = places.find(p => p._id === editingId);
                const response = await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL_V2}/places/${placeToUpdate.id}`,
                    placeData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                message.success('Place updated successfully');
            } else {
                // Create new place
                console.log('Sending POST request to:', `${import.meta.env.VITE_BACKEND_URL_V2}/places`);
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL_V2}/places`,
                    placeData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log('Backend response:', response.data);
                message.success('Place created successfully');
            }

            resetModalState();
            fetchData();
        } catch (error) {
            console.error('Error saving place:', error.response?.data || error.message);

            // Handle specific error cases
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                message.error('A place with this ID already exists. Please use a different ID.');
            } else if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid location')) {
                message.error('Invalid location selected. Please choose a valid location.');
            } else {
                message.error(error.response?.data?.message || 'Failed to save place');
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
    };

    // Handle place deletion
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
                await axios.post(`${import.meta.env.VITE_BACKEND_URL_V2}/places/bulk-delete`,
                    { ids },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } else {
                await axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/places/${ids[0]}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            setPlaces(places.filter(item => !ids.includes(item.id)));
            setSelectedRows([]);
            setDeleteConfirm({ show: false, id: null });
            message.success('Place(s) deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting places:', error.response?.data || error.message);
            message.error('Failed to delete place(s)');
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

        message.info('Bulk actions other than delete are not implemented for places');
    };

    // Filter data based on search
    const filteredPlaces = useMemo(() => {
        return places.filter(item => {
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
            setSelectedRows(filteredPlaces.map(row => row._id));
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

    // Table columns configuration
    const columns = [
        {
            key: 'select',
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
            key: 'title'
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => text || '-'
        },
        {
            title: 'Location',
            key: 'location',
            render: (_, record) => {
                if (record.locationRef) {
                    return (
                        <Tag color="blue">
                            {record.locationRef.title || record.locationRef.name}
                        </Tag>
                    );
                } else {
                    return <Tag color="gray">No location</Tag>;
                }
            }
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
                            <Tag color="purple" size="small">YouTube</Tag>
                            <Button
                                size="small"
                                type="link"
                                onClick={() => window.open(record.video, '_blank')}
                                className="p-0 h-auto text-red-600"
                                title="Open YouTube video"
                            >
                                ▶️ Watch
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
                            form.setFieldsValue({
                                id: record.id,
                                title: record.title,
                                description: record.description || '',
                                image: record.image || '',
                                video: record.video || '',
                                map: record.map || '',
                                locationRef: record.locationRef?._id || undefined
                            });
                            setModalVisible(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <Edit size={18} className="text-blue-500" />
                    </button>
                    <button
                        onClick={() => handleDelete(record.id)}
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
                            <MapPin size={24} />
                            PlaceKSA Management
                        </h1>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            Total: {filteredPlaces.length} places
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {selectedRows.length > 0 && (
                            <Button
                                danger
                                onClick={() => handleBulkAction('delete')}
                                icon={<Trash2 size={18} />}
                            >
                                Delete Selected ({selectedRows.length})
                            </Button>
                        )}
                        <Button className='mr-4'
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
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search places..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        />
                        <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
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
                                    : 'Are you sure you want to delete this place? This action cannot be undone.'}
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
                        pagination={pagination}
                    />
                </div>

                {/* Create/Edit Modal */}
                <Modal
                    title={
                        <div className="flex items-center gap-2">
                            <MapPin size={20} />
                            <span>{editingId ? 'Edit Place' : 'Add New Place'}</span>
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
                                    label="Place ID"
                                    rules={[
                                        { required: true, message: 'Please enter place ID' },
                                        { min: 1, message: 'Place ID cannot be empty' },
                                        { max: 50, message: 'Place ID cannot exceed 50 characters' },
                                        { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Place ID can only contain letters, numbers, hyphens, and underscores' }
                                    ]}
                                >
                                    <Input placeholder="Enter unique place ID" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="title"
                                    label="Title"
                                    rules={[
                                        { required: true, message: 'Please enter title' },
                                        { min: 1, message: 'Title cannot be empty' },
                                        { max: 200, message: 'Title cannot exceed 200 characters' }
                                    ]}
                                >
                                    <Input placeholder="Enter place title" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <TextArea
                                rows={4}
                                placeholder="Enter a detailed description of the place..."
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>

                        {/* File Upload Sections */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label={`Multiple Images Upload (${uploadedFiles.images?.length || 0}/5)`}>
                                    <Dragger
                                        {...uploadProps}
                                        accept="image/*"
                                        multiple={true}
                                        maxCount={5}
                                        onChange={(info) => handleFileChange(info, 'images')}
                                        beforeUpload={(file) => uploadProps.beforeUpload(file, 'images')}
                                    >
                                        <p className="ant-upload-drag-icon">
                                            <UploadCloud size={40} className="mx-auto text-blue-500" />
                                        </p>
                                        <p className="ant-upload-text">Click or drag images to upload</p>
                                        <p className="ant-upload-hint">
                                            Support for jpg, png, gif. Max size 5MB each. Maximum 5 images allowed.
                                        </p>
                                    </Dragger>

                                    {/* Display uploaded images */}
                                    {uploadedFiles.images && uploadedFiles.images.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {uploadedFiles.images.map((file, index) => (
                                                <div key={index} className="relative border rounded-lg p-2">
                                                    <div className="text-xs text-gray-600 truncate">
                                                        {file.name}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImageFile(index)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
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
                                            pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
                                            message: 'Please enter a valid YouTube URL'
                                        }
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
                                    type: 'url',
                                    message: 'Please enter a valid URL'
                                }
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
                            help={locations.length === 0 ? "No locations available. Please add locations first." : `${locations.length} locations available`}
                        >
                            <Select
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                allowClear
                                placeholder={locations.length > 0 ? "Select a location" : "Loading locations..."}
                                notFoundContent={locations.length === 0 ? "No locations found" : "No matches found"}
                                loading={loading}
                                onChange={(value) => {
                                    console.log('Location selected:', value);
                                    console.log('Selected location details:', locations.find(l => l._id === value));
                                }}
                            >
                                {locations.map(location => (
                                    <Option key={location._id} value={location._id}>
                                        <div className="flex items-center justify-between">
                                            <span>
                                                <strong>{location.title || location.name}</strong>
                                                {location.id && (
                                                    <span className="text-gray-500 ml-2">({location.id})</span>
                                                )}
                                            </span>
                                            {location.description && (
                                                <span className="text-xs text-gray-400 truncate ml-2 max-w-[100px]">
                                                    {location.description}
                                                </span>
                                            )}
                                        </div>
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
                                    {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')} Place
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
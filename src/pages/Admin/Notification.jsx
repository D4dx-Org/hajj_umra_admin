import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Badge,
    Tag,
    message,
    Popconfirm,
    Card,
    Row,
    Col,
    Typography,
    Upload
} from 'antd';
import { Bell, Search, AlertTriangle, Trash2, Edit, Plus, UploadCloud } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Define backend URL
const BACKEND_URL = 'http://localhost:5000';

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
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
    const [selectedType, setSelectedType] = useState('text');

    // Fetch notifications
    const fetchNotifications = async (page = 1, pageSize = 10) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                message.error("No token found. Please log in again.");
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Notifications response:', response.data);
            setNotifications(response.data.notifications || []);
            setPagination({
                ...pagination,
                total: response.data.total || 0
            });
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data || error.message);
            message.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Add file upload configuration
    const uploadProps = {
        beforeUpload: (file) => {
            // Validate file size (5MB)
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('File must be smaller than 5MB!');
                return Upload.LIST_IGNORE;
            }
            return false; // Prevent automatic upload
        },
        maxCount: 1,
        fileList: form.getFieldValue('file') ? [form.getFieldValue('file')] : []
    };

    // Handle form submission with file upload
    const handleSubmit = async (values) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                message.error("No token found. Please log in again.");
                return;
            }

            let contentUrl = '';
            
            // Handle file upload if type is image or pdf
            if ((values.type === 'image' || values.type === 'pdf') && values.file?.[0]?.originFileObj) {
                const formData = new FormData();
                formData.append('file', values.file[0].originFileObj);

                console.log('Uploading file to DigitalOcean:', {
                    fileName: values.file[0].originFileObj.name,
                    fileType: values.file[0].originFileObj.type,
                    fileSize: values.file[0].originFileObj.size
                });

                try {
                    const uploadResponse = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/notifications/upload`,
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (!uploadResponse.data.url) {
                        throw new Error('No URL returned from server');
                    }

                    contentUrl = uploadResponse.data.url;
                    console.log('File uploaded successfully to DigitalOcean:', contentUrl);
                } catch (error) {
                    console.error('Upload error:', error.response?.data || error);
                    message.error(error.response?.data?.message || 'Failed to upload file to DigitalOcean');
                    return;
                }
            } else if (values.type === 'link' || values.type === 'text') {
                contentUrl = values.content;
            }

            const notificationData = {
                title: values.title,
                description: values.description,
                type: values.type,
                content: contentUrl
            };

            if (editingId) {
                // Update existing notification
                await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/notifications/${editingId}`,
                    notificationData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                message.success('Notification updated successfully');
            } else {
                // Create new notification
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/notifications`,
                    notificationData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                message.success('Notification created successfully');
            }
            setModalVisible(false);
            setEditingId(null);
            form.resetFields();
            setSelectedType('text');
            fetchNotifications();
        } catch (error) {
            console.error('Error saving notification:', error.response?.data || error.message);
            message.error('Failed to save notification');
        }
    };

    // Handle notification deletion
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
                // Use bulk delete endpoint for multiple notifications
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/notifications/bulk-delete`, 
                    { ids },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } else {
                // Use single delete endpoint for one notification
                await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/notifications/${ids[0]}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            setNotifications(notifications.filter(item => !ids.includes(item._id)));
            setSelectedRows([]);
            setDeleteConfirm({ show: false, id: null });
            message.success('Notification(s) deleted successfully');
            fetchNotifications(); // Refresh the list
        } catch (error) {
            console.error('Error deleting notifications:', error.response?.data || error.message);
            message.error('Failed to delete notification(s)');
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

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                message.error("No token found. Please log in again.");
                return;
            }

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/notifications/bulk-update`, {
                ids: selectedRows,
                status: action
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            message.success('Selected notifications updated successfully');
            setSelectedRows([]);
            fetchNotifications();
        } catch (error) {
            console.error('Error performing bulk action:', error.response?.data || error.message);
            message.error('Failed to perform bulk action');
        }
    };

    // Filter data based on search
    const filteredNotifications = useMemo(() => {
        return notifications.filter(item => {
            const searchStr = searchTerm.toLowerCase();
            return (
                item.title?.toLowerCase().includes(searchStr) ||
                item.description?.toLowerCase().includes(searchStr) ||
                item.type?.toLowerCase().includes(searchStr)
            );
        });
    }, [notifications, searchTerm]);

    // Handle select all
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedRows(filteredNotifications.map(row => row._id));
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

    // Function to render content field based on type
    const renderContentField = (type) => {
        switch (type) {
            case 'link':
                return (
                    <Form.Item
                        name="content"
                        label="Link URL"
                        rules={[
                            { required: true, message: 'Please enter the link URL' },
                            { type: 'url', message: 'Please enter a valid URL' }
                        ]}
                    >
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                );
            case 'text':
                return (
                    <Form.Item
                        name="content"
                        label="Text Content"
                        rules={[{ required: true, message: 'Please enter the text content' }]}
                    >
                        <TextArea rows={4} placeholder="Enter your text content here" />
                    </Form.Item>
                );
            case 'image':
                return (
                    <Form.Item
                        name="file"
                        label="Upload Image"
                        rules={[{ required: true, message: 'Please upload an image' }]}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            if (Array.isArray(e)) {
                                return e;
                            }
                            return e?.fileList;
                        }}
                    >
                        <Upload
                            {...uploadProps}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadCloud size={18} />}>Upload Image</Button>
                        </Upload>
                    </Form.Item>
                );
            case 'pdf':
                return (
                    <Form.Item
                        name="file"
                        label="Upload PDF"
                        rules={[{ required: true, message: 'Please upload a PDF file' }]}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            if (Array.isArray(e)) {
                                return e;
                            }
                            return e?.fileList;
                        }}
                    >
                        <Upload
                            {...uploadProps}
                            accept=".pdf"
                        >
                            <Button icon={<UploadCloud size={18} />}>Upload PDF</Button>
                        </Upload>
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: 'select',
            title: (
                <input
                    type="checkbox"
                    checked={selectedRows.length === filteredNotifications.length}
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
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={
                    type === 'link' ? 'blue' :
                    type === 'image' ? 'green' :
                    type === 'pdf' ? 'red' : 'default'
                }>
                    {type.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'Content',
            key: 'content',
            render: (_, record) => {
                switch (record.type) {
                    case 'link':
                        return <a href={record.content} target="_blank" rel="noopener noreferrer">Open Link</a>;
                    case 'text':
                        return <span>{record.content.substring(0, 50)}...</span>;
                    case 'image':
                        return <img src={record.content} alt="Preview" style={{ maxWidth: 50, maxHeight: 50 }} />;
                    case 'pdf':
                        return <a href={record.content} target="_blank" rel="noopener noreferrer">View PDF</a>;
                    default:
                        return '-';
                }
            }
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
                                ...record
                            });
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
                            <Bell size={24} />
                            Notification Management
                        </h1>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            Total: {filteredNotifications.length} notifications
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {selectedRows.length > 0 && (
                            <Space>
                                <Button onClick={() => handleBulkAction('read')}>
                                    Mark as Read
                                </Button>
                                <Button onClick={() => handleBulkAction('archived')}>
                                    Archive
                                </Button>
                                <Button 
                                    danger 
                                    onClick={() => handleBulkAction('delete')}
                                    icon={<Trash2 size={18} />}
                                >
                                    Delete Selected ({selectedRows.length})
                                </Button>
                            </Space>
                        )}
                        <Button className='mr-4'
                            type="primary"
                            onClick={() => {
                                setEditingId(null);
                                setModalVisible(true);
                            }}
                            icon={<Plus size={18} />}
                        >
                            Create Notification
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search notifications..."
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
                        dataSource={filteredNotifications}
                        rowKey="_id"
                        loading={loading}
                        pagination={pagination}
                    />
                </div>

                {/* Create/Edit Modal */}
                <Modal
                    title={
                        <div className="flex items-center gap-2">
                            <Bell size={20} />
                            <span>{editingId ? 'Edit Notification' : 'Create Notification'}</span>
                        </div>
                    }
                    visible={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setEditingId(null);
                        form.resetFields();
                        setSelectedType('text');
                    }}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[{ required: true, message: 'Please enter title' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <TextArea rows={4} />
                        </Form.Item>
                        <Form.Item
                            name="type"
                            label="Type"
                            rules={[{ required: true, message: 'Please select type' }]}
                        >
                            <Select onChange={(value) => setSelectedType(value)}>
                                <Option value="link">Link</Option>
                                <Option value="image">Image</Option>
                                <Option value="pdf">PDF</Option>
                                <Option value="text">Text</Option>
                            </Select>
                        </Form.Item>
                        {renderContentField(selectedType)}
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" icon={<Plus size={18} />}>
                                    Submit
                                </Button>
                                <Button onClick={() => setModalVisible(false)}>
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

export default Notification; 
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
import { Bell, Search, AlertTriangle, Trash2, Edit, Plus, UploadCloud, X } from 'lucide-react';
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
    const [contents, setContents] = useState([{ type: 'text', value: '' }]);

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
        maxCount: 1
    };

    // Handle cover image upload
    const handleCoverImageUpload = async (file) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                message.error("No token found. Please log in again.");
                return null;
            }

            const formData = new FormData();
            formData.append('file', file);

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

            return uploadResponse.data.url;
        } catch (error) {
            console.error('Cover image upload error:', error);
            message.error('Failed to upload cover image');
            return null;
        }
    };

    // Handle form submission with file upload
    const handleSubmit = async (values) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                message.error("No token found. Please log in again.");
                return;
            }

            // Upload cover image if provided
            let coverImageUrl = values.coverImage;
            if (values.coverImageFile?.[0]?.originFileObj) {
                coverImageUrl = await handleCoverImageUpload(values.coverImageFile[0].originFileObj);
                if (!coverImageUrl) return;
            }

            // Process multiple contents
            const processedContents = [];
            for (let i = 0; i < contents.length; i++) {
                const content = contents[i];
                const contentValue = values[`content_${i}`];
                const contentFile = values[`file_${i}`];

                let finalValue = '';

                if (content.type === 'image' || content.type === 'pdf') {
                    if (contentFile?.[0]?.originFileObj) {
                        // Upload new file
                        const formData = new FormData();
                        formData.append('file', contentFile[0].originFileObj);

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
                            finalValue = uploadResponse.data.url;
                        } catch (error) {
                            console.error('Content file upload error:', error);
                            message.error(`Failed to upload ${content.type} file`);
                            return;
                        }
                    } else {
                        // Use existing value (when editing and no new file uploaded)
                        finalValue = content.value || '';
                    }
                } else {
                    // For link and text, use the value from form
                    finalValue = contentValue || content.value || '';
                }

                if (finalValue) {
                    processedContents.push({
                        type: content.type,
                        value: finalValue
                    });
                }
            }

            if (processedContents.length === 0) {
                message.error('Please add at least one content item');
                return;
            }

            const notificationData = {
                title: values.title,
                description: values.description,
                coverImage: coverImageUrl || '',
                contents: processedContents
            };

            console.log('Submitting notification data:', notificationData);

            if (editingId) {
                // Update existing notification
                const response = await axios.put(
                    `${import.meta.env.VITE_BACKEND_URL}/notifications/${editingId}`,
                    notificationData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                message.success('Notification updated successfully');
                message.success('Push notification sent to all users');
                console.log('Update response:', response.data);
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
                message.success('Push notification sent to all users');
            }

            setModalVisible(false);
            setEditingId(null);
            form.resetFields();
            setContents([{ type: 'text', value: '' }]);
            fetchNotifications();
        } catch (error) {
            console.error('Error saving notification:', error.response?.data || error.message);
            message.error(error.response?.data?.message || 'Failed to save notification');
            if (error.response?.data?.pushError) {
                message.warning('Notification saved but failed to send push notification');
            }
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
        // Ensure notifications is an array
        if (!Array.isArray(notifications)) {
            return [];
        }
        
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

    // Add new content item
    const addContentItem = () => {
        setContents([...contents, { type: 'text', value: '' }]);
    };

    // Remove content item
    const removeContentItem = (index) => {
        const newContents = contents.filter((_, i) => i !== index);
        if (newContents.length === 0) {
            setContents([{ type: 'text', value: '' }]);
        } else {
            setContents(newContents);
        }
    };

    // Update content type
    const updateContentType = (index, newType) => {
        const newContents = [...contents];
        newContents[index].type = newType;
        newContents[index].value = '';
        setContents(newContents);
    };

    // Function to render content field based on type
    const renderContentField = (content, index) => {
        const fieldName = content.type === 'image' || content.type === 'pdf' 
            ? `file_${index}` 
            : `content_${index}`;

        switch (content.type) {
            case 'link':
                return (
                    <Form.Item
                        name={fieldName}
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
                        name={fieldName}
                        label="Text Content"
                        rules={[{ required: true, message: 'Please enter the text content' }]}
                    >
                        <TextArea rows={4} placeholder="Enter your text content here" />
                    </Form.Item>
                );
            case 'image':
                return (
                    <Form.Item
                        name={fieldName}
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
                        name={fieldName}
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
            width: 60,
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
            key: 'title',
            width: 200,
            ellipsis: true,
            render: (text) => <span title={text}>{text}</span>
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            ellipsis: true,
            render: (text) => <span title={text || '-'}>{text || '-'}</span>
        },
        {
            title: 'Cover Image',
            key: 'coverImage',
            width: 120,
            render: (_, record) => {
                if (record.coverImage) {
                    return <img src={record.coverImage} alt="Cover" style={{ maxWidth: 80, maxHeight: 80, objectFit: 'cover' }} />;
                }
                return <span className="text-gray-400">No cover</span>;
            }
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'Contents',
            key: 'contents',
            width: 300,
            ellipsis: true,
            render: (_, record) => {
                const contents = record.contents || [];
                if (contents.length === 0) return '-';
                
                return (
                    <div className="space-y-2">
                        {contents.map((content, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Tag color={
                                    content.type === 'link' ? 'blue' :
                                    content.type === 'image' ? 'green' :
                                    content.type === 'pdf' ? 'red' : 'default'
                                }>
                                    {content.type.toUpperCase()}
                                </Tag>
                                {content.type === 'link' && (
                                    <a href={content.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs truncate max-w-xs">
                                        {content.value}
                                    </a>
                                )}
                                {content.type === 'text' && (
                                    <span className="text-xs text-gray-600 truncate max-w-xs" title={content.value}>
                                        {content.value.substring(0, 30)}...
                                    </span>
                                )}
                                {content.type === 'image' && (
                                    <img src={content.value} alt="Preview" style={{ maxWidth: 30, maxHeight: 30 }} />
                                )}
                                {content.type === 'pdf' && (
                                    <a href={content.value} target="_blank" rel="noopener noreferrer" className="text-red-600 text-xs">
                                        View PDF
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space>
                    <button
                        onClick={() => {
                            setEditingId(record._id);
                            const formValues = {
                                title: record.title,
                                description: record.description,
                                coverImage: record.coverImage || ''
                            };
                            
                            // Set contents for editing
                            if (record.contents && record.contents.length > 0) {
                                setContents(record.contents.map(c => ({ type: c.type, value: c.value })));
                                record.contents.forEach((content, idx) => {
                                    if (content.type === 'image' || content.type === 'pdf') {
                                        formValues[`file_${idx}`] = [];
                                    } else {
                                        formValues[`content_${idx}`] = content.value;
                                    }
                                });
                            } else {
                                setContents([{ type: 'text', value: '' }]);
                            }
                            
                            form.setFieldsValue(formValues);
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
                            setContents([{ type: 'text', value: '' }]);
                            form.resetFields();
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
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
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
                <div className="bg-white rounded-lg shadow overflow-x-auto full text-sm">
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
                        setContents([{ type: 'text', value: '' }]);
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
                            name="coverImageFile"
                            label="Cover Image"
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
                                <Button icon={<UploadCloud size={18} />}>Upload Cover Image</Button>
                            </Upload>
                        </Form.Item>
                        {form.getFieldValue('coverImage') && !form.getFieldValue('coverImageFile')?.[0] && (
                            <div className="mb-4">
                                <img src={form.getFieldValue('coverImage')} alt="Current cover" style={{ maxWidth: 200, maxHeight: 200 }} />
                            </div>
                        )}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Contents *</label>
                                <Button type="dashed" onClick={addContentItem} icon={<Plus size={16} />} size="small">
                                    Add Content
                                </Button>
                            </div>
                            {contents.map((content, index) => (
                                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <Form.Item
                                            name={`contentType_${index}`}
                                            initialValue={content.type}
                                            className="mb-0 flex-1 mr-2"
                                        >
                                            <Select onChange={(value) => updateContentType(index, value)}>
                                                <Option value="link">Link</Option>
                                                <Option value="image">Image</Option>
                                                <Option value="pdf">PDF</Option>
                                                <Option value="text">Text</Option>
                                            </Select>
                                        </Form.Item>
                                        {contents.length > 1 && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<X size={16} />}
                                                onClick={() => removeContentItem(index)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    {renderContentField(content, index)}
                                    {editingId && (content.type === 'image' || content.type === 'pdf') && content.value && (
                                        <div className="mt-2">
                                            <span className="text-xs text-gray-500">Current: </span>
                                            {content.type === 'image' ? (
                                                <img src={content.value} alt="Current" style={{ maxWidth: 100, maxHeight: 100 }} />
                                            ) : (
                                                <a href={content.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs">
                                                    View Current PDF
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
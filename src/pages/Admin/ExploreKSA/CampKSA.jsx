import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Download, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import axios from 'axios';
import { read, utils, write } from 'xlsx';
import AsyncSelect from 'react-select/async';

const Camp = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [campData, setCampData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false); // State to control edit mode
  const [locations, setLocations] = useState([]); // New state for locations
  const [selectedRows, setSelectedRows] = useState([]);
  const [newCamp, setNewCamp] = useState({
    maktab: '',
    maktabMalayalam: '',
    maktabUrdu: '',
    zone: '',
    zoneMalayalam: '',
    zoneUrdu: '',
    country: '',
    poll: '',
    pollMalayalam: '',
    pollUrdu: '',
    road: '',
    roadMalayalam: '',
    roadUrdu: '',
    tent: '',
    tentMalayalam: '',
    tentUrdu: '',
    location: { lat: '', lng: '' },
    ref: '',
    otherCountry: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [countries, setCountries] = useState([]); // Add state for countries
  const [sortConfig, setSortConfig] = useState({ field: 'maktab', direction: 'asc', type: 'alpha' });

  // Add sorting options
  const sortOptions = [
    { value: 'maktab-alpha-asc', label: 'Maktab (A-Z)', field: 'maktab', direction: 'asc', type: 'alpha' },
    { value: 'maktab-alpha-desc', label: 'Maktab (Z-A)', field: 'maktab', direction: 'desc', type: 'alpha' },
    { value: 'maktab-numeric-asc', label: 'Maktab (1-9)', field: 'maktab', direction: 'asc', type: 'numeric' },
    { value: 'maktab-numeric-desc', label: 'Maktab (9-1)', field: 'maktab', direction: 'desc', type: 'numeric' },
    { value: 'locationRef-alpha-asc', label: 'Location (A-Z)', field: 'locationRef', direction: 'asc', type: 'alpha' },
    { value: 'locationRef-alpha-desc', label: 'Location (Z-A)', field: 'locationRef', direction: 'desc', type: 'alpha' },
    { value: 'ref-alpha-asc', label: 'Branch (A-Z)', field: 'ref', direction: 'asc', type: 'alpha' },
    { value: 'ref-alpha-desc', label: 'Branch (Z-A)', field: 'ref', direction: 'desc', type: 'alpha' }
  ];

  // Add handle sort change
  const handleSortChange = (event) => {
    const selectedOption = sortOptions.find(option => option.value === event.target.value);
    if (selectedOption) {
      setSortConfig({
        field: selectedOption.field,
        direction: selectedOption.direction,
        type: selectedOption.type
      });
    }
  };

  // Add sort function
  const sortData = (data) => {
    // Ensure data is an array before spreading
    if (!Array.isArray(data)) {
      return [];
    }

    return [...data].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.field === 'country') {
        aValue = a.otherCountry || (a.country?.name || '');
        bValue = b.otherCountry || (b.country?.name || '');
      } else if (sortConfig.field === 'ref') {
        aValue = a[sortConfig.field]?.name || '';
        bValue = b[sortConfig.field]?.name || '';
      } else {
        aValue = a[sortConfig.field] || '';
        bValue = b[sortConfig.field] || '';
      }

      if (sortConfig.type === 'numeric') {
        // Extract numbers from strings for numeric sorting
        const aNum = parseInt(aValue.match(/\d+/) || [0]);
        const bNum = parseInt(bValue.match(/\d+/) || [0]);
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();

        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      }
    });
  };

  // Convert our countries to react-select format
  const countryOptions = useMemo(() => {
    // Ensure countries is an array before mapping
    if (!Array.isArray(countries)) {
      return [];
    }

    return countries.map(country => ({
      value: country._id,
      label: country.name,
      arabicName: country.arabicName,
      flag: country.flag,
      category: country.category
    }));
  }, [countries]);

  // Fetch countries from our API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        console.log('Fetching countries from:', `${import.meta.env.VITE_BACKEND_URL_V2}/camp/countries/list`);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/camp/countries/list`);
        console.log('Countries response:', response.data);
        setCountries(response.data.data || response.data);
        console.log('Countries set to:', response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Filter countries based on input
  const loadCountryOptions = (inputValue) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          countryOptions.filter((option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            option.arabicName.toLowerCase().includes(inputValue.toLowerCase())
          )
        );
      }, 100);
    });
  };

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
    }),
    singleValue: (provided) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    })
  };

  // Custom Option component for react-select
  const CustomOption = ({ data, ...props }) => (
    <div {...props.innerProps} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{data.label}</span>
      {data.arabicName && <span className="text-gray-500">({data.arabicName})</span>}
    </div>
  );

  // Custom SingleValue component for react-select
  const CustomSingleValue = ({ data }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{data.label}</span>
      {data.arabicName && <span className="text-gray-500">({data.arabicName})</span>}
    </div>
  );

  // Define the table columns
  const campColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === campData.length}
          onChange={(e) => handleSelectAll(e)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(e) => handleSelectRow(row._id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    {
      key: 'maktab',
      title: 'Maktab',
      render: (row) => {
        return row.maktab;
      }
    },
    {
      key: 'maktabMalayalam',
      title: 'Maktab (Malayalam)',
      render: (row) => {
        return row.maktabMalayalam;
      }
    },
    {
      key: 'maktabUrdu',
      title: 'Maktab (Urdu)',
      render: (row) => {
        return row.maktabUrdu;
      }
    },
    {
      key: 'zone',
      title: 'Zone',
      render: (row) => {
        return row.zone;
      }
    },
    {
      key: 'zoneMalayalam',
      title: 'Zone (Malayalam)',
      render: (row) => {
        return row.zoneMalayalam;
      }
    },
    {
      key: 'zoneUrdu',
      title: 'Zone (Urdu)',
      render: (row) => {
        return row.zoneUrdu;
      }
    },
    {
      key: 'country',
      title: 'Country',
      render: (row) => {
        if (row.otherCountry) {
          return <span>{row.otherCountry} (Other)</span>;
        }
        return row.country ? (
          <div className="flex items-center gap-2">
            <span>{row.country.name}</span>
            {row.country.arabicName && <span className="text-gray-500">({row.country.arabicName})</span>}
          </div>
        ) : 'N/A';
      }
    },
    {
      key: 'poll',
      title: 'Poll',
      render: (row) => {
        return row.poll;
      }
    },
    {
      key: 'pollMalayalam',
      title: 'Poll (Malayalam)',
      render: (row) => {
        return row.pollMalayalam;
      }
    },
    {
      key: 'pollUrdu',
      title: 'Poll (Urdu)',
      render: (row) => {
        return row.pollUrdu;
      }
    },
    {
      key: 'road',
      title: 'Road',
      render: (row) => {
        return row.road || 'N/A';
      }
    },
    {
      key: 'roadMalayalam',
      title: 'Road (Malayalam)',
      render: (row) => {
        return row.roadMalayalam;
      }
    },
    {
      key: 'roadUrdu',
      title: 'Road (Urdu)',
      render: (row) => {
        return row.roadUrdu;
      }
    },
    {
      key: 'tent',
      title: 'Tent',
      render: (row) => {
        return row.tent || 'N/A';
      }
    },
    {
      key: 'tentMalayalam',
      title: 'Tent (Malayalam)',
      render: (row) => {
        return row.tentMalayalam;
      }
    },
    {
      key: 'tentUrdu',
      title: 'Tent (Urdu)',
      render: (row) => {
        return row.tentUrdu;
      }
    },
    {
      key: 'location',
      title: 'Location',
      render: (row) => {
        const lat = row.location?.lat;
        const lng = row.location?.lng;
        if (lat === undefined && lng === undefined) return 'N/A';
        if ((lat === undefined || lat === '') && (lng !== undefined && lng !== '')) return `N/A, ${lng}`;
        if ((lng === undefined || lng === '') && (lat !== undefined && lat !== '')) return `${lat}, N/A`;
        return `${lat ?? 'N/A'}, ${lng ?? 'N/A'}`;
      }
    },
    {
      key: 'ref',
      title: 'Location Reference',
      render: (row) => {
        const locationName = row.ref?.title || locations.find(loc => loc._id === row.ref)?.name || 'N/A';
        return locationName;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(row)}
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
      )
    }
  ];

  // Fetch data from API using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/camp`);
        setCampData(response.data.data || response.data);
        console.log(response.data)
        setLoading(false);
      } catch (error) {
        console.error('Error fetching camp data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add useEffect to fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`);
        setLocations(response.data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Update filtered data to include sorting
  const filteredCampData = useMemo(() => {
    // Ensure campData is an array
    if (!Array.isArray(campData)) {
      return [];
    }

    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = campData;

    if (lowerCaseSearch) {
      filtered = campData.filter((item) => {
        const locationName = item.ref?.name || '';
        const countryName = item.country?.name || item.otherCountry || '';
        return (
          item.maktab?.toLowerCase().includes(lowerCaseSearch) ||
          item.zone?.toLowerCase().includes(lowerCaseSearch) ||
          countryName.toLowerCase().includes(lowerCaseSearch) ||
          item.poll?.toLowerCase().includes(lowerCaseSearch) ||
          locationName.toLowerCase().includes(lowerCaseSearch)
        );
      });
    }

    return sortData(filtered);
  }, [campData, searchTerm, sortConfig]);

  // Handle Edit
  const handleEditChange = (id, field, value) => {
    setCampData(campData.map(item => {
      if (item._id === id) {
        if (field === 'country') {
          if (value === 'others') {
            return { ...item, country: 'others', otherCountry: item.otherCountry || '' };
          }
          return { ...item, country: value, otherCountry: '' };
        }
        if (field === 'location') {
          return { ...item, location: value };
        }
        if (field === 'ref') {
          const selectedLocation = locations.find(loc => loc._id === value);
          return {
            ...item,
            ref: selectedLocation ? {
              _id: selectedLocation._id,
              title: selectedLocation.title
            } : value
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Handle Save Edit
  const handleSaveEdit = async (row) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      // Prepare the data for saving
      const dataToSave = {
        maktab: row.maktab || '',
        maktabMalayalam: row.maktabMalayalam || '',
        maktabUrdu: row.maktabUrdu || '',
        zone: row.zone || '',
        zoneMalayalam: row.zoneMalayalam || '',
        zoneUrdu: row.zoneUrdu || '',
        poll: row.poll || '',
        pollMalayalam: row.pollMalayalam || '',
        pollUrdu: row.pollUrdu || '',
        road: row.road || '',
        roadMalayalam: row.roadMalayalam || '',
        roadUrdu: row.roadUrdu || '',
        tent: row.tent || '',
        tentMalayalam: row.tentMalayalam || '',
        tentUrdu: row.tentUrdu || '',
        location: row.location || {},
        ref: row.ref?._id || row.ref,
        country: row.country === 'others' ? null : (row.country?._id || row.country || null),
        otherCountry: row.country === 'others' ? row.otherCountry : ''
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp/${row._id}`,
        dataToSave,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the campData with the populated response
      setCampData(campData.map(item =>
        item._id === row._id ? (response.data.data || response.data) : item
      ));

      setEditingId(null);
      setOriginalData(null);
    } catch (error) {
      console.error("Error updating camp data:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!id) {
      console.error('No ID provided for deletion');
      return;
    }
    setDeleteConfirm({ show: true, id });
  };

  // Add handleDeleteConfirm
  const handleDeleteConfirm = async () => {
    const ids = Array.isArray(deleteConfirm.id) ? deleteConfirm.id : [deleteConfirm.id];
    
    // Filter out any undefined or null IDs
    const validIds = ids.filter(id => id != null && id !== undefined);
    
    if (validIds.length === 0) {
      console.error('No valid IDs found for deletion');
      setDeleteConfirm({ show: false, id: null });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      // Delete all selected items
      await Promise.all(validIds.map(id =>
        axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/camp/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ));

      setCampData(campData.filter(item => !validIds.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
      setUploadSuccess(`Successfully deleted ${validIds.length} camp(s)`);
    } catch (error) {
      console.error('Error deleting camp data:', error);
      setUploadError(error.response?.data?.message || 'Error deleting camp(s)');
      setDeleteConfirm({ show: false, id: null });
    }
  };

  // Add handleDeleteCancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Camp
  const handleAddCamp = async () => {
    try {
      const token = localStorage.getItem("token"); // Ensure authentication

      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      // Prepare the data for submission
      const campData = {
        ...newCamp,
        country: newCamp.country === 'others' ? null : newCamp.country,
        otherCountry: newCamp.country === 'others' ? newCamp.otherCountry : ''
      };

      // Validate required fields
      if (!newCamp.ref) {
        setUploadError("Location Reference is required. Please select a location.");
        return;
      }

      console.log("Sending camp data:", campData);
      console.log("POST URL:", `${import.meta.env.VITE_BACKEND_URL_V2}/camp`);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp`,
        campData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in headers
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/camp`);
        setCampData(updatedResponse.data.data || updatedResponse.data);
        setNewCamp({
          maktab: '',
          maktabMalayalam: '',
          maktabUrdu: '',
          zone: '',
          zoneMalayalam: '',
          zoneUrdu: '',
          country: '',
          poll: '',
          pollMalayalam: '',
          pollUrdu: '',
          road: '',
          roadMalayalam: '',
          roadUrdu: '',
          tent: '',
          tentMalayalam: '',
          tentUrdu: '',
          location: { lat: '', lng: '' },
          ref: '',
          otherCountry: ''
        });
        setShowAddForm(false);
        setUploadError(null);
        setUploadSuccess("Camp added successfully!");
      }
    } catch (error) {
      console.error("Error adding camp data:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error adding camp";
      setUploadError(errorMessage);
      setUploadSuccess(null);
    }
  };
  // Modify the edit button click handler
  const handleEditClick = (row) => {
    // Make a deep copy of the row data to preserve the country object
    const rowCopy = {
      ...row,
      country: row.country ? row.country._id : ''  // Store the country ID for editing
    };
    setOriginalData(row); // Store original data
    setEditingId(row._id);
    // Update the campData with the prepared row data
    setCampData(campData.map(item =>
      item._id === row._id ? rowCopy : item
    ));
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    // Restore original data
    setCampData(campData.map(item =>
      item._id === editingId ? originalData : item
    ));
    setEditingId(null);
    setOriginalData(null);
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

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem("token");
      if (!token) {
        setUploadError('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          validateStatus: (status) => status >= 200 && status < 300 || status === 207
        }
      );

      if (response.status === 207 && response.data.failedRows && response.data.failedRows.length > 0) {
        setUploadError(
          `Some rows failed to upload:\n` +
          response.data.failedRows.map(r => `Row ${r.row}: ${r.error}`).join('\n')
        );
        setUploadSuccess(`Successfully uploaded ${response.data.count} camps (with some errors)`);
      } else {
        setUploadSuccess(`Successfully uploaded ${response.data.count} camps`);
        setUploadError(null);
      }

      // Refresh the data
      const updatedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/camp`);
      setCampData(updatedResponse.data.data || updatedResponse.data);
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error.response?.data?.message || 'Error processing file. Please try again.');
      setUploadSuccess(null);
    }
  };

  // Update download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          maktab: '', // Optional
          maktabMalayalam: '', // Optional
          maktabUrdu: '', // Optional
          location_name: 'Azizia',
          zone: 'Zone A (Optional)',
          zoneMalayalam: '', // Optional
          zoneUrdu: '', // Optional
          country: 'India',
          poll: 'Poll 1 (Optional)',
          pollMalayalam: '', // Optional
          pollUrdu: '', // Optional
          road: 'Road 1 (Optional)',
          roadMalayalam: '', // Optional
          roadUrdu: '', // Optional
          tent: 'Tent 1 (Optional)',
          tentMalayalam: '', // Optional
          tentUrdu: '', // Optional
          latitude: '21.4225',
          longitude: '39.8262'
        }
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);

      // Add headers with descriptions
      utils.sheet_add_aoa(ws, [[
        'maktab',
        'maktabMalayalam',
        'maktabUrdu',
        'location_name',
        'zone',
        'zoneMalayalam',
        'zoneUrdu',
        'country',
        'poll',
        'pollMalayalam',
        'pollUrdu',
        'road',
        'roadMalayalam',
        'roadUrdu',
        'tent',
        'tentMalayalam',
        'tentUrdu',
        'latitude',
        'longitude'
      ]], { origin: 'A1' });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: 'A2',
        skipHeader: true
      });

      // Add column widths
      ws['!cols'] = [
        { wch: 25 }, // maktab
        { wch: 25 }, // maktabMalayalam
        { wch: 25 }, // maktabUrdu
        { wch: 25 }, // location_name
        { wch: 20 }, // zone
        { wch: 20 }, // zoneMalayalam
        { wch: 20 }, // zoneUrdu
        { wch: 25 }, // country
        { wch: 20 }, // poll
        { wch: 20 }, // pollMalayalam
        { wch: 20 }, // pollUrdu
        { wch: 20 }, // road
        { wch: 20 }, // roadMalayalam
        { wch: 20 }, // roadUrdu
        { wch: 20 }, // tent
        { wch: 20 }, // tentMalayalam
        { wch: 20 }, // tentUrdu
        { wch: 20 }, // latitude
        { wch: 20 }  // longitude
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
      link.download = 'camp_upload_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating template:', error);
      setUploadError('Failed to download template. Please try again.');
    }
  };

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredCampData.map(row => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Add handleSelectRow function
  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Add handleBulkDelete function
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setDeleteConfirm({
      show: true,
      id: selectedRows,
      isBulk: true
    });
  };

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
            <h1 className="text-2xl font-bold">Camp Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredCampData.length} camps
            </div>
          </div>
          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600"
              >
                Delete Selected ({selectedRows.length})
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600"
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
              className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600"
            >
              Upload Excel
            </label>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600"
            >
              {showAddForm ? 'Cancel' : 'Add More'}
            </button>
          </div>
        </div>

        {/* Add error and success messages */}
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

        {/* New Building Form - Only shown when showAddForm is true */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Camp</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Maktab (Optional)</label>
              <input
                type="text"
                value={newCamp.maktab}
                onChange={(e) => setNewCamp({ ...newCamp, maktab: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Maktab (Malayalam)</label>
              <input
                type="text"
                value={newCamp.maktabMalayalam}
                onChange={(e) => setNewCamp({ ...newCamp, maktabMalayalam: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Maktab (Urdu)</label>
              <input
                type="text"
                value={newCamp.maktabUrdu}
                onChange={(e) => setNewCamp({ ...newCamp, maktabUrdu: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Zone</label>
              <input
                type="text"
                value={newCamp.zone}
                onChange={(e) => setNewCamp({ ...newCamp, zone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Zone (Malayalam)</label>
              <input
                type="text"
                value={newCamp.zoneMalayalam}
                onChange={(e) => setNewCamp({ ...newCamp, zoneMalayalam: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Zone (Urdu)</label>
              <input
                type="text"
                value={newCamp.zoneUrdu}
                onChange={(e) => setNewCamp({ ...newCamp, zoneUrdu: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Country</label>
              <select
                value={newCamp.country || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewCamp({
                    ...newCamp,
                    country: value,
                    otherCountry: value === 'others' ? newCamp.otherCountry : ''
                  });
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Country</option>
                <option value="others">Others</option>
                {Array.isArray(countries) && countries.map(country => (
                  <option key={country._id} value={country._id}>
                    {country.name} {country.arabicName ? `(${country.arabicName})` : ''}
                  </option>
                ))}
              </select>
              {(newCamp.country === 'others') && (
                <input
                  type="text"
                  value={newCamp.otherCountry || ''}
                  onChange={(e) => setNewCamp({ ...newCamp, otherCountry: e.target.value })}
                  placeholder="Enter other country name"
                  className="mt-2 block w-full border border-gray-300 rounded-md p-2"
                />
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll</label>
              <input
                type="text"
                value={newCamp.poll}
                onChange={(e) => setNewCamp({ ...newCamp, poll: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll (Malayalam)</label>
              <input
                type="text"
                value={newCamp.pollMalayalam}
                onChange={(e) => setNewCamp({ ...newCamp, pollMalayalam: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll (Urdu)</label>
              <input
                type="text"
                value={newCamp.pollUrdu}
                onChange={(e) => setNewCamp({ ...newCamp, pollUrdu: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Road</label>
              <input
                type="text"
                value={newCamp.road}
                onChange={(e) => setNewCamp({ ...newCamp, road: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Road (Malayalam)</label>
              <input
                type="text"
                value={newCamp.roadMalayalam}
                onChange={(e) => setNewCamp({ ...newCamp, roadMalayalam: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Road (Urdu)</label>
              <input
                type="text"
                value={newCamp.roadUrdu}
                onChange={(e) => setNewCamp({ ...newCamp, roadUrdu: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Tent</label>
              <input
                type="text"
                value={newCamp.tent}
                onChange={(e) => setNewCamp({ ...newCamp, tent: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Tent (Malayalam)</label>
              <input
                type="text"
                value={newCamp.tentMalayalam}
                onChange={(e) => setNewCamp({ ...newCamp, tentMalayalam: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Tent (Urdu)</label>
              <input
                type="text"
                value={newCamp.tentUrdu}
                onChange={(e) => setNewCamp({ ...newCamp, tentUrdu: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location</label>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">Latitude</label>
                  <input
                    type="number"
                    value={newCamp.location.lat}
                    onChange={(e) => setNewCamp({
                      ...newCamp,
                      location: { ...newCamp.location, lat: e.target.value }
                    })}
                    placeholder="Enter latitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">Longitude</label>
                  <input
                    type="number"
                    value={newCamp.location.lng}
                    onChange={(e) => setNewCamp({
                      ...newCamp,
                      location: { ...newCamp.location, lng: e.target.value }
                    })}
                    placeholder="Enter longitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location Reference</label>
              <select
                value={newCamp.ref}
                onChange={(e) => setNewCamp({ ...newCamp, ref: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location._id} value={location._id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddCamp}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Camp
            </button>
          </div>
        )}

        {/* Update Search Bar to include sort */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search camps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              />
              <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={20} className="text-gray-400" />
              <select
                onChange={handleSortChange}
                value={`${sortConfig.field}-${sortConfig.type}-${sortConfig.direction}`}
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredCampData.length === 0 ? (
          <p className="text-center">No items found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {campColumns.map((column) => (
                    <th key={column.key} className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr className={`${editingId === row._id ? 'bg-blue-50' : ''}`}>
                      {campColumns.map((column) => (
                        <td key={`${row._id}-${column.key}`} className="px-4 py-1 whitespace-nowrap">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={campColumns.length} className="p-0">
                          <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-lg font-semibold text-gray-900">Edit Camp</h3>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleSaveEdit(row)}
                                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Maktab Information */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Maktab Information</h4>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maktab
                                  </label>
                                  <input
                                    type="text"
                                    value={row.maktab || ""}
                                    onChange={(e) => handleEditChange(row._id, 'maktab', e.target.value)}
                                    placeholder="Maktab name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maktab (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.maktabMalayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'maktabMalayalam', e.target.value)}
                                    placeholder="മക്തബ്"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maktab (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.maktabUrdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'maktabUrdu', e.target.value)}
                                    placeholder="مکتب"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>

                              {/* Zone Information */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Zone Information</h4>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zone
                                  </label>
                                  <input
                                    type="text"
                                    value={row.zone || ""}
                                    onChange={(e) => handleEditChange(row._id, 'zone', e.target.value)}
                                    placeholder="Zone name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zone (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.zoneMalayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'zoneMalayalam', e.target.value)}
                                    placeholder="മേഖല"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zone (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.zoneUrdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'zoneUrdu', e.target.value)}
                                    placeholder="زون"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Country Information */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-700 mb-4">Country Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Country
                                  </label>
                                  <select
                                    value={row.country?._id || row.country || ""}
                                    onChange={(e) => handleEditChange(row._id, 'country', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select Country</option>
                                    <option value="others">Others</option>
                                    {Array.isArray(countries) && countries.map(country => (
                                      <option key={country._id} value={country._id}>
                                        {country.name} {country.arabicName ? `(${country.arabicName})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {(row.country === 'others' || row.otherCountry) && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Other Country Name
                                    </label>
                                    <input
                                      type="text"
                                      value={row.otherCountry || ""}
                                      onChange={(e) => handleEditChange(row._id, 'otherCountry', e.target.value)}
                                      placeholder="Enter other country name"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Poll Information */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-700 mb-4">Poll Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Poll
                                  </label>
                                  <input
                                    type="text"
                                    value={row.poll || ""}
                                    onChange={(e) => handleEditChange(row._id, 'poll', e.target.value)}
                                    placeholder="Poll name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Poll (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.pollMalayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'pollMalayalam', e.target.value)}
                                    placeholder="പോൾ"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Poll (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.pollUrdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'pollUrdu', e.target.value)}
                                    placeholder="پول"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Road Information */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-700 mb-4">Road Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Road
                                  </label>
                                  <input
                                    type="text"
                                    value={row.road || ""}
                                    onChange={(e) => handleEditChange(row._id, 'road', e.target.value)}
                                    placeholder="Road name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Road (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.roadMalayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'roadMalayalam', e.target.value)}
                                    placeholder="റോഡ്"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Road (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.roadUrdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'roadUrdu', e.target.value)}
                                    placeholder="سڑک"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Tent Information */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-700 mb-4">Tent Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tent
                                  </label>
                                  <input
                                    type="text"
                                    value={row.tent || ""}
                                    onChange={(e) => handleEditChange(row._id, 'tent', e.target.value)}
                                    placeholder="Tent name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tent (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.tentMalayalam || ""}
                                    onChange={(e) => handleEditChange(row._id, 'tentMalayalam', e.target.value)}
                                    placeholder="കൂടാരം"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tent (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.tentUrdu || ""}
                                    onChange={(e) => handleEditChange(row._id, 'tentUrdu', e.target.value)}
                                    placeholder="خیمہ"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Location Information */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-700 mb-4">Location Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Latitude
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={row.location?.lat || ""}
                                    onChange={(e) => handleEditChange(row._id, 'location', { ...row.location, lat: e.target.value })}
                                    placeholder="21.4225"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Longitude
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={row.location?.lng || ""}
                                    onChange={(e) => handleEditChange(row._id, 'location', { ...row.location, lng: e.target.value })}
                                    placeholder="39.8262"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location Reference
                                  </label>
                                  <select
                                    value={row.ref?._id || row.ref || ""}
                                    onChange={(e) => handleEditChange(row._id, 'ref', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select Location</option>
                                    {Array.isArray(locations) && locations.map(location => (
                                      <option key={location._id} value={location._id}>
                                        {location.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id)
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected camps? This action cannot be undone.`
                  : 'Are you sure you want to delete this camp? This action cannot be undone.'}
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
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camp;

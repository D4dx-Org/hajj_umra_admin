import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Download,
  Upload as UploadIcon,
  ArrowUpDown,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";
import Select from "react-select";
import { message } from "antd";

const countryCategories = [
  { value: "South Eastern Asia", label: "South Eastern Asia" },
  {
    value: "Turkey and Muslims of Europe and America",
    label: "Turkey and Muslims of Europe and America",
  },
  { value: "Arabic Countries", label: "Arabic Countries" },
  { value: "Iran", label: "Iran" },
  { value: "Non-Arab African Countries", label: "Non-Arab African Countries" },
  { value: "Southern Asia", label: "Southern Asia" },
];

const UmrahCountry = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newCountry, setNewCountry] = useState({
    name: "",
    arabicName: "",
    flag: "",
    category: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [sortConfig, setSortConfig] = useState({
    field: "name",
    direction: "asc",
    type: "alpha",
  });

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#4A90E2"
        : state.isFocused
        ? "#E3F2FD"
        : "white",
      color: state.isSelected ? "white" : "#333",
      padding: "8px 12px",
    }),
    control: (provided) => ({
      ...provided,
      borderColor: "#E5E7EB",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#4A90E2",
      },
    }),
  };

  // Handle image file selection and convert to base64
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setNewCountry({ ...newCountry, flag: base64String });
      setSelectedFile(file);
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file");
      setUploadingImage(false);
      setSelectedFile(null);
    };
    reader.readAsDataURL(file);
  };

  // Define the table columns
  const countryColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === countryData.length && countryData.length > 0
          }
          onChange={(event) => handleSelectAll(event)}
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
      key: "name",
      title: "Name",
      render: (row) => <span className="truncate" title={row.name}>{row.name}</span>,
    },
    {
      key: "arabicName",
      title: "Arabic Name",
      render: (row) => <span className="truncate" title={row.arabicName || "N/A"}>{row.arabicName || "N/A"}</span>,
    },
    {
      key: "flag",
      title: "Flag",
      render: (row) => {
        return row.flag ? (
          <img
            src={row.flag}
            alt={row.name}
            className="w-8 h-6 object-cover rounded"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAzMiAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxMkwxMiA4VjE2TDE2IDEyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              e.target.title = 'Image failed to load';
            }}
          />
        ) : (
          <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500">N/A</span>
          </div>
        );
      },
    },
    {
      key: "category",
      title: "Category",
      render: (row) => <span className="truncate" title={row.category || "N/A"}>{row.category || "N/A"}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Sorting options
  const sortOptions = [
    {
      value: "name-alpha-asc",
      label: "Name (A-Z)",
      field: "name",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "name-alpha-desc",
      label: "Name (Z-A)",
      field: "name",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "arabicName-alpha-asc",
      label: "Arabic Name (A-Z)",
      field: "arabicName",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "arabicName-alpha-desc",
      label: "Arabic Name (Z-A)",
      field: "arabicName",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "category-alpha-asc",
      label: "Category (A-Z)",
      field: "category",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "category-alpha-desc",
      label: "Category (Z-A)",
      field: "category",
      direction: "desc",
      type: "alpha",
    },
  ];

  // Fetch countries data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah`
        );
        setCountryData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching umrah country data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setCountryData(
      countryData.map((item) => {
        if (item._id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Handle Save Edit
  const handleSaveEdit = async (row) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCountryData(
        countryData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah country data:", error);
    }
  };

  // Handle Delete
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
        console.error("No token found. Please log in again.");
        return;
      }

      await Promise.all(
        ids.map((id) =>
          axios.delete(
            `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setCountryData(countryData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting umrah country data:", error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Country
  const handleAddCountry = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah`,
        newCountry,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah`
        );
        setCountryData(updatedResponse.data);
        setNewCountry({
          name: "",
          arabicName: "",
          flag: "",
          category: "",
        });
        setSelectedFile(null);
        setShowAddForm(false);
        setUploadError(null);
        setUploadSuccess("Country added successfully!");
      }
    } catch (error) {
      console.error("Error adding umrah country data:", error);
      setUploadError("Failed to add country. Please try again.");
    }
  };

  // Handle sort change
  const handleSortChange = (event) => {
    const selectedOption = sortOptions.find(
      (option) => option.value === event.target.value
    );
    if (selectedOption) {
      setSortConfig({
        field: selectedOption.field,
        direction: selectedOption.direction,
        type: selectedOption.type,
      });
    }
  };

  // Sort function
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.field] || "";
      let bValue = b[sortConfig.field] || "";

      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Filtered and sorted data
  const filteredCountryData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = countryData;

    if (lowerCaseSearch) {
      filtered = countryData.filter((item) => {
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.arabicName &&
            item.arabicName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.category &&
            item.category.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }

    return sortData(filtered);
  }, [countryData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setCountryData(
      countryData.map((item) => (item._id === editingId ? originalData : item))
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          name: "Sample Country",
          arabicName: "اسم البلد",
          flag: "https://example.com/flag.png",
          category: "Arabic Countries",
        },
      ];

      const ws = utils.json_to_sheet([]);

      utils.sheet_add_aoa(ws, [["name", "arabicName", "flag", "category"]], {
        origin: "A1",
      });

      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      ws["!cols"] = [
        { wch: 25 }, // name
        { wch: 25 }, // arabicName
        { wch: 30 }, // flag
        { wch: 30 }, // category
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "umrah_country_upload_template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
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

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        setUploadError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(`Successfully uploaded countries`);
      setUploadError(null);

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah`
      );
      setCountryData(updatedResponse.data);

      // Reset the file input
      event.target.value = "";
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError(
        error.response?.data?.message ||
          "Error processing file. Please try again."
      );
      setUploadSuccess(null);
    }
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredCountryData.map((row) => row._id));
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

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setDeleteConfirm({
      show: true,
      id: selectedRows,
      isBulk: true,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Umrah Country Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredCountryData.length} countries
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
            {/* <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600"
            >
              <Download size={20} />
              Download Template
            </button> */}
            {/* <input
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
            </label> */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600"
            >
              {showAddForm ? "Cancel" : "Add Country"}
            </button>
          </div>
        </div>

        {/* Error and success messages */}
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

        {/* New Country Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah Country</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newCountry.name}
                  onChange={(e) =>
                    setNewCountry({ ...newCountry, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Arabic Name</label>
                <input
                  type="text"
                  value={newCountry.arabicName}
                  onChange={(e) =>
                    setNewCountry({ ...newCountry, arabicName: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Flag</label>
                <div className="mt-1 space-y-2">
                  {/* Image Upload */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="flag-upload"
                    />
                    <label
                      htmlFor="flag-upload"
                      className="bg-blue-500 text-white px-3 py-2 rounded-md cursor-pointer hover:bg-blue-600 text-sm"
                    >
                      Choose Image
                    </label>
                    {selectedFile && (
                      <span className="text-sm text-green-600">
                        ✓ {selectedFile.name}
                      </span>
                    )}
                    {uploadingImage && (
                      <span className="text-sm text-blue-600">
                        Uploading...
                      </span>
                    )}
                  </div>
                  
                  {/* OR separator */}
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">OR</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  {/* URL Input */}
                  <input
                    type="url"
                    value={newCountry.flag}
                    onChange={(e) => {
                      setNewCountry({ ...newCountry, flag: e.target.value });
                      setSelectedFile(null); // Clear file selection when URL is entered
                    }}
                    className="block w-full border border-gray-300 rounded-md p-2"
                    placeholder="https://example.com/flag.png"
                  />
                  
                  {/* Preview */}
                  {newCountry.flag && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">Preview:</label>
                      <img
                        src={newCountry.flag}
                        alt="Flag preview"
                        className="w-12 h-8 object-cover rounded border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Category</label>
                <Select
                  value={countryCategories.find(
                    (cat) => cat.value === newCountry.category
                  )}
                  onChange={(selected) =>
                    setNewCountry({ ...newCountry, category: selected.value })
                  }
                  options={countryCategories}
                  styles={customStyles}
                  className="mt-1"
                  isSearchable
                  placeholder="Select category..."
                />
              </div>
            </div>
            <button
              onClick={handleAddCountry}
              disabled={!newCountry.name || uploadingImage}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadingImage && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {uploadingImage ? "Uploading..." : "Add Country"}
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              />
              <Search
                size={20}
                className="absolute left-3 top-3.5 text-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={20} className="text-gray-400" />
              <select
                onChange={handleSortChange}
                value={`${sortConfig.field}-${sortConfig.type}-${sortConfig.direction}`}
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  {countryColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === 'select' ? 'w-12' :
                        column.key === 'name' ? 'w-24' :
                        column.key === 'arabicName' ? 'w-24' :
                        column.key === 'flag' ? 'w-16' :
                        column.key === 'category' ? 'w-32' :
                        column.key === 'actions' ? 'w-24' : ''
                      }`}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCountryData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={countryColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No countries found
                    </td>
                  </tr>
                ) : (
                  filteredCountryData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr className={`hover:bg-gray-50 ${editingId === row._id ? 'bg-blue-50' : ''}`}>
                        {countryColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-2 py-2 text-sm text-gray-900 ${
                              column.key === 'name' ? 'max-w-24 truncate' :
                              column.key === 'arabicName' ? 'max-w-24 truncate' :
                              column.key === 'flag' ? 'whitespace-nowrap' :
                              column.key === 'category' ? 'max-w-32 truncate' :
                              column.key === 'actions' ? 'whitespace-nowrap' : 'whitespace-nowrap'
                            }`}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                      {editingId === row._id && (
                        <tr>
                          <td colSpan={countryColumns.length} className="p-4">
                            <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                              <h2 className="text-lg font-bold mb-4">Edit Country</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">Name *</label>
                                  <input
                                    type="text"
                                    value={row.name || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "name", e.target.value)
                                    }
                                    placeholder="Country name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Arabic Name</label>
                                  <input
                                    type="text"
                                    value={row.arabicName || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "arabicName", e.target.value)
                                    }
                                    placeholder="اسم البلد"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Flag URL</label>
                                  <input
                                    type="url"
                                    value={row.flag || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "flag", e.target.value)
                                    }
                                    placeholder="https://example.com/flag.png"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Category</label>
                                  <Select
                                    value={countryCategories.find(
                                      (cat) => cat.value === row.category
                                    )}
                                    onChange={(selected) =>
                                      handleEditChange(row._id, "category", selected.value)
                                    }
                                    options={countryCategories}
                                    styles={customStyles}
                                    className="mt-1 block w-full"
                                    isSearchable
                                    placeholder="Select category..."
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleSaveEdit(row)}
                                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <h3 className="text-lg font-semibold">Confirm Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id)
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected countries?`
                  : "Are you sure you want to delete this country?"}{" "}
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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

export default UmrahCountry;

import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, Download, ArrowUpDown } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";
import Select from "react-select";
import ambulanceCategories from "../../../data/ambulanceCategories.json";

const UmrahAmbulance = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newAmbulance, setNewAmbulance] = useState({
    category: "",
    categoryMalayalam: "",
    categoryUrdu: "",
    center: "",
    centerMalayalam: "",
    centerUrdu: "",
    poll: "",
    pollMalayalam: "",
    pollUrdu: "",
    location: { lat: "", lng: "" },
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [sortConfig, setSortConfig] = useState({
    field: "category",
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

  // Define the table columns
  const ambulanceColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === ambulanceData.length &&
            ambulanceData.length > 0
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
      key: "category",
      title: "Category",
      render: (row) => {
        const category = ambulanceCategories.categories.find(
          (cat) => cat.value === row.category
        );
        return (
          <div className="space-y-1">
            <div>{category ? category.label : row.category}</div>
            {row.categoryMalayalam && (
              <div className="text-xs text-gray-600">ML: {row.categoryMalayalam}</div>
            )}
            {row.categoryUrdu && (
              <div className="text-xs text-gray-600">UR: {row.categoryUrdu}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "center",
      title: "Center",
      render: (row) => {
        return (
          <div className="space-y-1">
            <div>{row.center}</div>
            {row.centerMalayalam && (
              <div className="text-xs text-gray-600">ML: {row.centerMalayalam}</div>
            )}
            {row.centerUrdu && (
              <div className="text-xs text-gray-600">UR: {row.centerUrdu}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "poll",
      title: "Poll",
      render: (row) => {
        return (
          <div className="space-y-1">
            <div>{row.poll}</div>
            {row.pollMalayalam && (
              <div className="text-xs text-gray-600">ML: {row.pollMalayalam}</div>
            )}
            {row.pollUrdu && (
              <div className="text-xs text-gray-600">UR: {row.pollUrdu}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "location",
      title: "Location",
      render: (row) => {
        return row.location
          ? `${row.location.lat}, ${row.location.lng}`
          : "N/A";
      },
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
    {
      value: "center-alpha-asc",
      label: "Center (A-Z)",
      field: "center",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "center-alpha-desc",
      label: "Center (Z-A)",
      field: "center",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "poll-alpha-asc",
      label: "Poll (A-Z)",
      field: "poll",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "poll-alpha-desc",
      label: "Poll (Z-A)",
      field: "poll",
      direction: "desc",
      type: "alpha",
    },
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah`
        );
        setAmbulanceData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching umrah ambulance data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setAmbulanceData(
      ambulanceData.map((item) => {
        if (item._id === id) {
          if (field === "location") {
            return { ...item, location: value };
          }
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAmbulanceData(
        ambulanceData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah ambulance data:", error);
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setAmbulanceData(ambulanceData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting umrah ambulance data:", error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Ambulance
  const handleAddAmbulance = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah`,
        newAmbulance,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah`
        );
        setAmbulanceData(updatedResponse.data);
        setNewAmbulance({
          category: "",
          categoryMalayalam: "",
          categoryUrdu: "",
          center: "",
          centerMalayalam: "",
          centerUrdu: "",
          poll: "",
          pollMalayalam: "",
          pollUrdu: "",
          location: { lat: "", lng: "" },
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah ambulance data:", error);
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
  const filteredAmbulanceData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = ambulanceData;

    if (lowerCaseSearch) {
      filtered = ambulanceData.filter((item) => {
        return (
          (item.category &&
            item.category.toLowerCase().includes(lowerCaseSearch)) ||
          (item.categoryMalayalam &&
            item.categoryMalayalam.toLowerCase().includes(lowerCaseSearch)) ||
          (item.categoryUrdu &&
            item.categoryUrdu.toLowerCase().includes(lowerCaseSearch)) ||
          (item.center &&
            item.center.toLowerCase().includes(lowerCaseSearch)) ||
          (item.centerMalayalam &&
            item.centerMalayalam.toLowerCase().includes(lowerCaseSearch)) ||
          (item.centerUrdu &&
            item.centerUrdu.toLowerCase().includes(lowerCaseSearch)) ||
          (item.poll && item.poll.toLowerCase().includes(lowerCaseSearch)) ||
          (item.pollMalayalam &&
            item.pollMalayalam.toLowerCase().includes(lowerCaseSearch)) ||
          (item.pollUrdu &&
            item.pollUrdu.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }

    return sortData(filtered);
  }, [ambulanceData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setAmbulanceData(
      ambulanceData.map((item) =>
        item._id === editingId ? originalData : item
      )
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          category: "Type A",
          category_malayalam: "ടൈപ്പ് എ",
          category_urdu: "قسم اے",
          center: "Sample Center",
          center_malayalam: "സാമ്പിൾ സെന്റർ",
          center_urdu: "نمونہ مرکز",
          poll: "Sample Poll",
          poll_malayalam: "സാമ്പിൾ പോൾ",
          poll_urdu: "نمونہ پول",
          latitude: "21.4225",
          longitude: "39.8262",
        },
      ];

      const ws = utils.json_to_sheet([]);

      utils.sheet_add_aoa(
        ws,
        [["category", "category_malayalam", "category_urdu", "center", "center_malayalam", "center_urdu", "poll", "poll_malayalam", "poll_urdu", "latitude", "longitude"]],
        { origin: "A1" }
      );

      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      ws["!cols"] = [
        { wch: 20 }, // category
        { wch: 20 }, // category_malayalam
        { wch: 20 }, // category_urdu
        { wch: 20 }, // center
        { wch: 20 }, // center_malayalam
        { wch: 20 }, // center_urdu
        { wch: 20 }, // poll
        { wch: 20 }, // poll_malayalam
        { wch: 20 }, // poll_urdu
        { wch: 20 }, // latitude
        { wch: 20 }, // longitude
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "umrah_ambulance_upload_template.xlsx";
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(
        `Successfully uploaded ${response.data.insertedCount} ambulances`
      );
      if (response.data.invalidRows && response.data.invalidRows.length > 0) {
        setUploadError(
          `Some rows had issues: ${response.data.invalidRows.join(", ")}`
        );
      } else {
        setUploadError(null);
      }

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/ambulance-umrah`
      );
      setAmbulanceData(updatedResponse.data);

      // Reset the file input
      event.target.value = "";
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError(
        error.response?.data?.error ||
          "Error processing file. Please try again."
      );
      setUploadSuccess(null);
    }
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredAmbulanceData.map((row) => row._id));
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
            <h1 className="text-2xl font-bold">Umrah Ambulance Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredAmbulanceData.length} ambulances
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
              {showAddForm ? "Cancel" : "Add Ambulance"}
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

        {/* New Ambulance Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah Ambulance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Fields */}
              <div className="mb-4">
                <label className="block text-sm font-medium">Category *</label>
                <Select
                  value={ambulanceCategories.categories.find(
                    (cat) => cat.value === newAmbulance.category
                  )}
                  onChange={(selected) =>
                    setNewAmbulance({
                      ...newAmbulance,
                      category: selected.value,
                    })
                  }
                  options={ambulanceCategories.categories}
                  styles={customStyles}
                  className="mt-1"
                  isSearchable
                  placeholder="Select category..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Category (Malayalam)</label>
                <input
                  type="text"
                  value={newAmbulance.categoryMalayalam}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, categoryMalayalam: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Malayalam translation"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Category (Urdu)</label>
                <input
                  type="text"
                  value={newAmbulance.categoryUrdu}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, categoryUrdu: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Urdu translation"
                />
              </div>

              {/* Center Fields */}
              <div className="mb-4">
                <label className="block text-sm font-medium">Center *</label>
                <input
                  type="text"
                  value={newAmbulance.center}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, center: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Center (Malayalam)</label>
                <input
                  type="text"
                  value={newAmbulance.centerMalayalam}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, centerMalayalam: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Malayalam translation"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Center (Urdu)</label>
                <input
                  type="text"
                  value={newAmbulance.centerUrdu}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, centerUrdu: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Urdu translation"
                />
              </div>

              {/* Poll Fields */}
              <div className="mb-4">
                <label className="block text-sm font-medium">Poll *</label>
                <input
                  type="text"
                  value={newAmbulance.poll}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, poll: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Poll (Malayalam)</label>
                <input
                  type="text"
                  value={newAmbulance.pollMalayalam}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, pollMalayalam: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Malayalam translation"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Poll (Urdu)</label>
                <input
                  type="text"
                  value={newAmbulance.pollUrdu}
                  onChange={(e) =>
                    setNewAmbulance({ ...newAmbulance, pollUrdu: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Urdu translation"
                />
              </div>

              {/* Location Fields */}
              <div className="mb-4 md:col-span-3">
                <label className="block text-sm font-medium">
                  Location (Optional)
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={newAmbulance.location.lat}
                    onChange={(e) =>
                      setNewAmbulance({
                        ...newAmbulance,
                        location: {
                          ...newAmbulance.location,
                          lat: e.target.value,
                        },
                      })
                    }
                    placeholder="Latitude"
                    className="block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    value={newAmbulance.location.lng}
                    onChange={(e) =>
                      setNewAmbulance({
                        ...newAmbulance,
                        location: {
                          ...newAmbulance.location,
                          lng: e.target.value,
                        },
                      })
                    }
                    placeholder="Longitude"
                    className="block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAddAmbulance}
              disabled={
                !newAmbulance.category ||
                !newAmbulance.center ||
                !newAmbulance.poll
              }
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Ambulance
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search ambulances..."
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
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {ambulanceColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAmbulanceData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={ambulanceColumns.length}
                      className="px-4 py-1 text-center text-gray-500"
                    >
                      No ambulances found
                    </td>
                  </tr>
                ) : (
                  filteredAmbulanceData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr className={`hover:bg-gray-50 ${editingId === row._id ? 'bg-blue-50' : ''}`}>
                        {ambulanceColumns.map((column) => (
                          <td
                            key={column.key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                      {editingId === row._id && (
                        <tr>
                          <td colSpan={ambulanceColumns.length} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Ambulance</h3>
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
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Category Fields */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Category Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Category *
                                    </label>
                                    <Select
                                      value={ambulanceCategories.categories.find(
                                        (cat) => cat.value === row.category
                                      )}
                                      onChange={(selected) =>
                                        handleEditChange(row._id, "category", selected.value)
                                      }
                                      options={ambulanceCategories.categories}
                                      styles={customStyles}
                                      className="w-full"
                                      isSearchable
                                      placeholder="Select category..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Category (Malayalam)
                                    </label>
                                    <input
                                      type="text"
                                      value={row.categoryMalayalam || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "categoryMalayalam", e.target.value)
                                      }
                                      placeholder="Malayalam translation"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Category (Urdu)
                                    </label>
                                    <input
                                      type="text"
                                      value={row.categoryUrdu || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "categoryUrdu", e.target.value)
                                      }
                                      placeholder="Urdu translation"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Center Fields */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Center Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Center *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.center || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "center", e.target.value)
                                      }
                                      placeholder="Center name"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Center (Malayalam)
                                    </label>
                                    <input
                                      type="text"
                                      value={row.centerMalayalam || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "centerMalayalam", e.target.value)
                                      }
                                      placeholder="Malayalam translation"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Center (Urdu)
                                    </label>
                                    <input
                                      type="text"
                                      value={row.centerUrdu || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "centerUrdu", e.target.value)
                                      }
                                      placeholder="Urdu translation"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Poll and Location Fields */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Additional Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Poll *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.poll || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "poll", e.target.value)
                                      }
                                      placeholder="Poll information"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Poll (Malayalam)
                                    </label>
                                    <input
                                      type="text"
                                      value={row.pollMalayalam || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "pollMalayalam", e.target.value)
                                      }
                                      placeholder="Malayalam translation"
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
                                      onChange={(e) =>
                                        handleEditChange(row._id, "pollUrdu", e.target.value)
                                      }
                                      placeholder="Urdu translation"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Location Fields - Full Width */}
                              <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-4">Location Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Latitude
                                    </label>
                                    <input
                                      type="number"
                                      value={row.location?.lat || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "location", {
                                          ...row.location,
                                          lat: e.target.value,
                                        })
                                      }
                                      placeholder="Enter latitude"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Longitude
                                    </label>
                                    <input
                                      type="number"
                                      value={row.location?.lng || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "location", {
                                          ...row.location,
                                          lng: e.target.value,
                                        })
                                      }
                                      placeholder="Enter longitude"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected ambulances?`
                  : "Are you sure you want to delete this ambulance?"}{" "}
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

export default UmrahAmbulance;

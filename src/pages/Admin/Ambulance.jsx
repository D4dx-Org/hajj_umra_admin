import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Download,
  ArrowUpDown,
  Edit,
  Trash2,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";
import Select from "react-select";
import ambulanceCategories from "../../data/ambulanceCategories.json";

const Ambulance = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // Track which row is being edited
  const [showAddForm, setShowAddForm] = useState(false); // Control add form visibility
  const [locations, setLocations] = useState([]); // Add locations state
  const [selectedRows, setSelectedRows] = useState([]);
  const [newAmbulance, setNewAmbulance] = useState({
    category: "",
    center: "",
    poll: "",
    location: { lat: "", lng: "" },
    locationRef: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [viewModal, setViewModal] = useState({ show: false, data: null });
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

  // Define the table columns with editable configuration
  const ambulanceColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === ambulanceData.length}
          onChange={(event) => handleSelectAll(event)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(event) => handleSelectRow(row._id)}
          onClick={(e) => e.stopPropagation()}
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
        const categoryText = category ? category.label : row.category;
        return (
          <span className="truncate" title={categoryText}>
            {categoryText}
          </span>
        );
      },
    },
    {
      key: "center",
      title: "Center",
      render: (row) => (
        <span className="truncate" title={row.center || "N/A"}>
          {row.center || "N/A"}
        </span>
      ),
    },
    {
      key: "poll",
      title: "Poll",
      render: (row) => (
        <span className="truncate" title={row.poll || "N/A"}>
          {row.poll || "N/A"}
        </span>
      ),
    },
    {
      key: "location",
      title: "Location",
      render: (row) => {
        const locationText = row.location
          ? `${row.location.lat}, ${row.location.lng}`
          : "N/A";
        return (
          <span className="truncate" title={locationText}>
            {locationText}
          </span>
        );
      },
    },
    {
      key: "locationRef",
      title: "Location Reference",
      render: (row) => {
        const locationName = row.locationRef?.name || "N/A";
        return (
          <span className="truncate" title={locationName}>
            {locationName}
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
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Add sorting options
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
      value: "name-numeric-asc",
      label: "Name (1-9)",
      field: "name",
      direction: "asc",
      type: "numeric",
    },
    {
      value: "name-numeric-desc",
      label: "Name (9-1)",
      field: "name",
      direction: "desc",
      type: "numeric",
    },
    {
      value: "locationRef-alpha-asc",
      label: "Location (A-Z)",
      field: "locationRef",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "locationRef-alpha-desc",
      label: "Location (Z-A)",
      field: "locationRef",
      direction: "desc",
      type: "alpha",
    },
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/ambulance`
        );
        console.log("Fetched ambulance data:", response.data); // Add logging
        setAmbulanceData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching ambulance data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add fetchLocations function
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/location`
        );
        setLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setAmbulanceData(
      ambulanceData.map((item) => {
        if (item._id === id) {
          if (field === "location") {
            return { ...item, location: value };
          }
          if (field === "locationRef") {
            const selectedLocation = locations.find(
              (location) => location._id === value
            );
            return {
              ...item,
              locationRef: selectedLocation
                ? {
                    _id: selectedLocation._id,
                    name: selectedLocation.name,
                  }
                : value,
            };
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

      console.log("Sending data:", row); // Add logging

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/ambulance/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response data:", response.data); // Add logging

      setAmbulanceData(
        ambulanceData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating ambulance data:", error);
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

      // Delete all selected items
      await Promise.all(
        ids.map((id) =>
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/ambulance/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setAmbulanceData(ambulanceData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting ambulance data:", error);
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

      console.log("Sending new ambulance data:", newAmbulance); // Add logging

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ambulance`,
        newAmbulance,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response data:", response.data); // Add logging

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/ambulance`
        );
        setAmbulanceData(updatedResponse.data);
        setNewAmbulance({
          category: "",
          center: "",
          poll: "",
          location: { lat: "", lng: "" },
          locationRef: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding ambulance data:", error);
    }
  };

  // Add handle sort change
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

  // Add sort function
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue =
        sortConfig.field === "locationRef"
          ? a[sortConfig.field]?.name || ""
          : a[sortConfig.field] || "";
      let bValue =
        sortConfig.field === "locationRef"
          ? b[sortConfig.field]?.name || ""
          : b[sortConfig.field] || "";

      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Update filtered data to include sorting
  const filteredAmbulanceData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = ambulanceData;

    if (lowerCaseSearch) {
      filtered = ambulanceData.filter((item) => {
        const locationName = item.locationRef?.name || "";
        return (
          (item.category &&
            item.category.toLowerCase().includes(lowerCaseSearch)) ||
          (item.center &&
            item.center.toLowerCase().includes(lowerCaseSearch)) ||
          (item.poll && item.poll.toLowerCase().includes(lowerCaseSearch)) ||
          locationName.toLowerCase().includes(lowerCaseSearch)
        );
      });
    }

    return sortData(filtered);
  }, [ambulanceData, searchTerm, sortConfig]);

  // Handle view button click
  const handleViewClick = (row) => {
    setViewModal({ show: true, data: row });
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModal({ show: false, data: null });
  };

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row); // Store original data
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    // Restore original data
    setAmbulanceData(
      ambulanceData.map((item) =>
        item._id === editingId ? originalData : item
      )
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Update download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          name: "Sample Ambulance (Required)",
          location_name: "Azizia",
          category: "Type A",
          center: "Sample Center (Optional)",
          poll: "Sample Poll (Optional)",
          latitude: "21.4225",
          longitude: "39.8262",
        },
      ];

      const ws = utils.json_to_sheet([]);

      // Add headers with required/optional indicators
      utils.sheet_add_aoa(
        ws,
        [
          [
            "name",
            "location_name",
            "category",
            "center",
            "poll",
            "latitude",
            "longitude",
          ],
        ],
        { origin: "A1" }
      );

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      // Set column widths
      ws["!cols"] = [
        { wch: 25 }, // name
        { wch: 30 }, // location_name
        { wch: 20 }, // category
        { wch: 20 }, // center
        { wch: 20 }, // poll
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
      link.download = "ambulance_upload_template.xlsx";
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

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = read(e.target.result, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = utils.sheet_to_json(worksheet);

          if (data.length === 0) {
            setUploadError("The Excel file is empty. Please add some data.");
            return;
          }

          // Check the first row to understand the column structure
          const firstRow = data[0];
          const hasRequiredColumns =
            "name" in firstRow && "location_name" in firstRow;

          if (!hasRequiredColumns) {
            setUploadError(
              "Excel file must have required columns: name and location_name"
            );
            console.log(
              "Required columns missing. Found columns:",
              Object.keys(firstRow)
            );
            return;
          }

          // Validate each row
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            if (!row.name || !row.location_name) {
              setUploadError(
                `Row ${rowNumber}: Missing required data. Each row must have name and location_name.`
              );
              return;
            }

            // Validate coordinates if present (optional)
            if (row.latitude !== undefined || row.longitude !== undefined) {
              const lat = Number(row.latitude);
              const lng = Number(row.longitude);

              if (isNaN(lat) || lat < -90 || lat > 90) {
                setUploadError(
                  `Row ${rowNumber}: Invalid latitude. Must be a number between -90 and 90`
                );
                return;
              }
              if (isNaN(lng) || lng < -180 || lng > 180) {
                setUploadError(
                  `Row ${rowNumber}: Invalid longitude. Must be a number between -180 and 180`
                );
                return;
              }
            }

            // Validate location_name
            const locationExists = locations.some(
              (location) => location.name === row.location_name
            );
            if (!locationExists) {
              setUploadError(
                `Row ${rowNumber}: Invalid location name "${row.location_name}". Please use a valid location name.`
              );
              return;
            }
          }

          const formData = new FormData();
          formData.append("file", file);

          const token = localStorage.getItem("token");
          if (!token) {
            setUploadError(
              "Authentication token not found. Please log in again."
            );
            return;
          }

          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/ambulance/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          setUploadSuccess(
            `Successfully uploaded ${response.data.count} ambulances`
          );
          setUploadError(null);

          // Refresh the data
          const updatedResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/ambulance`
          );
          setAmbulanceData(updatedResponse.data);

          // Reset the file input
          event.target.value = "";
        } catch (error) {
          console.error("Excel processing error:", error);
          setUploadError(
            error.response?.data?.message || "Error processing the Excel file"
          );
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError("Error processing file. Please try again.");
      setUploadSuccess(null);
    }
  };

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredAmbulanceData.map((row) => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Add handleSelectRow function
  const handleSelectRow = (id) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Add handleBulkDelete function
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setDeleteConfirm({
      show: true,
      id: selectedRows,
      isBulk: true,
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

      <div className={`${sidebarOpen ? "ml-72" : "ml-20"}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Ambulance Management</h1>
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

        {/* New Ambulance Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Ambulance</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Category</label>
              <Select
                value={ambulanceCategories.categories.find(
                  (cat) => cat.value === newAmbulance.category
                )}
                onChange={(selected) =>
                  setNewAmbulance({ ...newAmbulance, category: selected.value })
                }
                options={ambulanceCategories.categories}
                styles={customStyles}
                className="mt-1"
                isSearchable
                placeholder="Select category..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Center</label>
              <input
                type="text"
                value={newAmbulance.center}
                onChange={(e) =>
                  setNewAmbulance({ ...newAmbulance, center: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Poll</label>
              <input
                type="text"
                value={newAmbulance.poll}
                onChange={(e) =>
                  setNewAmbulance({ ...newAmbulance, poll: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Location</label>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">
                    Latitude
                  </label>
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
                    placeholder="Enter latitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500">
                    Longitude
                  </label>
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
                    placeholder="Enter longitude"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Location Reference
              </label>
              <select
                value={newAmbulance.locationRef}
                onChange={(e) =>
                  setNewAmbulance({
                    ...newAmbulance,
                    locationRef: e.target.value,
                  })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddAmbulance}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-300 mx-4">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {Array.isArray(deleteConfirm.id)
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected ambulances? This action cannot be undone.`
                  : "Are you sure you want to delete this ambulance? This action cannot be undone."}
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

        {/* View Modal */}
        {viewModal.show && viewModal.data && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Ambulance Details
                </h3>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {(() => {
                        const category = ambulanceCategories.categories.find(
                          (cat) => cat.value === viewModal.data.category
                        );
                        return category
                          ? category.label
                          : viewModal.data.category || "N/A";
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Center
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.center || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poll
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.poll || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Reference
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.locationRef?.name || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coordinates
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {viewModal.data.location?.lat &&
                      viewModal.data.location?.lng
                        ? `${viewModal.data.location.lat}, ${viewModal.data.location.lng}`
                        : "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm font-mono">
                      {viewModal.data._id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseViewModal}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredAmbulanceData.length === 0 ? (
          <p className="text-center">No ambulances found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {ambulanceColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.key === "select"
                            ? "w-12"
                            : column.key === "category"
                            ? "w-24"
                            : column.key === "center"
                            ? "w-24"
                            : column.key === "poll"
                            ? "w-20"
                            : column.key === "location"
                            ? "w-28"
                            : column.key === "locationRef"
                            ? "w-24"
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
                  {filteredAmbulanceData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={ambulanceColumns.length}
                        className="px-2 py-2 text-center text-gray-500"
                      >
                        No ambulances found
                      </td>
                    </tr>
                  ) : (
                    filteredAmbulanceData.map((row) => (
                      <React.Fragment key={row._id}>
                        <tr
                          className={`hover:bg-gray-50 cursor-pointer ${
                            editingId === row._id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleViewClick(row)}
                        >
                          {ambulanceColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-2 py-2 text-sm text-gray-900 ${
                                column.key === "category"
                                  ? "max-w-24 truncate"
                                  : column.key === "center"
                                  ? "max-w-24 truncate"
                                  : column.key === "poll"
                                  ? "max-w-20 truncate"
                                  : column.key === "location"
                                  ? "max-w-28 truncate"
                                  : column.key === "locationRef"
                                  ? "max-w-24 truncate"
                                  : column.key === "actions"
                                  ? "whitespace-nowrap"
                                  : "whitespace-nowrap"
                              }`}
                            >
                              {column.render(row)}
                            </td>
                          ))}
                        </tr>
                        {editingId === row._id && (
                          <tr>
                            <td
                              colSpan={ambulanceColumns.length}
                              className="p-4"
                            >
                              <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                                <h2 className="text-lg font-bold mb-4">
                                  Edit Ambulance
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Category *
                                    </label>
                                    <Select
                                      value={ambulanceCategories.categories.find(
                                        (cat) => cat.value === row.category
                                      )}
                                      onChange={(selected) =>
                                        handleEditChange(
                                          row._id,
                                          "category",
                                          selected.value
                                        )
                                      }
                                      options={ambulanceCategories.categories}
                                      styles={customStyles}
                                      className="mt-1 block w-full"
                                      isSearchable
                                      placeholder="Select category..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Center *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.center || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "center",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Center name"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Poll *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.poll || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "poll",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Poll information"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium">
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
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
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
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Location Reference
                                    </label>
                                    <select
                                      value={
                                        row.locationRef?._id ||
                                        row.locationRef ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "locationRef",
                                          e.target.value
                                        )
                                      }
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    >
                                      <option value="">Select Location</option>
                                      {locations.map((location) => (
                                        <option
                                          key={location._id}
                                          value={location._id}
                                        >
                                          {location.name}
                                        </option>
                                      ))}
                                    </select>
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
        )}
      </div>
    </div>
  );
};

export default Ambulance;

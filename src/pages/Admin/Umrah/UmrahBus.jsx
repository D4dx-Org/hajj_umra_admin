import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, Download, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";

const UmrahBus = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [busStationData, setBusStationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newBusStation, setNewBusStation] = useState({
    name: "",
    malayalamName: "",
    urduName: "",
    stationPoint: "",
    malayalamStationPoint: "",
    urduStationPoint: "",
    link: "",
    destinationPoint: "",
    malayalamDestinationPoint: "",
    urduDestinationPoint: "",
    location: { lat: "", lng: "" },
    ref: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [sortConfig, setSortConfig] = useState({
    field: "name",
    direction: "asc",
    type: "alpha",
  });

  // Define the table columns
  const busStationColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === busStationData.length &&
            busStationData.length > 0
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
      render: (row) => {
        return row.name;
      },
    },
    {
      key: "malayalamName",
      title: "Malayalam Name",
      render: (row) => {
        return row.malayalamName || "-";
      },
    },
    {
      key: "urduName",
      title: "Urdu Name",
      render: (row) => {
        return row.urduName || "-";
      },
    },
    {
      key: "stationPoint",
      title: "Station Point",
      render: (row) => {
        return row.stationPoint || "-";
      },
    },
    {
      key: "malayalamStationPoint",
      title: "Malayalam Station Point",
      render: (row) => {
        return row.malayalamStationPoint || "-";
      },
    },
    {
      key: "urduStationPoint",
      title: "Urdu Station Point",
      render: (row) => {
        return row.urduStationPoint || "-";
      },
    },
    {
      key: "destinationPoint",
      title: "Destination Point",
      render: (row) => {
        return row.destinationPoint || "-";
      },
    },
    {
      key: "malayalamDestinationPoint",
      title: "Malayalam Destination Point",
      render: (row) => {
        return row.malayalamDestinationPoint || "-";
      },
    },
    {
      key: "urduDestinationPoint",
      title: "Urdu Destination Point",
      render: (row) => {
        return row.urduDestinationPoint || "-";
      },
    },
    {
      key: "link",
      title: "Link",
      render: (row) => {
        return row.link ? (
          <a
            href={row.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Link
          </a>
        ) : (
          "N/A"
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
      key: "ref",
      title: "Branch",
      render: (row) => {
        return row.ref?.name || "N/A";
      },
    },
    {
      key: "actions",
      title: "Actions",
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
      value: "malayalamName-alpha-asc",
      label: "Malayalam Name (A-Z)",
      field: "malayalamName",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "malayalamName-alpha-desc",
      label: "Malayalam Name (Z-A)",
      field: "malayalamName",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "urduName-alpha-asc",
      label: "Urdu Name (A-Z)",
      field: "urduName",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "urduName-alpha-desc",
      label: "Urdu Name (Z-A)",
      field: "urduName",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "stationPoint-alpha-asc",
      label: "Station Point (A-Z)",
      field: "stationPoint",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "stationPoint-alpha-desc",
      label: "Station Point (Z-A)",
      field: "stationPoint",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "destinationPoint-alpha-asc",
      label: "Destination (A-Z)",
      field: "destinationPoint",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "destinationPoint-alpha-desc",
      label: "Destination (Z-A)",
      field: "destinationPoint",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "ref-alpha-asc",
      label: "Branch (A-Z)",
      field: "ref",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "ref-alpha-desc",
      label: "Branch (Z-A)",
      field: "ref",
      direction: "desc",
      type: "alpha",
    },
  ];

  // Fetch bus stations data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah`
        );
        setBusStationData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching umrah bus station data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch branches data
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/branch-umrah`
        );
        setBranches(response.data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setBusStationData(
      busStationData.map((item) => {
        if (item._id === id) {
          if (field === "location") {
            return { ...item, location: value };
          }
          if (field === "ref") {
            const selectedBranch = branches.find(
              (branch) => branch._id === value
            );
            return {
              ...item,
              ref: selectedBranch
                ? {
                    _id: selectedBranch._id,
                    name: selectedBranch.name,
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

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBusStationData(
        busStationData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah bus station data:", error);
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setBusStationData(
        busStationData.filter((item) => !ids.includes(item._id))
      );
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting umrah bus station data:", error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Bus Station
  const handleAddBusStation = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah`,
        newBusStation,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah`
        );
        setBusStationData(updatedResponse.data);
        setNewBusStation({
          name: "",
          malayalamName: "",
          urduName: "",
          stationPoint: "",
          malayalamStationPoint: "",
          urduStationPoint: "",
          link: "",
          destinationPoint: "",
          malayalamDestinationPoint: "",
          urduDestinationPoint: "",
          location: { lat: "", lng: "" },
          ref: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah bus station data:", error);
      if (
        error.response?.data === "Bus station already exists at this location."
      ) {
        setUploadError(
          "A bus station with this name and station point already exists."
        );
      }
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
      let aValue =
        sortConfig.field === "ref"
          ? a[sortConfig.field]?.name || ""
          : a[sortConfig.field] || "";
      let bValue =
        sortConfig.field === "ref"
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

  // Filtered and sorted data
  const filteredBusStationData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = busStationData;

    if (lowerCaseSearch) {
      filtered = busStationData.filter((item) => {
        const branchName = item.ref?.name || "";
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamName &&
            item.malayalamName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduName &&
            item.urduName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.stationPoint &&
            item.stationPoint.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamStationPoint &&
            item.malayalamStationPoint
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.urduStationPoint &&
            item.urduStationPoint.toLowerCase().includes(lowerCaseSearch)) ||
          (item.destinationPoint &&
            item.destinationPoint.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamDestinationPoint &&
            item.malayalamDestinationPoint
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.urduDestinationPoint &&
            item.urduDestinationPoint
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          branchName.toLowerCase().includes(lowerCaseSearch)
        );
      });
    }

    return sortData(filtered);
  }, [busStationData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setBusStationData(
      busStationData.map((item) =>
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
          name: "Sample Bus Station",
          malayalam_name: "സാമ്പിൾ ബസ് സ്റ്റേഷൻ",
          urdu_name: "نمونہ بس اسٹیشن",
          branch_name: "Sample Branch",
          station_point: "Central Station",
          malayalam_station_point: "സെൻട്രൽ സ്റ്റേഷൻ",
          urdu_station_point: "مرکزی اسٹیشن",
          destination_point: "Makkah Terminal",
          malayalam_destination_point: "മക്കാ ടെർമിനൽ",
          urdu_destination_point: "مکہ ٹرمینل",
          link: "https://example.com",
          latitude: "21.4225",
          longitude: "39.8262",
        },
      ];

      const ws = utils.json_to_sheet([]);

      utils.sheet_add_aoa(
        ws,
        [
          [
            "name",
            "malayalam_name",
            "urdu_name",
            "branch_name",
            "station_point",
            "malayalam_station_point",
            "urdu_station_point",
            "destination_point",
            "malayalam_destination_point",
            "urdu_destination_point",
            "link",
            "latitude",
            "longitude",
          ],
        ],
        { origin: "A1" }
      );

      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      ws["!cols"] = [
        { wch: 25 }, // name
        { wch: 25 }, // malayalam_name
        { wch: 25 }, // urdu_name
        { wch: 20 }, // branch_name
        { wch: 20 }, // station_point
        { wch: 25 }, // malayalam_station_point
        { wch: 25 }, // urdu_station_point
        { wch: 20 }, // destination_point
        { wch: 25 }, // malayalam_destination_point
        { wch: 25 }, // urdu_destination_point
        { wch: 25 }, // link
        { wch: 15 }, // latitude
        { wch: 15 }, // longitude
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "umrah_bus_station_upload_template.xlsx";
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(
        `Successfully uploaded ${response.data.count} bus stations`
      );
      setUploadError(null);

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation-umrah`
      );
      setBusStationData(updatedResponse.data);

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
      setSelectedRows(filteredBusStationData.map((row) => row._id));
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
            <h1 className="text-2xl font-bold">Umrah Bus Station Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredBusStationData.length} stations
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
              {showAddForm ? "Cancel" : "Add Bus Station"}
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

        {/* New Bus Station Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">
              Add New Umrah Bus Station
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newBusStation.name}
                  onChange={(e) =>
                    setNewBusStation({ ...newBusStation, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Name
                </label>
                <input
                  type="text"
                  value={newBusStation.malayalamName}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      malayalamName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മലയാളം പേര്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Name</label>
                <input
                  type="text"
                  value={newBusStation.urduName}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      urduName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="اردو نام"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Branch *</label>
                <select
                  value={newBusStation.ref}
                  onChange={(e) =>
                    setNewBusStation({ ...newBusStation, ref: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Station Point
                </label>
                <input
                  type="text"
                  value={newBusStation.stationPoint}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      stationPoint: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Station Point
                </label>
                <input
                  type="text"
                  value={newBusStation.malayalamStationPoint}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      malayalamStationPoint: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മലയാളം സ്റ്റേഷൻ പോയിന്റ്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Urdu Station Point
                </label>
                <input
                  type="text"
                  value={newBusStation.urduStationPoint}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      urduStationPoint: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="اردو اسٹیشن پوائنٹ"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Destination Point
                </label>
                <input
                  type="text"
                  value={newBusStation.destinationPoint}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      destinationPoint: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Destination Point
                </label>
                <input
                  type="text"
                  value={newBusStation.malayalamDestinationPoint}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      malayalamDestinationPoint: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മലയാളം ഡെസ്റ്റിനേഷൻ പോയിന്റ്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Urdu Destination Point
                </label>
                <input
                  type="text"
                  value={newBusStation.urduDestinationPoint}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      urduDestinationPoint: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="اردو منزل پوائنٹ"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Link</label>
                <input
                  type="url"
                  value={newBusStation.link}
                  onChange={(e) =>
                    setNewBusStation({ ...newBusStation, link: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="https://example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Location (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newBusStation.location.lat}
                    onChange={(e) =>
                      setNewBusStation({
                        ...newBusStation,
                        location: {
                          ...newBusStation.location,
                          lat: e.target.value,
                        },
                      })
                    }
                    placeholder="Latitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    value={newBusStation.location.lng}
                    onChange={(e) =>
                      setNewBusStation({
                        ...newBusStation,
                        location: {
                          ...newBusStation.location,
                          lng: e.target.value,
                        },
                      })
                    }
                    placeholder="Longitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAddBusStation}
              disabled={!newBusStation.name || !newBusStation.ref}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Bus Station
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search bus stations..."
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
            <table className="min-w-full full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {busStationColumns.map((column) => (
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
                {filteredBusStationData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={busStationColumns.length}
                      className="px-4 py-1 text-center text-gray-500"
                    >
                      No bus stations found
                    </td>
                  </tr>
                ) : (
                  filteredBusStationData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr className={`hover:bg-gray-50 ${editingId === row._id ? 'bg-blue-50' : ''}`}>
                        {busStationColumns.map((column) => (
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
                          <td colSpan={busStationColumns.length} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-blue-200 p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Bus Station</h3>
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
                                {/* Basic Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Basic Information</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.name || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "name", e.target.value)
                                      }
                                      placeholder="Bus station name"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Malayalam Name
                                    </label>
                                    <input
                                      type="text"
                                      value={row.malayalamName || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "malayalamName", e.target.value)
                                      }
                                      placeholder="മലയാളം പേര്"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Name
                                    </label>
                                    <input
                                      type="text"
                                      value={row.urduName || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "urduName", e.target.value)
                                      }
                                      placeholder="اردو نام"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Station Point Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Station Point</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Station Point
                                    </label>
                                    <input
                                      type="text"
                                      value={row.stationPoint || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "stationPoint", e.target.value)
                                      }
                                      placeholder="Station point"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Malayalam Station Point
                                    </label>
                                    <input
                                      type="text"
                                      value={row.malayalamStationPoint || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "malayalamStationPoint", e.target.value)
                                      }
                                      placeholder="മലയാളം സ്റ്റേഷൻ പോയിന്റ്"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Station Point
                                    </label>
                                    <input
                                      type="text"
                                      value={row.urduStationPoint || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "urduStationPoint", e.target.value)
                                      }
                                      placeholder="اردو اسٹیشن پوائنٹ"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Destination and Branch Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-700">Destination & Branch</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Destination Point
                                    </label>
                                    <input
                                      type="text"
                                      value={row.destinationPoint || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "destinationPoint", e.target.value)
                                      }
                                      placeholder="Destination point"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Malayalam Destination Point
                                    </label>
                                    <input
                                      type="text"
                                      value={row.malayalamDestinationPoint || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "malayalamDestinationPoint", e.target.value)
                                      }
                                      placeholder="മലയാളം ഡെസ്റ്റിനേഷൻ പോയിന്റ്"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Urdu Destination Point
                                    </label>
                                    <input
                                      type="text"
                                      value={row.urduDestinationPoint || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "urduDestinationPoint", e.target.value)
                                      }
                                      placeholder="اردو منزل پوائنٹ"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Additional Information - Full Width */}
                              <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-4">Additional Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Branch *
                                    </label>
                                    <select
                                      value={row.ref?._id || row.ref || ""}
                                      onChange={(e) => handleEditChange(row._id, "ref", e.target.value)}
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      required
                                    >
                                      <option value="">Select Branch</option>
                                      {branches.map((branch) => (
                                        <option key={branch._id} value={branch._id}>
                                          {branch.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Link
                                    </label>
                                    <input
                                      type="url"
                                      value={row.link || ""}
                                      onChange={(e) =>
                                        handleEditChange(row._id, "link", e.target.value)
                                      }
                                      placeholder="https://example.com"
                                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Location (Optional)
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={row.location?.lat || ""}
                                        onChange={(e) =>
                                          handleEditChange(row._id, "location", {
                                            ...row.location,
                                            lat: e.target.value,
                                          })
                                        }
                                        placeholder="Latitude"
                                        className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                      <input
                                        type="number"
                                        value={row.location?.lng || ""}
                                        onChange={(e) =>
                                          handleEditChange(row._id, "location", {
                                            ...row.location,
                                            lng: e.target.value,
                                          })
                                        }
                                        placeholder="Longitude"
                                        className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected bus stations?`
                  : "Are you sure you want to delete this bus station?"}{" "}
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

export default UmrahBus;

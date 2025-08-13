import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Download,
  ArrowUpDown,
  Edit,
  Trash2,
  X,
  CheckCircle,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";
import Select from "react-select";

const BusStationKSA = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [busStationData, setBusStationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newBusStation, setNewBusStation] = useState({
    name: {
      english: "",
      malayalam: "",
      urdu: "",
    },
    stationPoint: {
      english: "",
      malayalam: "",
      urdu: "",
    },
    link: "",
    destinationPoint: {
      english: "",
      malayalam: "",
      urdu: "",
    },
    ref: "",
    locationRef: "",
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
  const [selectedBusStation, setSelectedBusStation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Define the table columns
  const busStationColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === busStationData.length}
          onChange={(event) => handleSelectAll(event)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row._id)}
          onChange={(event) => handleSelectRow(row._id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: "name",
      title: "Name (English)",
      render: (row) => (
        <span className="truncate" title={row.name?.english || row.name || "-"}>
          {row.name?.english || row.name || "-"}
        </span>
      ),
    },
    {
      key: "nameMalayalam",
      title: "Name (Malayalam)",
      render: (row) => (
        <span className="truncate" title={row.name?.malayalam || "-"}>
          {row.name?.malayalam || "-"}
        </span>
      ),
    },
    {
      key: "nameUrdu",
      title: "Name (Urdu)",
      render: (row) => (
        <span className="truncate" title={row.name?.urdu || "-"}>
          {row.name?.urdu || "-"}
        </span>
      ),
    },
    {
      key: "stationPoint",
      title: "Station Point (English)",
      render: (row) => (
        <span
          className="truncate"
          title={row.stationPoint?.english || row.stationPoint || "-"}
        >
          {row.stationPoint?.english || row.stationPoint || "-"}
        </span>
      ),
    },
    {
      key: "stationPointMalayalam",
      title: "Station Point (Malayalam)",
      render: (row) => (
        <span className="truncate" title={row.stationPoint?.malayalam || "-"}>
          {row.stationPoint?.malayalam || "-"}
        </span>
      ),
    },
    {
      key: "stationPointUrdu",
      title: "Station Point (Urdu)",
      render: (row) => (
        <span className="truncate" title={row.stationPoint?.urdu || "-"}>
          {row.stationPoint?.urdu || "-"}
        </span>
      ),
    },
    {
      key: "link",
      title: "Link",
      render: (row) => {
        return (
          <a
            href={row.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {row.link}
          </a>
        );
      },
    },
    {
      key: "destinationPoint",
      title: "Destination Point (English)",
      render: (row) => (
        <span
          className="truncate"
          title={row.destinationPoint?.english || row.destinationPoint || "-"}
        >
          {row.destinationPoint?.english || row.destinationPoint || "-"}
        </span>
      ),
    },
    {
      key: "destinationPointMalayalam",
      title: "Destination Point (Malayalam)",
      render: (row) => (
        <span
          className="truncate"
          title={row.destinationPoint?.malayalam || "-"}
        >
          {row.destinationPoint?.malayalam || "-"}
        </span>
      ),
    },
    {
      key: "destinationPointUrdu",
      title: "Destination Point (Urdu)",
      render: (row) => (
        <span className="truncate" title={row.destinationPoint?.urdu || "-"}>
          {row.destinationPoint?.urdu || "-"}
        </span>
      ),
    },
    {
      key: "ref",
      title: "Branch (English)",
      render: (row) => (
        <span className="truncate" title={row.ref?.name || row.ref || "-"}>
          {row.ref?.name || row.ref || "-"}
        </span>
      ),
    },
    {
      key: "refMalayalam",
      title: "Branch (Malayalam)",
      render: (row) => (
        <span className="truncate" title={row.ref?.name_malayalam || "-"}>
          {row.ref?.name_malayalam || "-"}
        </span>
      ),
    },
    {
      key: "refUrdu",
      title: "Branch (Urdu)",
      render: (row) => (
        <span className="truncate" title={row.ref?.name_urdu || "-"}>
          {row.ref?.name_urdu || "-"}
        </span>
      ),
    },
    {
      key: "locationRef",
      title: "Location (English)",
      render: (row) => (
        <span
          className="truncate"
          title={row.locationRef?.title || row.locationRef || "-"}
        >
          {row.locationRef?.title || row.locationRef || "-"}
        </span>
      ),
    },
    {
      key: "locationRefMalayalam",
      title: "Location (Malayalam)",
      render: (row) => (
        <span
          className="truncate"
          title={row.locationRef?.title_malayalam || "-"}
        >
          {row.locationRef?.title_malayalam || "-"}
        </span>
      ),
    },
    {
      key: "locationRefUrdu",
      title: "Location (Urdu)",
      render: (row) => (
        <span className="truncate" title={row.locationRef?.title_urdu || "-"}>
          {row.locationRef?.title_urdu || "-"}
        </span>
      ),
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

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/busStation`
        );
        console.log("Bus station data:", response.data); // Add logging
        setBusStationData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bus station data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch branches and locations
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [branchResponse, locationResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/branch`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL_V2}/locations`),
        ]);
        setBranches(branchResponse.data);
        setLocations(locationResponse.data);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchReferences();
  }, []);

  // Handle edit click
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setBusStationData(
      busStationData.map((item) =>
        item._id === editingId ? originalData : item
      )
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setBusStationData(
      busStationData.map((item) => {
        if (item._id === id) {
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
          if (field === "locationRef") {
            const selectedLocation = locations.find(
              (location) => location._id === value
            );
            return {
              ...item,
              locationRef: selectedLocation
                ? {
                    _id: selectedLocation._id,
                    title: selectedLocation.title,
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation/${row._id}`,
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
      setUploadSuccess("Bus station updated successfully");
    } catch (error) {
      console.error("Error updating bus station data:", error);
      setUploadError(
        error.response?.data?.message || "Error updating bus station"
      );
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/busStation/${id}`,
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
      setUploadSuccess(`Successfully deleted ${ids.length} bus station(s)`);
    } catch (error) {
      console.error("Error deleting bus station data:", error);
      setUploadError(
        error.response?.data?.message || "Error deleting bus station(s)"
      );
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation`,
        newBusStation,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/busStation`
        );
        setBusStationData(updatedResponse.data);
        setNewBusStation({
          name: {
            english: "",
            malayalam: "",
            urdu: "",
          },
          stationPoint: {
            english: "",
            malayalam: "",
            urdu: "",
          },
          link: "",
          destinationPoint: {
            english: "",
            malayalam: "",
            urdu: "",
          },
          ref: "",
          locationRef: "",
        });
        setShowAddForm(false);
        setUploadSuccess("Bus station added successfully");
      }
    } catch (error) {
      console.error("Error adding bus station data:", error);
      setUploadError(
        error.response?.data?.message || "Error adding bus station"
      );
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation/bulk-upload`,
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/busStation`
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

  // Handle download template
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          name_english: "Sample Bus Station Name",
          name_malayalam: "സാമ്പിൾ ബസ് സ്റ്റേഷൻ പേര്",
          name_urdu: "نمونہ بس اسٹیشن نام",
          location_name: "Sample Location Name",
          branch_name: "Sample Branch Name",
          station_point_english: "Sample Station Point",
          station_point_malayalam: "സാമ്പിൾ സ്റ്റേഷൻ പോയിന്റ്",
          station_point_urdu: "نمونہ اسٹیشن پوائنٹ",
          link: "https://maps.example.com/location",
          destination_point_english: "Sample Destination Point",
          destination_point_malayalam: "സാമ്പിൾ ഡെസ്റ്റിനേഷൻ പോയിന്റ്",
          destination_point_urdu: "نمونہ منزل پوائنٹ",
        },
      ];

      const ws = utils.json_to_sheet([]);

      // Add headers with all required fields
      utils.sheet_add_aoa(
        ws,
        [
          [
            "name_english",
            "name_malayalam",
            "name_urdu",
            "location_name",
            "branch_name",
            "station_point_english",
            "station_point_malayalam",
            "station_point_urdu",
            "link",
            "destination_point_english",
            "destination_point_malayalam",
            "destination_point_urdu",
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
        { wch: 25 }, // name_english
        { wch: 30 }, // name_malayalam
        { wch: 25 }, // name_urdu
        { wch: 25 }, // location_name
        { wch: 25 }, // branch_name
        { wch: 25 }, // station_point_english
        { wch: 30 }, // station_point_malayalam
        { wch: 25 }, // station_point_urdu
        { wch: 40 }, // link
        { wch: 25 }, // destination_point_english
        { wch: 30 }, // destination_point_malayalam
        { wch: 25 }, // destination_point_urdu
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bus_station_template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating template:", error);
      setUploadError("Failed to download template. Please try again.");
    }
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(busStationData.map((row) => row._id));
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

  // Handle row click to show details
  const handleRowClick = (busStation, event) => {
    // Prevent row click when clicking on buttons or checkboxes
    if (
      event.target.closest("button") ||
      event.target.closest('input[type="checkbox"]')
    ) {
      return;
    }
    setSelectedBusStation(busStation);
    setShowDetailModal(true);
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
    // Ensure data is an array before spreading
    if (!Array.isArray(data)) {
      return [];
    }

    return [...data].sort((a, b) => {
      let aValue, bValue;

      // Handle different field types
      if (sortConfig.field === "ref") {
        aValue = a.ref?.name || "";
        bValue = b.ref?.name || "";
      } else if (sortConfig.field === "locationRef") {
        aValue = a.locationRef?.title || "";
        bValue = b.locationRef?.title || "";
      } else if (sortConfig.field === "name") {
        aValue = a.name?.english || "";
        bValue = b.name?.english || "";
      } else if (sortConfig.field === "stationPoint") {
        aValue = a.stationPoint?.english || "";
        bValue = b.stationPoint?.english || "";
      } else if (sortConfig.field === "destinationPoint") {
        aValue = a.destinationPoint?.english || "";
        bValue = b.destinationPoint?.english || "";
      } else {
        aValue = a[sortConfig.field] || "";
        bValue = b[sortConfig.field] || "";
      }

      // Ensure values are strings before calling toLowerCase()
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Update filtered data to include sorting
  const filteredBusStationData = useMemo(() => {
    // Ensure busStationData is an array
    if (!Array.isArray(busStationData)) {
      return [];
    }

    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = busStationData;

    if (lowerCaseSearch) {
      filtered = busStationData.filter((item) => {
        return (
          (item.name?.english &&
            item.name.english.toLowerCase().includes(lowerCaseSearch)) ||
          (item.name?.malayalam &&
            item.name.malayalam.toLowerCase().includes(lowerCaseSearch)) ||
          (item.name?.urdu &&
            item.name.urdu.toLowerCase().includes(lowerCaseSearch)) ||
          (item.stationPoint?.english &&
            item.stationPoint.english
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.stationPoint?.malayalam &&
            item.stationPoint.malayalam
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.stationPoint?.urdu &&
            item.stationPoint.urdu.toLowerCase().includes(lowerCaseSearch)) ||
          (item.destinationPoint?.english &&
            item.destinationPoint.english
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.destinationPoint?.malayalam &&
            item.destinationPoint.malayalam
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.destinationPoint?.urdu &&
            item.destinationPoint.urdu
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.ref?.name &&
            item.ref.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.ref?.name_malayalam &&
            item.ref.name_malayalam.toLowerCase().includes(lowerCaseSearch)) ||
          (item.ref?.name_urdu &&
            item.ref.name_urdu.toLowerCase().includes(lowerCaseSearch)) ||
          (item.locationRef?.title &&
            item.locationRef.title.toLowerCase().includes(lowerCaseSearch)) ||
          (item.locationRef?.title_malayalam &&
            item.locationRef.title_malayalam
              .toLowerCase()
              .includes(lowerCaseSearch)) ||
          (item.locationRef?.title_urdu &&
            item.locationRef.title_urdu.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }

    return sortData(filtered);
  }, [busStationData, searchTerm, sortConfig]);

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
            <h1 className="text-2xl font-bold">Bus Station Management</h1>
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

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Bus Station</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={newBusStation.name.english}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      name: { ...newBusStation.name, english: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter station name in English"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Name (Malayalam)
                </label>
                <input
                  type="text"
                  value={newBusStation.name.malayalam}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      name: {
                        ...newBusStation.name,
                        malayalam: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter station name in Malayalam"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Name (Urdu)</label>
                <input
                  type="text"
                  value={newBusStation.name.urdu}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      name: { ...newBusStation.name, urdu: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter station name in Urdu"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">
                  Station Point (English)
                </label>
                <input
                  type="text"
                  value={newBusStation.stationPoint.english}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      stationPoint: {
                        ...newBusStation.stationPoint,
                        english: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter station point in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Station Point (Malayalam)
                </label>
                <input
                  type="text"
                  value={newBusStation.stationPoint.malayalam}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      stationPoint: {
                        ...newBusStation.stationPoint,
                        malayalam: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter station point in Malayalam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Station Point (Urdu)
                </label>
                <input
                  type="text"
                  value={newBusStation.stationPoint.urdu}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      stationPoint: {
                        ...newBusStation.stationPoint,
                        urdu: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter station point in Urdu"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Link</label>
              <input
                type="text"
                value={newBusStation.link}
                onChange={(e) =>
                  setNewBusStation({ ...newBusStation, link: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter map link"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">
                  Destination Point (English)
                </label>
                <input
                  type="text"
                  value={newBusStation.destinationPoint.english}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      destinationPoint: {
                        ...newBusStation.destinationPoint,
                        english: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter destination point in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Destination Point (Malayalam)
                </label>
                <input
                  type="text"
                  value={newBusStation.destinationPoint.malayalam}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      destinationPoint: {
                        ...newBusStation.destinationPoint,
                        malayalam: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter destination point in Malayalam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Destination Point (Urdu)
                </label>
                <input
                  type="text"
                  value={newBusStation.destinationPoint.urdu}
                  onChange={(e) =>
                    setNewBusStation({
                      ...newBusStation,
                      destinationPoint: {
                        ...newBusStation.destinationPoint,
                        urdu: e.target.value,
                      },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter destination point in Urdu"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Branch Reference
              </label>
              <select
                value={newBusStation.ref}
                onChange={(e) =>
                  setNewBusStation({ ...newBusStation, ref: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}{" "}
                    {branch.name_malayalam && `| ${branch.name_malayalam}`}{" "}
                    {branch.name_urdu && `| ${branch.name_urdu}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Location Reference
              </label>
              <select
                value={newBusStation.locationRef}
                onChange={(e) =>
                  setNewBusStation({
                    ...newBusStation,
                    locationRef: e.target.value,
                  })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.title}{" "}
                    {location.title_malayalam &&
                      `| ${location.title_malayalam}`}{" "}
                    {location.title_urdu && `| ${location.title_urdu}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddBusStation}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected bus stations? This action cannot be undone.`
                  : "Are you sure you want to delete this bus station? This action cannot be undone."}
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

        {/* Table */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredBusStationData.length === 0 ? (
          <p className="text-center">No bus stations found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full full text-sm">
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
                {filteredBusStationData.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${
                        editingId === row._id ? "bg-blue-50" : ""
                      }`}
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {busStationColumns.map((column) => (
                        <td
                          key={`${row._id}-${column.key}`}
                          className="px-4 py-1 whitespace-nowrap"
                        >
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {editingId === row._id && (
                      <tr>
                        <td colSpan={busStationColumns.length} className="p-4">
                          <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold mb-4">
                              Edit Bus Station
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">
                                  Name (English)
                                </label>
                                <input
                                  type="text"
                                  value={row.name?.english || ""}
                                  onChange={(e) =>
                                    handleEditChange(row._id, "name", {
                                      ...row.name,
                                      english: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter station name in English"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Name (Malayalam)
                                </label>
                                <input
                                  type="text"
                                  value={row.name?.malayalam || ""}
                                  onChange={(e) =>
                                    handleEditChange(row._id, "name", {
                                      ...row.name,
                                      malayalam: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter station name in Malayalam"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Name (Urdu)
                                </label>
                                <input
                                  type="text"
                                  value={row.name?.urdu || ""}
                                  onChange={(e) =>
                                    handleEditChange(row._id, "name", {
                                      ...row.name,
                                      urdu: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter station name in Urdu"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">
                                  Station Point (English)
                                </label>
                                <input
                                  type="text"
                                  value={row.stationPoint?.english || ""}
                                  onChange={(e) =>
                                    handleEditChange(row._id, "stationPoint", {
                                      ...row.stationPoint,
                                      english: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter station point in English"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Station Point (Malayalam)
                                </label>
                                <input
                                  type="text"
                                  value={row.stationPoint?.malayalam || ""}
                                  onChange={(e) =>
                                    handleEditChange(row._id, "stationPoint", {
                                      ...row.stationPoint,
                                      malayalam: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter station point in Malayalam"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Station Point (Urdu)
                                </label>
                                <input
                                  type="text"
                                  value={row.stationPoint?.urdu || ""}
                                  onChange={(e) =>
                                    handleEditChange(row._id, "stationPoint", {
                                      ...row.stationPoint,
                                      urdu: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter station point in Urdu"
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium">
                                Link
                              </label>
                              <input
                                type="text"
                                value={row.link || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    row._id,
                                    "link",
                                    e.target.value
                                  )
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                placeholder="Enter map link"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">
                                  Destination Point (English)
                                </label>
                                <input
                                  type="text"
                                  value={row.destinationPoint?.english || ""}
                                  onChange={(e) =>
                                    handleEditChange(
                                      row._id,
                                      "destinationPoint",
                                      {
                                        ...row.destinationPoint,
                                        english: e.target.value,
                                      }
                                    )
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter destination point in English"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Destination Point (Malayalam)
                                </label>
                                <input
                                  type="text"
                                  value={row.destinationPoint?.malayalam || ""}
                                  onChange={(e) =>
                                    handleEditChange(
                                      row._id,
                                      "destinationPoint",
                                      {
                                        ...row.destinationPoint,
                                        malayalam: e.target.value,
                                      }
                                    )
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter destination point in Malayalam"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Destination Point (Urdu)
                                </label>
                                <input
                                  type="text"
                                  value={row.destinationPoint?.urdu || ""}
                                  onChange={(e) =>
                                    handleEditChange(
                                      row._id,
                                      "destinationPoint",
                                      {
                                        ...row.destinationPoint,
                                        urdu: e.target.value,
                                      }
                                    )
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  placeholder="Enter destination point in Urdu"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium">
                                  Branch Reference
                                </label>
                                <select
                                  value={row.ref?._id || row.ref || ""}
                                  onChange={(e) =>
                                    handleEditChange(
                                      row._id,
                                      "ref",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                >
                                  <option value="">Select Branch</option>
                                  {branches.map((branch) => (
                                    <option key={branch._id} value={branch._id}>
                                      {branch.name}{" "}
                                      {branch.name_malayalam &&
                                        `| ${branch.name_malayalam}`}{" "}
                                      {branch.name_urdu &&
                                        `| ${branch.name_urdu}`}
                                    </option>
                                  ))}
                                </select>
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
                                      {location.title}{" "}
                                      {location.title_malayalam &&
                                        `| ${location.title_malayalam}`}{" "}
                                      {location.title_urdu &&
                                        `| ${location.title_urdu}`}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBusStation && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 mx-4">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle size={20} />
                  Bus Station Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Link
                      </label>
                      <div className="bg-white p-2 rounded border">
                        {selectedBusStation.link ? (
                          <a
                            href={selectedBusStation.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {selectedBusStation.link}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Created Date
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedBusStation.createdAt
                          ? new Date(
                              selectedBusStation.createdAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Station Names */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Station Names
                  </h3>
                  <div className="space-y-4">
                    {/* English Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        English
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Name
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.name?.english ||
                            selectedBusStation.name ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Malayalam Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Malayalam
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Name
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.name?.malayalam || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Urdu Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">Urdu</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Name
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.name?.urdu || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Station Points */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Station Points
                  </h3>
                  <div className="space-y-4">
                    {/* English Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        English
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Station Point
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.stationPoint?.english ||
                            selectedBusStation.stationPoint ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Malayalam Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Malayalam
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Station Point
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.stationPoint?.malayalam ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Urdu Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">Urdu</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Station Point
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.stationPoint?.urdu ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Destination Points */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Destination Points
                  </h3>
                  <div className="space-y-4">
                    {/* English Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        English
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Destination Point
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.destinationPoint?.english ||
                            selectedBusStation.destinationPoint ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Malayalam Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Malayalam
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Destination Point
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.destinationPoint?.malayalam ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Urdu Content */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">Urdu</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Destination Point
                        </label>
                        <p className="text-gray-900">
                          {selectedBusStation.destinationPoint?.urdu ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reference Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Reference Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Branch Reference
                      </label>
                      <div className="bg-white p-2 rounded border">
                        {selectedBusStation.ref ? (
                          <div className="space-y-1">
                            <p className="text-gray-900">
                              {selectedBusStation.ref.name}
                            </p>
                            {selectedBusStation.ref.name_malayalam && (
                              <p className="text-sm text-gray-600">
                                ML: {selectedBusStation.ref.name_malayalam}
                              </p>
                            )}
                            {selectedBusStation.ref.name_urdu && (
                              <p className="text-sm text-gray-600">
                                UR: {selectedBusStation.ref.name_urdu}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">Not provided</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Location Reference
                      </label>
                      <div className="bg-white p-2 rounded border">
                        {selectedBusStation.locationRef ? (
                          <div className="space-y-1">
                            <p className="text-gray-900">
                              {selectedBusStation.locationRef.title}
                            </p>
                            {selectedBusStation.locationRef.title_malayalam && (
                              <p className="text-sm text-gray-600">
                                ML:{" "}
                                {selectedBusStation.locationRef.title_malayalam}
                              </p>
                            )}
                            {selectedBusStation.locationRef.title_urdu && (
                              <p className="text-sm text-gray-600">
                                UR: {selectedBusStation.locationRef.title_urdu}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Last Updated
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border">
                        {selectedBusStation.updatedAt
                          ? new Date(
                              selectedBusStation.updatedAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Database ID
                      </label>
                      <p className="text-gray-900 bg-white p-2 rounded border font-mono text-sm">
                        {selectedBusStation._id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusStationKSA;

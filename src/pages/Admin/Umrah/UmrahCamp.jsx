import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Download,
  ArrowUpDown,
  Edit,
  Trash2,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { utils, write } from "xlsx";

const UmrahCamp = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [campData, setCampData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newCamp, setNewCamp] = useState({
    maktab: "",
    malayalamMaktab: "",
    urduMaktab: "",
    zone: "",
    malayalamZone: "",
    urduZone: "",
    country: "",
    otherCountry: "",
    poll: "",
    malayalamPoll: "",
    urduPoll: "",
    road: "",
    malayalamRoad: "",
    urduRoad: "",
    tent: "",
    malayalamTent: "",
    urduTent: "",
    location: { lat: "", lng: "" },
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: "maktab",
    direction: "asc",
    type: "alpha",
  });

  // Define the table columns
  const campColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === campData.length && campData.length > 0
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
      key: "maktab",
      title: "Maktab",
      render: (row) => (
        <span className="truncate" title={row.maktab || "-"}>
          {row.maktab || "-"}
        </span>
      ),
    },
    {
      key: "malayalamMaktab",
      title: "Ml Maktab",
      render: (row) => (
        <span className="truncate" title={row.malayalamMaktab || "-"}>
          {row.malayalamMaktab || "-"}
        </span>
      ),
    },
    {
      key: "urduMaktab",
      title: "Ur Maktab",
      render: (row) => (
        <span className="truncate" title={row.urduMaktab || "-"}>
          {row.urduMaktab || "-"}
        </span>
      ),
    },
    {
      key: "zone",
      title: "Zone",
      render: (row) => (
        <span className="truncate" title={row.zone || "-"}>
          {row.zone || "-"}
        </span>
      ),
    },
    {
      key: "malayalamZone",
      title: "Ml Zone",
      render: (row) => (
        <span className="truncate" title={row.malayalamZone || "-"}>
          {row.malayalamZone || "-"}
        </span>
      ),
    },
    {
      key: "urduZone",
      title: "Ur Zone",
      render: (row) => (
        <span className="truncate" title={row.urduZone || "-"}>
          {row.urduZone || "-"}
        </span>
      ),
    },
    {
      key: "country",
      title: "Country",
      render: (row) => {
        const countryText = row.otherCountry || row.country?.name || "N/A";
        return (
          <span className="truncate" title={countryText}>
            {countryText}
          </span>
        );
      },
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
      key: "malayalamPoll",
      title: "Ml Poll",
      render: (row) => (
        <span className="truncate" title={row.malayalamPoll || "-"}>
          {row.malayalamPoll || "-"}
        </span>
      ),
    },
    {
      key: "urduPoll",
      title: "Ur Poll",
      render: (row) => (
        <span className="truncate" title={row.urduPoll || "-"}>
          {row.urduPoll || "-"}
        </span>
      ),
    },
    {
      key: "road",
      title: "Road",
      render: (row) => (
        <span className="truncate" title={row.road || "N/A"}>
          {row.road || "N/A"}
        </span>
      ),
    },
    {
      key: "malayalamRoad",
      title: "Ml Road",
      render: (row) => (
        <span className="truncate" title={row.malayalamRoad || "-"}>
          {row.malayalamRoad || "-"}
        </span>
      ),
    },
    {
      key: "urduRoad",
      title: "Ur Road",
      render: (row) => (
        <span className="truncate" title={row.urduRoad || "-"}>
          {row.urduRoad || "-"}
        </span>
      ),
    },
    {
      key: "tent",
      title: "Tent",
      render: (row) => (
        <span className="truncate" title={row.tent || "N/A"}>
          {row.tent || "N/A"}
        </span>
      ),
    },
    {
      key: "malayalamTent",
      title: "Ml Tent",
      render: (row) => (
        <span className="truncate" title={row.malayalamTent || "-"}>
          {row.malayalamTent || "-"}
        </span>
      ),
    },
    {
      key: "urduTent",
      title: "Ur Tent",
      render: (row) => (
        <span className="truncate" title={row.urduTent || "-"}>
          {row.urduTent || "-"}
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
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2 action-buttons">
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
      value: "maktab-alpha-asc",
      label: "Maktab (A-Z)",
      field: "maktab",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "maktab-alpha-desc",
      label: "Maktab (Z-A)",
      field: "maktab",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "malayalamMaktab-alpha-asc",
      label: "Malayalam Maktab (A-Z)",
      field: "malayalamMaktab",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "malayalamMaktab-alpha-desc",
      label: "Malayalam Maktab (Z-A)",
      field: "malayalamMaktab",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "urduMaktab-alpha-asc",
      label: "Urdu Maktab (A-Z)",
      field: "urduMaktab",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "urduMaktab-alpha-desc",
      label: "Urdu Maktab (Z-A)",
      field: "urduMaktab",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "zone-alpha-asc",
      label: "Zone (A-Z)",
      field: "zone",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "zone-alpha-desc",
      label: "Zone (Z-A)",
      field: "zone",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "malayalamZone-alpha-asc",
      label: "Malayalam Zone (A-Z)",
      field: "malayalamZone",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "malayalamZone-alpha-desc",
      label: "Malayalam Zone (Z-A)",
      field: "malayalamZone",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "urduZone-alpha-asc",
      label: "Urdu Zone (A-Z)",
      field: "urduZone",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "urduZone-alpha-desc",
      label: "Urdu Zone (Z-A)",
      field: "urduZone",
      direction: "desc",
      type: "alpha",
    },
    {
      value: "country-alpha-asc",
      label: "Country (A-Z)",
      field: "country",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "country-alpha-desc",
      label: "Country (Z-A)",
      field: "country",
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

  // Fetch camps data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah`
        );
        setCampData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching umrah camp data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch countries data
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/country-umrah`
        );
        setCountries(response.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setCampData(
      campData.map((item) => {
        if (item._id === id) {
          if (field === "location") {
            return { ...item, location: value };
          }
          if (field === "country") {
            const selectedCountry = countries.find(
              (country) => country._id === value
            );
            return {
              ...item,
              country: selectedCountry
                ? {
                    _id: selectedCountry._id,
                    name: selectedCountry.name,
                  }
                : value,
              otherCountry: value ? "" : item.otherCountry, // Clear otherCountry if country is selected
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCampData(
        campData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah camp data:", error);
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setCampData(campData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting umrah camp data:", error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Camp
  const handleAddCamp = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah`,
        newCamp,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah`
        );
        setCampData(updatedResponse.data);
        setNewCamp({
          maktab: "",
          malayalamMaktab: "",
          urduMaktab: "",
          zone: "",
          malayalamZone: "",
          urduZone: "",
          country: "",
          otherCountry: "",
          poll: "",
          malayalamPoll: "",
          urduPoll: "",
          road: "",
          malayalamRoad: "",
          urduRoad: "",
          tent: "",
          malayalamTent: "",
          urduTent: "",
          location: { lat: "", lng: "" },
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah camp data:", error);
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
      let aValue, bValue;

      if (sortConfig.field === "country") {
        aValue = a.otherCountry || a.country?.name || "";
        bValue = b.otherCountry || b.country?.name || "";
      } else {
        aValue = a[sortConfig.field] || "";
        bValue = b[sortConfig.field] || "";
      }

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
  const filteredCampData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = campData;

    if (lowerCaseSearch) {
      filtered = campData.filter((item) => {
        const countryName = item.otherCountry || item.country?.name || "";
        return (
          (item.maktab &&
            item.maktab.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamMaktab &&
            item.malayalamMaktab.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduMaktab &&
            item.urduMaktab.toLowerCase().includes(lowerCaseSearch)) ||
          (item.zone && item.zone.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamZone &&
            item.malayalamZone.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduZone &&
            item.urduZone.toLowerCase().includes(lowerCaseSearch)) ||
          (item.poll && item.poll.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamPoll &&
            item.malayalamPoll.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduPoll &&
            item.urduPoll.toLowerCase().includes(lowerCaseSearch)) ||
          (item.road && item.road.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamRoad &&
            item.malayalamRoad.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduRoad &&
            item.urduRoad.toLowerCase().includes(lowerCaseSearch)) ||
          (item.tent && item.tent.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamTent &&
            item.malayalamTent.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduTent &&
            item.urduTent.toLowerCase().includes(lowerCaseSearch)) ||
          countryName.toLowerCase().includes(lowerCaseSearch)
        );
      });
    }

    return sortData(filtered);
  }, [campData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setCampData(
      campData.map((item) => (item._id === editingId ? originalData : item))
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          maktab: "Sample Maktab",
          malayalam_maktab: "മക്തബ് സാമ്പിൾ",
          urdu_maktab: "نمونہ مکتب",
          zone: "Zone A",
          malayalam_zone: "മേഖല എ",
          urdu_zone: "علاقہ اے",
          country: "Saudi Arabia",
          poll: "Poll 1",
          malayalam_poll: "പോൾ 1",
          urdu_poll: "پول 1",
          road: "Road 123",
          malayalam_road: "റോഡ് 123",
          urdu_road: "سڑک 123",
          tent: "Tent A1",
          malayalam_tent: "കൂടാരം എ1",
          urdu_tent: "خیمہ اے1",
          latitude: "21.4225",
          longitude: "39.8262",
        },
      ];

      const ws = utils.json_to_sheet([]);

      utils.sheet_add_aoa(
        ws,
        [
          [
            "maktab",
            "malayalam_maktab",
            "urdu_maktab",
            "zone",
            "malayalam_zone",
            "urdu_zone",
            "country",
            "poll",
            "malayalam_poll",
            "urdu_poll",
            "road",
            "malayalam_road",
            "urdu_road",
            "tent",
            "malayalam_tent",
            "urdu_tent",
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
        { wch: 20 }, // maktab
        { wch: 20 }, // malayalam_maktab
        { wch: 20 }, // urdu_maktab
        { wch: 15 }, // zone
        { wch: 15 }, // malayalam_zone
        { wch: 15 }, // urdu_zone
        { wch: 20 }, // country
        { wch: 15 }, // poll
        { wch: 15 }, // malayalam_poll
        { wch: 15 }, // urdu_poll
        { wch: 15 }, // road
        { wch: 15 }, // malayalam_road
        { wch: 15 }, // urdu_road
        { wch: 15 }, // tent
        { wch: 15 }, // malayalam_tent
        { wch: 15 }, // urdu_tent
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
      link.download = "umrah_camp_upload_template.xlsx";
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(
        `Successfully uploaded ${response.data.inserted.length} camps`
      );
      if (response.data.errors && response.data.errors.length > 0) {
        setUploadError(
          `Some rows had issues: ${response.data.errors.join(", ")}`
        );
      } else {
        setUploadError(null);
      }

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/camp-umrah`
      );
      setCampData(updatedResponse.data);

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
      setSelectedRows(filteredCampData.map((row) => row._id));
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
  const handleRowClick = (camp, event) => {
    // Prevent row click when clicking on checkboxes or action buttons
    if (
      event.target.type === "checkbox" ||
      event.target.closest("button") ||
      event.target.closest(".action-buttons")
    ) {
      return;
    }
    setSelectedCamp(camp);
    setShowDetailsModal(true);
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
            <h1 className="text-2xl font-bold">Umrah Camp Management</h1>
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
              {showAddForm ? "Cancel" : "Add Camp"}
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

        {/* New Camp Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah Camp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Maktab</label>
                <input
                  type="text"
                  value={newCamp.maktab}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, maktab: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Maktab
                </label>
                <input
                  type="text"
                  value={newCamp.malayalamMaktab}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, malayalamMaktab: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മക്തബ്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Maktab</label>
                <input
                  type="text"
                  value={newCamp.urduMaktab}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, urduMaktab: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="مکتب"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Zone</label>
                <input
                  type="text"
                  value={newCamp.zone}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, zone: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Zone
                </label>
                <input
                  type="text"
                  value={newCamp.malayalamZone}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, malayalamZone: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="മേഖല"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Zone</label>
                <input
                  type="text"
                  value={newCamp.urduZone}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, urduZone: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="علاقہ"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Country</label>
                <select
                  value={newCamp.country}
                  onChange={(e) =>
                    setNewCamp({
                      ...newCamp,
                      country: e.target.value,
                      otherCountry: e.target.value ? "" : newCamp.otherCountry,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country._id} value={country._id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Other Country
                </label>
                <input
                  type="text"
                  value={newCamp.otherCountry}
                  onChange={(e) =>
                    setNewCamp({
                      ...newCamp,
                      otherCountry: e.target.value,
                      country: e.target.value ? "" : newCamp.country,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter if not in dropdown"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Poll</label>
                <input
                  type="text"
                  value={newCamp.poll}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, poll: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Poll
                </label>
                <input
                  type="text"
                  value={newCamp.malayalamPoll}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, malayalamPoll: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="പോൾ"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Poll</label>
                <input
                  type="text"
                  value={newCamp.urduPoll}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, urduPoll: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="پول"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Road</label>
                <input
                  type="text"
                  value={newCamp.road}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, road: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Road
                </label>
                <input
                  type="text"
                  value={newCamp.malayalamRoad}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, malayalamRoad: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="റോഡ്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Road</label>
                <input
                  type="text"
                  value={newCamp.urduRoad}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, urduRoad: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="سڑک"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Tent</label>
                <input
                  type="text"
                  value={newCamp.tent}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, tent: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Tent
                </label>
                <input
                  type="text"
                  value={newCamp.malayalamTent}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, malayalamTent: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="കൂടാരം"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Tent</label>
                <input
                  type="text"
                  value={newCamp.urduTent}
                  onChange={(e) =>
                    setNewCamp({ ...newCamp, urduTent: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="خیمہ"
                />
              </div>
              <div className="mb-4 md:col-span-2">
                <label className="block text-sm font-medium">
                  Location (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newCamp.location.lat}
                    onChange={(e) =>
                      setNewCamp({
                        ...newCamp,
                        location: { ...newCamp.location, lat: e.target.value },
                      })
                    }
                    placeholder="Latitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    value={newCamp.location.lng}
                    onChange={(e) =>
                      setNewCamp({
                        ...newCamp,
                        location: { ...newCamp.location, lng: e.target.value },
                      })
                    }
                    placeholder="Longitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAddCamp}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Camp
            </button>
          </div>
        )}

        {/* Search Bar */}
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
                  {campColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === "select"
                          ? "w-12"
                          : column.key === "maktab"
                          ? "w-20"
                          : column.key === "malayalamMaktab"
                          ? "w-20"
                          : column.key === "urduMaktab"
                          ? "w-20"
                          : column.key === "zone"
                          ? "w-16"
                          : column.key === "malayalamZone"
                          ? "w-20"
                          : column.key === "urduZone"
                          ? "w-20"
                          : column.key === "country"
                          ? "w-24"
                          : column.key === "poll"
                          ? "w-16"
                          : column.key === "malayalamPoll"
                          ? "w-16"
                          : column.key === "urduPoll"
                          ? "w-16"
                          : column.key === "road"
                          ? "w-16"
                          : column.key === "malayalamRoad"
                          ? "w-16"
                          : column.key === "urduRoad"
                          ? "w-16"
                          : column.key === "tent"
                          ? "w-16"
                          : column.key === "malayalamTent"
                          ? "w-16"
                          : column.key === "urduTent"
                          ? "w-16"
                          : column.key === "location"
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
                {filteredCampData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={campColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No camps found
                    </td>
                  </tr>
                ) : (
                  filteredCampData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr
                        className={`hover:bg-gray-50 cursor-pointer ${
                          editingId === row._id ? "bg-blue-50" : ""
                        }`}
                        onClick={(event) => handleRowClick(row, event)}
                      >
                        {campColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-2 py-2 text-sm text-gray-900 ${
                              column.key === "maktab"
                                ? "max-w-20 truncate"
                                : column.key === "malayalamMaktab"
                                ? "max-w-20 truncate"
                                : column.key === "urduMaktab"
                                ? "max-w-20 truncate"
                                : column.key === "zone"
                                ? "max-w-16 truncate"
                                : column.key === "malayalamZone"
                                ? "max-w-20 truncate"
                                : column.key === "urduZone"
                                ? "max-w-20 truncate"
                                : column.key === "country"
                                ? "max-w-24 truncate"
                                : column.key === "poll"
                                ? "max-w-16 truncate"
                                : column.key === "malayalamPoll"
                                ? "max-w-16 truncate"
                                : column.key === "urduPoll"
                                ? "max-w-16 truncate"
                                : column.key === "road"
                                ? "max-w-16 truncate"
                                : column.key === "malayalamRoad"
                                ? "max-w-16 truncate"
                                : column.key === "urduRoad"
                                ? "max-w-16 truncate"
                                : column.key === "tent"
                                ? "max-w-16 truncate"
                                : column.key === "malayalamTent"
                                ? "max-w-16 truncate"
                                : column.key === "urduTent"
                                ? "max-w-16 truncate"
                                : column.key === "location"
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
                          <td colSpan={campColumns.length} className="p-4">
                            <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                              <h2 className="text-lg font-bold mb-4">
                                Edit Camp
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">
                                    Maktab
                                  </label>
                                  <input
                                    type="text"
                                    value={row.maktab || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "maktab",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Maktab name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Maktab
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamMaktab || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamMaktab",
                                        e.target.value
                                      )
                                    }
                                    placeholder="മലയാളം മക്തബ്"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Maktab
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduMaktab || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduMaktab",
                                        e.target.value
                                      )
                                    }
                                    placeholder="اردو مکتوب"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Zone
                                  </label>
                                  <input
                                    type="text"
                                    value={row.zone || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "zone",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Zone name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Zone
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamZone || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamZone",
                                        e.target.value
                                      )
                                    }
                                    placeholder="മലയാളം സോൺ"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Zone
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduZone || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduZone",
                                        e.target.value
                                      )
                                    }
                                    placeholder="اردو زون"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Country
                                  </label>
                                  <select
                                    value={
                                      row.country?._id || row.country || ""
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "country",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  >
                                    <option value="">Select Country</option>
                                    {countries.map((country) => (
                                      <option
                                        key={country._id}
                                        value={country._id}
                                      >
                                        {country.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Other Country
                                  </label>
                                  <input
                                    type="text"
                                    value={row.otherCountry || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "otherCountry",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Or enter other country"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Poll
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
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Poll
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamPoll || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamPoll",
                                        e.target.value
                                      )
                                    }
                                    placeholder="പോൾ"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Poll
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduPoll || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduPoll",
                                        e.target.value
                                      )
                                    }
                                    placeholder="پول"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Road
                                  </label>
                                  <input
                                    type="text"
                                    value={row.road || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "road",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Road information"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Road
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamRoad || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamRoad",
                                        e.target.value
                                      )
                                    }
                                    placeholder="റോഡ്"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Road
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduRoad || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduRoad",
                                        e.target.value
                                      )
                                    }
                                    placeholder="سڑک"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Tent
                                  </label>
                                  <input
                                    type="text"
                                    value={row.tent || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "tent",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Tent information"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Tent
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamTent || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamTent",
                                        e.target.value
                                      )
                                    }
                                    placeholder="കൂടാരം"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Tent
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduTent || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduTent",
                                        e.target.value
                                      )
                                    }
                                    placeholder="خیمہ"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                    placeholder="Latitude"
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
                                    placeholder="Longitude"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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

        {/* Camp Details Modal */}
        {showDetailsModal && selectedCamp && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full border border-gray-300 mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Camp Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maktab</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.maktab || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malayalam Maktab</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.malayalamMaktab || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urdu Maktab</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.urduMaktab || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.zone || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malayalam Zone</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.malayalamZone || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urdu Zone</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.urduZone || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedCamp.otherCountry || selectedCamp.country?.name || "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poll</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.poll || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malayalam Poll</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.malayalamPoll || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urdu Poll</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.urduPoll || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Road</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.road || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malayalam Road</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.malayalamRoad || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urdu Road</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.urduRoad || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tent</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.tent || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malayalam Tent</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.malayalamTent || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urdu Tent</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedCamp.urduTent || "N/A"}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedCamp.location && selectedCamp.location.lat && selectedCamp.location.lng
                      ? `Lat: ${selectedCamp.location.lat}, Lng: ${selectedCamp.location.lng}`
                      : "N/A"}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedCamp.createdAt ? new Date(selectedCamp.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedCamp.updatedAt ? new Date(selectedCamp.updatedAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected camps?`
                  : "Are you sure you want to delete this camp?"}{" "}
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

export default UmrahCamp;

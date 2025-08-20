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
import { read, utils, write } from "xlsx";

const UmrahClinic = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clinicData, setClinicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newClinic, setNewClinic] = useState({
    name: "",
    malayalamName: "",
    urduName: "",
    center: "",
    malayalamCenter: "",
    urduCenter: "",
    poll: "",
    malayalamPoll: "",
    urduPoll: "",
    location: { lat: "", lng: "" },
    branchRef: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: "name",
    direction: "asc",
    type: "alpha",
  });

  // Define the table columns
  const clinicColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === clinicData.length && clinicData.length > 0
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
      render: (row) => (
        <span className="truncate" title={row.name}>
          {row.name}
        </span>
      ),
    },
    {
      key: "malayalamName",
      title: "Ml Name",
      render: (row) => (
        <span className="truncate" title={row.malayalamName || "-"}>
          {row.malayalamName || "-"}
        </span>
      ),
    },
    {
      key: "urduName",
      title: "Ur Name",
      render: (row) => (
        <span className="truncate" title={row.urduName || "-"}>
          {row.urduName || "-"}
        </span>
      ),
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
      key: "malayalamCenter",
      title: "Ml Center",
      render: (row) => (
        <span className="truncate" title={row.malayalamCenter || "-"}>
          {row.malayalamCenter || "-"}
        </span>
      ),
    },
    {
      key: "urduCenter",
      title: "Ur Center",
      render: (row) => (
        <span className="truncate" title={row.urduCenter || "-"}>
          {row.urduCenter || "-"}
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
      key: "branchRef",
      title: "Branch",
      render: (row) => {
        const branchName = row.branchRef?.name || "N/A";
        return (
          <span className="truncate" title={branchName}>
            {branchName}
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
    {
      value: "branchRef-alpha-asc",
      label: "Branch (A-Z)",
      field: "branchRef",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "branchRef-alpha-desc",
      label: "Branch (Z-A)",
      field: "branchRef",
      direction: "desc",
      type: "alpha",
    },
  ];

  // Fetch clinics data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah`
        );
        setClinicData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching umrah clinic data:", error);
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
    setClinicData(
      clinicData.map((item) => {
        if (item._id === id) {
          if (field === "location") {
            return { ...item, location: value };
          }
          if (field === "branchRef") {
            const selectedBranch = branches.find(
              (branch) => branch._id === value
            );
            return {
              ...item,
              branchRef: selectedBranch
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setClinicData(
        clinicData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah clinic data:", error);
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setClinicData(clinicData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting umrah clinic data:", error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Clinic
  const handleAddClinic = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah`,
        newClinic,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah`
        );
        setClinicData(updatedResponse.data);
        setNewClinic({
          name: "",
          malayalamName: "",
          urduName: "",
          center: "",
          malayalamCenter: "",
          urduCenter: "",
          poll: "",
          malayalamPoll: "",
          urduPoll: "",
          location: { lat: "", lng: "" },
          branchRef: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah clinic data:", error);
      if (error.response?.data?.message === "Clinic already exists.") {
        setUploadError("A clinic with this name already exists.");
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
        sortConfig.field === "branchRef"
          ? a[sortConfig.field]?.name || ""
          : a[sortConfig.field] || "";
      let bValue =
        sortConfig.field === "branchRef"
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
  const filteredClinicData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = clinicData;

    if (lowerCaseSearch) {
      filtered = clinicData.filter((item) => {
        const branchName = item.branchRef?.name || "";
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamName &&
            item.malayalamName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduName &&
            item.urduName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.center &&
            item.center.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamCenter &&
            item.malayalamCenter.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduCenter &&
            item.urduCenter.toLowerCase().includes(lowerCaseSearch)) ||
          (item.poll && item.poll.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamPoll &&
            item.malayalamPoll.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduPoll &&
            item.urduPoll.toLowerCase().includes(lowerCaseSearch)) ||
          branchName.toLowerCase().includes(lowerCaseSearch)
        );
      });
    }

    return sortData(filtered);
  }, [clinicData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setClinicData(
      clinicData.map((item) => (item._id === editingId ? originalData : item))
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          name: "Sample Clinic",
          malayalam_name: "ക്ലിനിക് സാമ്പിൾ",
          urdu_name: "نمونہ کلینک",
          branch_name: "Sample Branch",
          center: "Sample Center",
          malayalam_center: "സെന്റർ സാമ്പിൾ",
          urdu_center: "نمونہ سینٹر",
          poll: "Sample Poll",
          malayalam_poll: "പോൾ സാമ്പിൾ",
          urdu_poll: "نمونہ پول",
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
            "center",
            "malayalam_center",
            "urdu_center",
            "poll",
            "malayalam_poll",
            "urdu_poll",
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
        { wch: 20 }, // center
        { wch: 20 }, // malayalam_center
        { wch: 20 }, // urdu_center
        { wch: 15 }, // poll
        { wch: 15 }, // malayalam_poll
        { wch: 15 }, // urdu_poll
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
      link.download = "umrah_clinic_upload_template.xlsx";
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(`Successfully uploaded ${response.data.count} clinics`);
      setUploadError(null);

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/clinic-umrah`
      );
      setClinicData(updatedResponse.data);

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
      setSelectedRows(filteredClinicData.map((row) => row._id));
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
  const handleRowClick = (clinic, event) => {
    // Prevent row click when clicking on checkboxes or action buttons
    if (
      event.target.type === "checkbox" ||
      event.target.closest("button") ||
      event.target.closest(".action-buttons")
    ) {
      return;
    }
    setSelectedClinic(clinic);
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
            <h1 className="text-2xl font-bold">Umrah Clinic Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredClinicData.length} clinics
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
              {showAddForm ? "Cancel" : "Add Clinic"}
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

        {/* New Clinic Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Umrah Clinic</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newClinic.name}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, name: e.target.value })
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
                  value={newClinic.malayalamName}
                  onChange={(e) =>
                    setNewClinic({
                      ...newClinic,
                      malayalamName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="ക്ലിനിക്"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Name</label>
                <input
                  type="text"
                  value={newClinic.urduName}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, urduName: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 "
                  placeholder="کلینک"
                  dir="rtl" 
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Branch *</label>
                <select
                  value={newClinic.branchRef}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, branchRef: e.target.value })
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
                <label className="block text-sm font-medium">Center</label>
                <input
                  type="text"
                  value={newClinic.center}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, center: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Malayalam Center
                </label>
                <input
                  type="text"
                  value={newClinic.malayalamCenter}
                  onChange={(e) =>
                    setNewClinic({
                      ...newClinic,
                      malayalamCenter: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="സെന്റർ"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Center</label>
                <input
                  type="text"
                  value={newClinic.urduCenter}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, urduCenter: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 "
                  placeholder="سینٹر"
                  dir="rtl" 
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Poll</label>
                <input
                  type="text"
                  value={newClinic.poll}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, poll: e.target.value })
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
                  value={newClinic.malayalamPoll}
                  onChange={(e) =>
                    setNewClinic({
                      ...newClinic,
                      malayalamPoll: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="പോൾ"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Poll</label>
                <input
                  type="text"
                  value={newClinic.urduPoll}
                  onChange={(e) =>
                    setNewClinic({ ...newClinic, urduPoll: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 placeholder"
                  placeholder="پول"
                  dir="rtl" 
                                    style={{ textAlign: 'right' }}
                />
              </div>
              <div className="mb-4 md:col-span-2">
                <label className="block text-sm font-medium">
                  Location (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newClinic.location.lat}
                    onChange={(e) =>
                      setNewClinic({
                        ...newClinic,
                        location: {
                          ...newClinic.location,
                          lat: e.target.value,
                        },
                      })
                    }
                    placeholder="Latitude"
                    className="mt-1 block w-1/2 border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    value={newClinic.location.lng}
                    onChange={(e) =>
                      setNewClinic({
                        ...newClinic,
                        location: {
                          ...newClinic.location,
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
              onClick={handleAddClinic}
              disabled={!newClinic.name || !newClinic.branchRef}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Clinic
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search clinics..."
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
                  {clinicColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === "select"
                          ? "w-12"
                          : column.key === "name"
                          ? "w-20"
                          : column.key === "malayalamName"
                          ? "w-20"
                          : column.key === "urduName"
                          ? "w-20"
                          : column.key === "center"
                          ? "w-20"
                          : column.key === "malayalamCenter"
                          ? "w-20"
                          : column.key === "urduCenter"
                          ? "w-20"
                          : column.key === "poll"
                          ? "w-16"
                          : column.key === "malayalamPoll"
                          ? "w-20"
                          : column.key === "urduPoll"
                          ? "w-20"
                          : column.key === "location"
                          ? "w-24"
                          : column.key === "branchRef"
                          ? "w-20"
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
                {filteredClinicData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={clinicColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No clinics found
                    </td>
                  </tr>
                ) : (
                  filteredClinicData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr
                        className={`hover:bg-gray-50 cursor-pointer ${
                          editingId === row._id ? "bg-blue-50" : ""
                        }`}
                        onClick={(event) => handleRowClick(row, event)}
                      >
                        {clinicColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-2 py-2 text-sm text-gray-900 ${
                              column.key === "name"
                                ? "max-w-20 truncate"
                                : column.key === "malayalamName"
                                ? "max-w-20 truncate"
                                : column.key === "urduName"
                                ? "max-w-20 truncate"
                                : column.key === "center"
                                ? "max-w-20 truncate"
                                : column.key === "malayalamCenter"
                                ? "max-w-20 truncate"
                                : column.key === "urduCenter"
                                ? "max-w-20 truncate"
                                : column.key === "poll"
                                ? "max-w-16 truncate"
                                : column.key === "malayalamPoll"
                                ? "max-w-20 truncate"
                                : column.key === "urduPoll"
                                ? "max-w-20 truncate"
                                : column.key === "location"
                                ? "max-w-24 truncate"
                                : column.key === "branchRef"
                                ? "max-w-20 truncate"
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
                          <td colSpan={clinicColumns.length} className="p-4">
                            <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                              <h2 className="text-lg font-bold mb-4">
                                Edit Clinic
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">
                                    Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.name || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Clinic name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Name
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamName || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamName",
                                        e.target.value
                                      )
                                    }
                                    placeholder="മലയാളം പേര്"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Name
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduName || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduName",
                                        e.target.value
                                      )
                                    }
                                    placeholder="اردو نام"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Center
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
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Malayalam Center
                                  </label>
                                  <input
                                    type="text"
                                    value={row.malayalamCenter || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "malayalamCenter",
                                        e.target.value
                                      )
                                    }
                                    placeholder="മലയാളം സെന്റർ"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Urdu Center
                                  </label>
                                  <input
                                    type="text"
                                    value={row.urduCenter || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "urduCenter",
                                        e.target.value
                                      )
                                    }
                                    placeholder="اردو سینٹر"
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
                                    placeholder="മലയാളം പോൾ"
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
                                    placeholder="اردو پول"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Branch *
                                  </label>
                                  <select
                                    value={
                                      row.branchRef?._id || row.branchRef || ""
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "branchRef",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  >
                                    <option value="">Select Branch</option>
                                    {branches.map((branch) => (
                                      <option
                                        key={branch._id}
                                        value={branch._id}
                                      >
                                        {branch.name}
                                      </option>
                                    ))}
                                  </select>
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

        {/* Clinic Details Modal */}
        {showDetailsModal && selectedClinic && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full border border-gray-300 mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Clinic Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.name || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Malayalam Name
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.malayalamName || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urdu Name
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.urduName || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Center
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.center || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Malayalam Center
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.malayalamCenter || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urdu Center
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.urduCenter || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poll
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.poll || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Malayalam Poll
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.malayalamPoll || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urdu Poll
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.urduPoll || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.branchRef?.name || "N/A"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.location &&
                    selectedClinic.location.lat &&
                    selectedClinic.location.lng
                      ? `Lat: ${selectedClinic.location.lat}, Lng: ${selectedClinic.location.lng}`
                      : "N/A"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.createdAt
                      ? new Date(selectedClinic.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated At
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedClinic.updatedAt
                      ? new Date(selectedClinic.updatedAt).toLocaleString()
                      : "N/A"}
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected clinics?`
                  : "Are you sure you want to delete this clinic?"}{" "}
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

export default UmrahClinic;

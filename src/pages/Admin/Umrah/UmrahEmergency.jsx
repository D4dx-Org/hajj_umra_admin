import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, ArrowUpDown, Download, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { utils, write } from "xlsx";

const UmrahEmergency = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newEmergency, setNewEmergency] = useState({
    name: "",
    malayalamName: "",
    urduName: "",
    contact: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: "name",
    direction: "asc",
    type: "alpha",
  });

  // Define the table columns
  const emergencyColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            selectedRows.length === emergencyData.length &&
            emergencyData.length > 0
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
      key: "malayalamName",
      title: "Malayalam Name",
      render: (row) => <span className="truncate" title={row.malayalamName || "-"}>{row.malayalamName || "-"}</span>,
    },
    {
      key: "urduName",
      title: "Urdu Name",
      render: (row) => <span className="truncate" title={row.urduName || "-"}>{row.urduName || "-"}</span>,
    },
    {
      key: "contact",
      title: "Contact",
      render: (row) => <span className="truncate" title={row.contact}>{row.contact}</span>,
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
      value: "contact-alpha-asc",
      label: "Contact (A-Z)",
      field: "contact",
      direction: "asc",
      type: "alpha",
    },
    {
      value: "contact-alpha-desc",
      label: "Contact (Z-A)",
      field: "contact",
      direction: "desc",
      type: "alpha",
    },
  ];

  // Fetch emergency data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah`
        );
        setEmergencyData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching umrah emergency data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setEmergencyData(
      emergencyData.map((item) => {
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmergencyData(
        emergencyData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating umrah emergency data:", error);
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
            `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setEmergencyData(emergencyData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting umrah emergency data:", error);
    }
  };

  // Handle Delete Cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Emergency
  const handleAddEmergency = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah`,
        newEmergency,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah`
        );
        setEmergencyData(updatedResponse.data);
        setNewEmergency({
          name: "",
          malayalamName: "",
          urduName: "",
          contact: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding umrah emergency data:", error);
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
  const filteredEmergencyData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    let filtered = emergencyData;

    if (lowerCaseSearch) {
      filtered = emergencyData.filter((item) => {
        return (
          (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
          (item.malayalamName && item.malayalamName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.urduName && item.urduName.toLowerCase().includes(lowerCaseSearch)) ||
          (item.contact && item.contact.toLowerCase().includes(lowerCaseSearch))
        );
      });
    }

    return sortData(filtered);
  }, [emergencyData, searchTerm, sortConfig]);

  // Edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Cancel button click handler
  const handleCancelEdit = () => {
    setEmergencyData(
      emergencyData.map((item) =>
        item._id === editingId ? originalData : item
      )
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(filteredEmergencyData.map((row) => row._id));
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
  const handleRowClick = (emergency, event) => {
    // Prevent row click when clicking on checkboxes or action buttons
    if (
      event.target.type === "checkbox" ||
      event.target.closest("button") ||
      event.target.closest(".action-buttons")
    ) {
      return;
    }
    setSelectedEmergency(emergency);
    setShowDetailsModal(true);
  };

  // Download template function
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          name: "Emergency Service",
          malayalam_name: "അടിയന്തര സേവനം",
          urdu_name: "ہنگامی خدمات",
          contact: "+966-12-345-6789",
        },
      ];

      const ws = utils.json_to_sheet([]);

      utils.sheet_add_aoa(
        ws,
        [["name", "malayalam_name", "urdu_name", "contact"]],
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
        { wch: 20 }, // contact
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "umrah_emergency_upload_template.xlsx";
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess(`Successfully uploaded ${response.data.count} emergency contacts`);
      setUploadError(null);

      // Refresh the data
      const updatedResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL_V2}/emergency-umrah`
      );
      setEmergencyData(updatedResponse.data);

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
            <h1 className="text-2xl font-bold">Umrah Emergency Contacts</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredEmergencyData.length} contacts
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
              {showAddForm ? "Cancel" : "Add Emergency Contact"}
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

        {/* New Emergency Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">
              Add New Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={newEmergency.name}
                  onChange={(e) =>
                    setNewEmergency({ ...newEmergency, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Malayalam Name</label>
                <input
                  type="text"
                  value={newEmergency.malayalamName}
                  onChange={(e) =>
                    setNewEmergency({ ...newEmergency, malayalamName: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="അടിയന്തര സമ്പർക്കം"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Urdu Name</label>
                <input
                  type="text"
                  value={newEmergency.urduName}
                  onChange={(e) =>
                    setNewEmergency({ ...newEmergency, urduName: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 placeholder"
                  placeholder="ہنگامی رابطہ"
                  dir="rtl" 
                  style={{ textAlign: 'right' }}
                  
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Contact *</label>
                <input
                  type="text"
                  value={newEmergency.contact}
                  onChange={(e) =>
                    setNewEmergency({
                      ...newEmergency,
                      contact: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Phone number or other contact info"
                  required
                />
              </div>
            </div>
            <button
              onClick={handleAddEmergency}
              disabled={!newEmergency.name || !newEmergency.contact}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Emergency Contact
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search emergency contacts..."
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
                  {emergencyColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === 'select' ? 'w-12' :
                        column.key === 'name' ? 'w-24' :
                        column.key === 'malayalamName' ? 'w-24' :
                        column.key === 'urduName' ? 'w-24' :
                        column.key === 'contact' ? 'w-24' :
                        column.key === 'actions' ? 'w-20' : ''
                      }`}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmergencyData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={emergencyColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No emergency contacts found
                    </td>
                  </tr>
                ) : (
                  filteredEmergencyData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer ${editingId === row._id ? 'bg-blue-50' : ''}`}
                        onClick={(event) => handleRowClick(row, event)}
                      >
                        {emergencyColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-2 py-2 text-sm text-gray-900 ${
                              column.key === 'name' ? 'max-w-24 truncate' :
                              column.key === 'malayalamName' ? 'max-w-24 truncate' :
                              column.key === 'urduName' ? 'max-w-24 truncate' :
                              column.key === 'contact' ? 'max-w-24 truncate' :
                              column.key === 'actions' ? 'whitespace-nowrap' : 'whitespace-nowrap'
                            }`}
                          >
                            {column.render(row)}
                          </td>
                        ))}
                      </tr>
                      {editingId === row._id && (
                        <tr>
                          <td colSpan={emergencyColumns.length} className="p-4">
                            <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                              <h2 className="text-lg font-bold mb-4">Edit Emergency Contact</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">Name *</label>
                                  <input
                                    type="text"
                                    value={row.name || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "name", e.target.value)
                                    }
                                    placeholder="Emergency contact name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Malayalam Name</label>
                                  <input
                                    type="text"
                                    value={row.malayalamName || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "malayalamName", e.target.value)
                                    }
                                    placeholder="മലയാളം പേര്"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Urdu Name</label>
                                  <input
                                    type="text"
                                    value={row.urduName || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "urduName", e.target.value)
                                    }
                                    placeholder="اردو نام"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 placeholder:text-left"
                                    dir="rtl" 
                                    style={{ textAlign: 'right' }}
                                    
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Contact *</label>
                                  <input
                                    type="text"
                                    value={row.contact || ""}
                                    onChange={(e) =>
                                      handleEditChange(row._id, "contact", e.target.value)
                                    }
                                    placeholder="Phone number or contact info"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
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

        {/* Emergency Details Modal */}
        {showDetailsModal && selectedEmergency && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full border border-gray-300 mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Emergency Contact Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmergency.name || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malayalam Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmergency.malayalamName || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urdu Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmergency.urduName || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedEmergency.contact || "N/A"}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedEmergency.createdAt ? new Date(selectedEmergency.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedEmergency.updatedAt ? new Date(selectedEmergency.updatedAt).toLocaleString() : "N/A"}
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
                  ? `Are you sure you want to delete ${deleteConfirm.id.length} selected emergency contacts?`
                  : "Are you sure you want to delete this emergency contact?"}{" "}
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

export default UmrahEmergency;

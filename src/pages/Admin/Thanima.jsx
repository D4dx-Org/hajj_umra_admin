import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, Download, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";

const Thanima = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thanimaData, setThanimaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newThanima, setNewThanima] = useState({
    name: "",
    phone: "",
    id: "",
    ref: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedThanima, setSelectedThanima] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(thanimaData.map((row) => row._id));
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
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setDeleteConfirm({
      show: true,
      id: selectedRows,
      isBulk: true,
    });
  };

  // Modify handleDeleteConfirm to handle bulk delete
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
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/thanima/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setThanimaData(thanimaData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting thanima data:", error);
    }
  };

  // Define the table columns
  const thanimaColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === thanimaData.length}
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
      key: "id",
      title: "ID",
      render: (row) => (
        <span className="truncate" title={row.id || "N/A"}>
          {row.id || "N/A"}
        </span>
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
      key: "phone",
      title: "Phone",
      render: (row) => (
        <span className="truncate" title={row.phone || "N/A"}>
          {row.phone || "N/A"}
        </span>
      ),
    },

    {
      key: "ref",
      title: "Location Reference",
      render: (row) => {
        const locationName = row.ref?.name || "N/A";
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
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

  // Fetch data from API using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/thanima`
        );
        setThanimaData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Thanima data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add useEffect to fetch locations
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

  // Filter data based on search input
  const filteredThanimaData = useMemo(() => {
    // Ensure thanimaData is an array
    if (!Array.isArray(thanimaData)) {
      return [];
    }

    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return thanimaData;
    return thanimaData.filter((item) => {
      const locationName =
        item.ref?.name ||
        locations.find((loc) => loc._id === item.ref)?.name ||
        "";
      return (
        item.name.toLowerCase().includes(lowerCaseSearch) ||
        item.id.toString().toLowerCase().includes(lowerCaseSearch) ||
        item.phone.toLowerCase().includes(lowerCaseSearch) ||
        locationName.toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [thanimaData, searchTerm, locations]);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setThanimaData(
      thanimaData.map((item) => {
        if (item._id === id) {
          if (field === "ref") {
            const selectedLocation = locations.find((loc) => loc._id === value);
            return {
              ...item,
              ref: selectedLocation
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

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/thanima/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setThanimaData(
        thanimaData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating thanima data:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Add handleDeleteCancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle Add New Thanima
  const handleAddThanima = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/thanima`,
        newThanima,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/thanima`
        );
        setThanimaData(updatedResponse.data);
        setNewThanima({
          name: "",
          phone: "",
          id: "",
          ref: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding thanima data:", error);
    }
  };

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    setThanimaData(
      thanimaData.map((item) => (item._id === editingId ? originalData : item))
    );
    setEditingId(null);
    setOriginalData(null);
  };

  // Handle row click to show details
  const handleRowClick = (thanima) => {
    setSelectedThanima(thanima);
    setShowDetails(true);
  };

  // Handle close details
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedThanima(null);
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

          const isValid = data.every((row) => row.name && row.phone && row.id);
          if (!isValid) {
            setUploadError(
              "Invalid data format. Please ensure all required fields are present."
            );
            return;
          }

          const formData = new FormData();
          formData.append("file", file);

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/thanima/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          setUploadSuccess(
            `Successfully uploaded ${response.data.count} thanimas`
          );
          setUploadError(null);

          const updatedResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/thanima`
          );
          setThanimaData(updatedResponse.data);
        } catch (error) {
          setUploadError(
            error.response?.data?.message || "Error uploading file"
          );
          setUploadSuccess(null);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setUploadError("Error processing file");
      setUploadSuccess(null);
    }
  };

  // Add download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          name: "Sample Thanima",
          phone: "+966500000000",
          id: "THN001",
          location: "Sample Location Name",
        },
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);

      // Add headers
      utils.sheet_add_aoa(ws, [["name", "phone", "id", "location"]], {
        origin: "A1",
      });

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      // Add column widths
      ws["!cols"] = [
        { wch: 20 }, // name
        { wch: 15 }, // phone
        { wch: 10 }, // id
        { wch: 30 }, // location
      ];

      // Create workbook
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Template");

      // Generate Excel file
      write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      // Convert to blob and download
      const blob = new Blob([write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "thanima_upload_template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating template:", error);
      setUploadError("Failed to download template. Please try again.");
    }
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
            <h1 className="text-2xl font-bold">Thanima Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredThanimaData.length} thanimas
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
              {showAddForm ? "Cancel" : "Add More"}
            </button>
          </div>
        </div>

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

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Thanima</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={newThanima.name}
                onChange={(e) =>
                  setNewThanima({ ...newThanima, name: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={newThanima.phone}
                onChange={(e) =>
                  setNewThanima({ ...newThanima, phone: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">ID</label>
              <input
                type="text"
                value={newThanima.id}
                onChange={(e) =>
                  setNewThanima({ ...newThanima, id: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Location Reference
              </label>
              <select
                value={newThanima.ref}
                onChange={(e) =>
                  setNewThanima({ ...newThanima, ref: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {Array.isArray(locations) &&
                  locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleAddThanima}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Thanima
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search thanimas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            />
            <Search
              size={20}
              className="absolute left-3 top-3.5 text-gray-400"
            />
          </div>
        </div>

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredThanimaData.length === 0 ? (
          <p className="text-center">No thanima found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {thanimaColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.key === "select"
                            ? "w-12"
                            : column.key === "name"
                            ? "w-24"
                            : column.key === "phone"
                            ? "w-24"
                            : column.key === "id"
                            ? "w-20"
                            : column.key === "ref"
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
                  {filteredThanimaData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={thanimaColumns.length}
                        className="px-2 py-2 text-center text-gray-500"
                      >
                        No thanima found
                      </td>
                    </tr>
                  ) : (
                    filteredThanimaData.map((row) => (
                      <React.Fragment key={row._id}>
                        <tr
                          className={`hover:bg-gray-50 cursor-pointer ${
                            editingId === row._id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleRowClick(row)}
                        >
                          {thanimaColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-2 py-2 text-sm text-gray-900 ${
                                column.key === "name"
                                  ? "max-w-24 truncate"
                                  : column.key === "phone"
                                  ? "max-w-24 truncate"
                                  : column.key === "id"
                                  ? "max-w-20 truncate"
                                  : column.key === "ref"
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
                            <td colSpan={thanimaColumns.length} className="p-4">
                              <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                                <h2 className="text-lg font-bold mb-4">
                                  Edit Thanima
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
                                      placeholder="Thanima name"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Phone *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.phone || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "phone",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Phone number"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      ID *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.id || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "id",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Thanima ID"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Location Reference
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

      {/* Thanima Details Modal */}
      {showDetails && selectedThanima && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Thanima Details</h3>
              <button
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedThanima.id || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name:
                </label>
                <p className="text-sm text-gray-900">{selectedThanima.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedThanima.phone || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location Reference:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedThanima.ref?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedThanima.createdAt
                    ? new Date(selectedThanima.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated:
                </label>
                <p className="text-sm text-gray-900">
                  {selectedThanima.updatedAt
                    ? new Date(selectedThanima.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
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
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected thanimas? This action cannot be undone.`
                : "Are you sure you want to delete this thanima? This action cannot be undone."}
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
  );
};

export default Thanima;

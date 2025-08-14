import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, Download, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import axios from "axios";
import { read, utils, write } from "xlsx";

const Nusuk = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nusukData, setNusukData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newNusuk, setNewNusuk] = useState({
    name: "",
    nameMalayalam: "",
    nameUrdu: "",
    building: "",
    buildingMalayalam: "",
    buildingUrdu: "",
    location: { lat: "", lng: "" },
    ref: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedNusuk, setSelectedNusuk] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Add handleSelectAll function
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(nusukData.map((row) => row._id));
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
          axios.delete(`${import.meta.env.VITE_BACKEND_URL_V2}/nusuk/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setNusukData(nusukData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting nusuk data:", error);
    }
  };

  // Define the table columns
  const nusukColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={
            nusukData.length > 0 && selectedRows.length === nusukData.length
          }
          onChange={handleSelectAll}
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
      key: "nameMalayalam",
      title: "Ml Name",
      render: (row) => (
        <span className="truncate" title={row.nameMalayalam || "-"}>
          {row.nameMalayalam || "-"}
        </span>
      ),
    },
    {
      key: "nameUrdu",
      title: "Ur Name",
      render: (row) => (
        <span className="truncate" title={row.nameUrdu || "-"}>
          {row.nameUrdu || "-"}
        </span>
      ),
    },
    {
      key: "building",
      title: "Building",
      render: (row) => (
        <span className="truncate" title={row.building}>
          {row.building}
        </span>
      ),
    },
    {
      key: "buildingMalayalam",
      title: "Ml Building",
      render: (row) => (
        <span className="truncate" title={row.buildingMalayalam || "-"}>
          {row.buildingMalayalam || "-"}
        </span>
      ),
    },
    {
      key: "buildingUrdu",
      title: "Ur Building",
      render: (row) => (
        <span className="truncate" title={row.buildingUrdu || "-"}>
          {row.buildingUrdu || "-"}
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
      key: "ref",
      title: "Location Ref",
      render: (row) => {
        const locationName =
          row.ref?.title ||
          locations.find((loc) => loc._id === row.ref)?.title ||
          "N/A";
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
          `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk`
        );
        setNusukData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Nusuk data:", error);
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
          `${import.meta.env.VITE_BACKEND_URL_V2}/locations`
        );
        setLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // Filter data based on search input
  const filteredNusukData = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return nusukData;
    return nusukData.filter((item) => {
      const locationName =
        item.ref?.title ||
        locations.find((loc) => loc._id === item.ref)?.title ||
        "";
      return (
        item.name.toLowerCase().includes(lowerCaseSearch) ||
        item.building.toLowerCase().includes(lowerCaseSearch) ||
        locationName.toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [nusukData, searchTerm, locations]);

  // Handle edit change in table row
  const handleEditChange = (id, field, value) => {
    setNusukData(
      nusukData.map((item) => {
        if (item._id === id) {
          if (field === "location") {
            return { ...item, location: value };
          }
          if (field === "ref") {
            const selectedLocation = locations.find((loc) => loc._id === value);
            return {
              ...item,
              ref: selectedLocation
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
        `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk/${row._id}`,
        row,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNusukData(
        nusukData.map((item) =>
          item._id === row._id ? { ...item, ...response.data } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating nusuk data:", error);
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

  // Handle Add New Nusuk
  const handleAddNusuk = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk`,
        newNusuk,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk`
        );
        setNusukData(updatedResponse.data);
        setNewNusuk({
          name: "",
          nameMalayalam: "",
          nameUrdu: "",
          building: "",
          buildingMalayalam: "",
          buildingUrdu: "",
          location: { lat: "", lng: "" },
          ref: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding nusuk data:", error);
    }
  };

  // Modify the edit button click handler
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Modify the cancel button click handler
  const handleCancelEdit = () => {
    setNusukData(
      nusukData.map((item) => (item._id === editingId ? originalData : item))
    );
    setEditingId(null);
    setOriginalData(null);
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

          const isValid = data.every((row) => {
            const hasRequiredFields = row.name && row.building;
            const hasValidCoordinates =
              !row.latitude ||
              !row.longitude ||
              (typeof Number(row.latitude) === "number" &&
                !isNaN(Number(row.latitude)) &&
                typeof Number(row.longitude) === "number" &&
                !isNaN(Number(row.longitude)));
            return hasRequiredFields && hasValidCoordinates;
          });

          if (!isValid) {
            setUploadError(
              "Invalid data format. Please ensure all required fields (name, building) are present and coordinates are valid numbers if provided."
            );
            return;
          }

          const formData = new FormData();
          formData.append("file", file);

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk/bulk-upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          setUploadSuccess(
            `Successfully uploaded ${response.data.count} nusuks`
          );
          setUploadError(null);

          const updatedResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL_V2}/nusuk`
          );
          setNusukData(updatedResponse.data);
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

  // Handle row click to show details
  const handleRowClick = (nusuk, event) => {
    // Don't trigger if clicking on checkbox, edit, or delete buttons
    if (
      event.target.type === "checkbox" ||
      event.target.closest("button") ||
      event.target.closest("a")
    ) {
      return;
    }
    setSelectedNusuk(nusuk);
    setShowDetailsModal(true);
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedNusuk(null);
  };

  // Add download template function
  const handleDownloadTemplate = () => {
    try {
      // Create sample data
      const sampleData = [
        {
          name: "Sample Nusuk",
          nameMalayalam: "Sample Nusuk Malayalam",
          nameUrdu: "Sample Nusuk Urdu",
          building: "Building A",
          buildingMalayalam: "Building A Malayalam",
          buildingUrdu: "Building A Urdu",
          latitude: "21.4225",
          longitude: "39.8262",
          location_name: "Sample Location Name",
        },
      ];

      // Create worksheet
      const ws = utils.json_to_sheet([]);

      // Add headers with comments
      utils.sheet_add_aoa(
        ws,
        [
          [
            "name",
            "nameMalayalam",
            "nameUrdu",
            "building",
            "buildingMalayalam",
            "buildingUrdu",
            "latitude",
            "longitude",
            "location_name",
          ],
        ],
        { origin: "A1" }
      );

      // Add sample data
      utils.sheet_add_json(ws, sampleData, {
        origin: "A2",
        skipHeader: true,
      });

      // Add column widths
      ws["!cols"] = [
        { wch: 20 }, // name
        { wch: 20 }, // nameMalayalam
        { wch: 20 }, // nameUrdu
        { wch: 20 }, // building
        { wch: 20 }, // buildingMalayalam
        { wch: 20 }, // buildingUrdu
        { wch: 12 }, // latitude
        { wch: 12 }, // longitude
        { wch: 30 }, // location_name
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
      link.download = "nusuk_upload_template.xlsx";
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
            <h1 className="text-2xl font-bold">Nusuk Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredNusukData.length} nusuks
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
            <h2 className="text-lg font-bold mb-4">Add New Nusuk</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Name (English)
              </label>
              <input
                type="text"
                value={newNusuk.name}
                onChange={(e) =>
                  setNewNusuk({ ...newNusuk, name: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Name (Malayalam)
              </label>
              <input
                type="text"
                value={newNusuk.nameMalayalam}
                onChange={(e) =>
                  setNewNusuk({ ...newNusuk, nameMalayalam: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Name (Urdu)</label>
              <input
                type="text"
                value={newNusuk.nameUrdu}
                onChange={(e) =>
                  setNewNusuk({ ...newNusuk, nameUrdu: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Building (English)
              </label>
              <input
                type="text"
                value={newNusuk.building}
                onChange={(e) =>
                  setNewNusuk({ ...newNusuk, building: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Building (Malayalam)
              </label>
              <input
                type="text"
                value={newNusuk.buildingMalayalam}
                onChange={(e) =>
                  setNewNusuk({
                    ...newNusuk,
                    buildingMalayalam: e.target.value,
                  })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Building (Urdu)
              </label>
              <input
                type="text"
                value={newNusuk.buildingUrdu}
                onChange={(e) =>
                  setNewNusuk({ ...newNusuk, buildingUrdu: e.target.value })
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
                    value={newNusuk.location.lat}
                    onChange={(e) =>
                      setNewNusuk({
                        ...newNusuk,
                        location: { ...newNusuk.location, lat: e.target.value },
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
                    value={newNusuk.location.lng}
                    onChange={(e) =>
                      setNewNusuk({
                        ...newNusuk,
                        location: { ...newNusuk.location, lng: e.target.value },
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
                value={newNusuk.ref}
                onChange={(e) =>
                  setNewNusuk({ ...newNusuk, ref: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {[
                      location.title,
                      location.titleMalayalam,
                      location.titleUrdu,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddNusuk}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Nusuk
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search nusuks..."
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

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  {nusukColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.key === "select"
                          ? "w-12"
                          : column.key === "name"
                          ? "w-20"
                          : column.key === "nameMalayalam"
                          ? "w-20"
                          : column.key === "nameUrdu"
                          ? "w-20"
                          : column.key === "building"
                          ? "w-20"
                          : column.key === "buildingMalayalam"
                          ? "w-20"
                          : column.key === "buildingUrdu"
                          ? "w-20"
                          : column.key === "location"
                          ? "w-24"
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={nusukColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredNusukData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={nusukColumns.length}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredNusukData.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr
                        className={`hover:bg-gray-50 cursor-pointer ${
                          editingId === row._id ? "bg-blue-50" : ""
                        }`}
                        onClick={(e) => handleRowClick(row, e)}
                      >
                        {nusukColumns.map((column) => (
                          <td
                            key={`${row._id}-${column.key}`}
                            className={`px-2 py-2 text-sm text-gray-900 ${
                              column.key === "name"
                                ? "max-w-20 truncate"
                                : column.key === "nameMalayalam"
                                ? "max-w-20 truncate"
                                : column.key === "nameUrdu"
                                ? "max-w-20 truncate"
                                : column.key === "building"
                                ? "max-w-20 truncate"
                                : column.key === "buildingMalayalam"
                                ? "max-w-20 truncate"
                                : column.key === "buildingUrdu"
                                ? "max-w-20 truncate"
                                : column.key === "location"
                                ? "max-w-24 truncate"
                                : column.key === "ref"
                                ? "max-w-24 truncate"
                                : column.key === "actions"
                                ? "whitespace-nowrap"
                                : "whitespace-nowrap"
                            }`}
                          >
                            {column.render
                              ? column.render(row)
                              : row[column.key]}
                          </td>
                        ))}
                      </tr>
                      {editingId === row._id && (
                        <tr>
                          <td colSpan={nusukColumns.length} className="p-4">
                            <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                              <h2 className="text-lg font-bold mb-4">
                                Edit Nusuk
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium">
                                    Name (English) *
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
                                    placeholder="Enter name in English"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Name (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.nameMalayalam || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "nameMalayalam",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter name in Malayalam"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Name (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.nameUrdu || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "nameUrdu",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter name in Urdu"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    dir="rtl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Building (English) *
                                  </label>
                                  <input
                                    type="text"
                                    value={row.building || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "building",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter building name in English"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Building (Malayalam)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.buildingMalayalam || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "buildingMalayalam",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter building name in Malayalam"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">
                                    Building (Urdu)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.buildingUrdu || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        row._id,
                                        "buildingUrdu",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter building name in Urdu"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    dir="rtl"
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
                                    step="any"
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
                                    step="any"
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
                                        {[
                                          location.title,
                                          location.titleMalayalam,
                                          location.titleUrdu,
                                        ]
                                          .filter(Boolean)
                                          .join(" | ")}
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
      </div>

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
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected nusuks? This action cannot be undone.`
                : "Are you sure you want to delete this nusuk? This action cannot be undone."}
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

      {/* Nusuk Details Modal */}
      {showDetailsModal && selectedNusuk && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Nusuk Details</h2>
              <button
                onClick={handleCloseDetailsModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Names Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Name (English)
                  </h3>
                  <p className="text-gray-900 break-words">
                    {selectedNusuk.name || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Name (Malayalam)
                  </h3>
                  <p className="text-gray-900 break-words">
                    {selectedNusuk.nameMalayalam || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Name (Urdu)
                  </h3>
                  <p className="text-gray-900 break-words text-right" dir="rtl">
                    {selectedNusuk.nameUrdu || "N/A"}
                  </p>
                </div>
              </div>

              {/* Buildings Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Building (English)
                  </h3>
                  <p className="text-gray-900 break-words">
                    {selectedNusuk.building || "N/A"}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Building (Malayalam)
                  </h3>
                  <p className="text-gray-900 break-words">
                    {selectedNusuk.buildingMalayalam || "N/A"}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Building (Urdu)
                  </h3>
                  <p className="text-gray-900 break-words text-right" dir="rtl">
                    {selectedNusuk.buildingUrdu || "N/A"}
                  </p>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Coordinates
                    </h4>
                    {selectedNusuk.location &&
                    selectedNusuk.location.lat &&
                    selectedNusuk.location.lng ? (
                      <div className="space-y-1">
                        <p className="text-gray-900">
                          <span className="font-medium">Latitude:</span>{" "}
                          {selectedNusuk.location.lat}
                        </p>
                        <p className="text-gray-900">
                          <span className="font-medium">Longitude:</span>{" "}
                          {selectedNusuk.location.lng}
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${selectedNusuk.location.lat},${selectedNusuk.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500">No coordinates available</p>
                    )}
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Location Reference
                    </h4>
                    <p className="text-gray-900 break-words">
                      {selectedNusuk.ref?.title ||
                        locations.find((loc) => loc._id === selectedNusuk.ref)
                          ?.title ||
                        "No location reference"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedNusuk._id}
                  </div>
                  {selectedNusuk.createdAt && (
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedNusuk.createdAt).toLocaleString()}
                    </div>
                  )}
                  {selectedNusuk.updatedAt && (
                    <div>
                      <span className="font-medium">Updated:</span>{" "}
                      {new Date(selectedNusuk.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              {/* <button
                onClick={() => {
                  handleCloseDetailsModal();
                  handleEditClick(selectedNusuk);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button> */}
              <button
                onClick={handleCloseDetailsModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nusuk;

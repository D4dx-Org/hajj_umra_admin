import React, { useState, useEffect, useMemo } from "react";
import { Search, AlertTriangle, Edit, Trash2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import axios from "axios";

const Emergency = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newEmergency, setNewEmergency] = useState({
    name: "",
    contact: "",
    ref: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [viewModal, setViewModal] = useState({ show: false, data: null });

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(emergencyData.map((row) => row._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select single row
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
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setDeleteConfirm({
      show: true,
      id: selectedRows,
      isBulk: true,
    });
  };

  // Handle view button click
  const handleViewClick = (row) => {
    setViewModal({ show: true, data: row });
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModal({ show: false, data: null });
  };

  // Define the table columns
  const emergencyColumns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={selectedRows.length === emergencyData.length}
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
      key: "name",
      title: "Name",
      render: (row) => (
        <span className="truncate" title={row.name}>
          {row.name}
        </span>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      render: (row) => (
        <span className="truncate" title={row.contact || "N/A"}>
          {row.contact || "N/A"}
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

  // Fetch emergency data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/emergency`
        );
        setEmergencyData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Emergency data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch locations
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

  // Filter data based on search
  const filteredEmergencyData = useMemo(() => {
    return emergencyData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ref?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emergencyData, searchTerm]);

  // Handle edit change
  const handleEditChange = (id, field, value) => {
    setEmergencyData(
      emergencyData.map((item) => {
        if (item._id === id) {
          if (field === "ref") {
            return {
              ...item,
              ref: value
                ? {
                    _id: value,
                    name: locations.find((loc) => loc._id === value)?.name,
                  }
                : null,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Handle save edit
  const handleSaveEdit = async (row) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/emergency/${row._id}`,
        {
          name: row.name,
          contact: row.contact,
          ref: row.ref?._id || row.ref || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmergencyData(
        emergencyData.map((item) =>
          item._id === row._id ? response.data : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating emergency data:", error);
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const ids = Array.isArray(deleteConfirm.id)
        ? deleteConfirm.id
        : [deleteConfirm.id];

      await Promise.all(
        ids.map((id) =>
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/emergency/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setEmergencyData(emergencyData.filter((item) => !ids.includes(item._id)));
      setSelectedRows([]);
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting emergency data:", error);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  // Handle add new emergency
  const handleAddEmergency = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/emergency`,
        newEmergency,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmergencyData([...emergencyData, response.data]);
      setNewEmergency({ name: "", contact: "", ref: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding emergency data:", error);
    }
  };

  // Handle edit click
  const handleEditClick = (row) => {
    setOriginalData(row);
    setEditingId(row._id);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEmergencyData(
      emergencyData.map((item) =>
        item._id === editingId ? originalData : item
      )
    );
    setEditingId(null);
    setOriginalData(null);
  };

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} />
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />

      <div className={`${sidebarOpen ? "ml-72" : "ml-20"}`}>
        <div className="flex justify-between items-center mt-20 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Emergency Management</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {filteredEmergencyData.length} contacts
            </div>
          </div>
          <div className="flex gap-4">
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Delete Selected ({selectedRows.length})
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-500 text-white px-4 py-2 mr-4 rounded-md hover:bg-green-600"
            >
              {showAddForm ? "Cancel" : "Add New"}
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">
              Add New Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newEmergency.name}
                  onChange={(e) =>
                    setNewEmergency({ ...newEmergency, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact
                </label>
                <input
                  type="text"
                  value={newEmergency.contact}
                  onChange={(e) =>
                    setNewEmergency({
                      ...newEmergency,
                      contact: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <select
                  value={newEmergency.ref}
                  onChange={(e) =>
                    setNewEmergency({ ...newEmergency, ref: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleAddEmergency}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Emergency Contact
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
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
        </div>

        {/* Table Component */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredEmergencyData.length === 0 ? (
          <p className="text-center">No emergency contacts found</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    {emergencyColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.key === "select"
                            ? "w-12"
                            : column.key === "name"
                            ? "w-32"
                            : column.key === "contact"
                            ? "w-24"
                            : column.key === "ref"
                            ? "w-32"
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
                          className={`hover:bg-gray-50 cursor-pointer ${
                            editingId === row._id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleViewClick(row)}
                        >
                          {emergencyColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-2 py-2 text-sm text-gray-900 ${
                                column.key === "name"
                                  ? "max-w-32 truncate"
                                  : column.key === "contact"
                                  ? "max-w-24 truncate"
                                  : column.key === "ref"
                                  ? "max-w-32 truncate"
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
                              colSpan={emergencyColumns.length}
                              className="p-4"
                            >
                              <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-4xl mx-auto">
                                <h2 className="text-lg font-bold mb-4">
                                  Edit Emergency Contact
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
                                      placeholder="Emergency contact name"
                                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">
                                      Contact *
                                    </label>
                                    <input
                                      type="text"
                                      value={row.contact || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          row._id,
                                          "contact",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Contact number"
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
                ? `Are you sure you want to delete ${deleteConfirm.id.length} selected contacts?`
                : "Are you sure you want to delete this contact?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
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

      {/* View Modal */}
      {viewModal.show && viewModal.data && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Emergency Contact Details
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
                    Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {viewModal.data.name || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {viewModal.data.contact || "N/A"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Reference
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {viewModal.data.ref?.name || "N/A"}
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
    </div>
  );
};

export default Emergency;

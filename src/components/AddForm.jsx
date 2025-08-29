import React, { useState } from "react";
import { X, Plus, Save, Trash2, FileText, Code } from "lucide-react";

const defaultField = { fieldName: "title", type: "string" };

const AddForm = ({ open, onClose, onSuccess }) => {
  const [pageName, setPageName] = useState("");
  const [fields, setFields] = useState([defaultField]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const addField = () => setFields([...fields, { fieldName: "", type: "string" }]);
  const removeField = (idx) => setFields(fields.filter((_, i) => i !== idx));
  const updateField = (idx, key, val) => {
    const next = [...fields];
    next[idx] = { ...next[idx], [key]: val };
    setFields(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_V2}/page-builder/umrah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pageName, fields })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create page");
      
      // Reset form
      setPageName("");
      setFields([defaultField]);
      
      onSuccess?.(data.page);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldTypeIcon = (type) => {
    const icons = {
      string: "Aa",
      int: "123",
      text: "¶",
      image: "🖼",
      video: "🎥",
      url: "🔗",
      map: "🗺"
    };
    return icons[type] || "Aa";
  };

  const getFieldTypeColor = (type) => {
    const colors = {
      string: "bg-[#4A90E2]/10 text-[#357ABD] border-[#4A90E2]/30",
      int: "bg-[#357ABD]/10 text-[#3a51a3] border-[#357ABD]/30",
      text: "bg-[#3a51a3]/10 text-[#3a51a3] border-[#3a51a3]/30",
      image: "bg-[#4A90E2]/15 text-[#357ABD] border-[#4A90E2]/40",
      video: "bg-[#357ABD]/15 text-[#3a51a3] border-[#357ABD]/40",
      url: "bg-[#4A90E2]/20 text-[#357ABD] border-[#4A90E2]/50",
      map: "bg-[#3a51a3]/15 text-[#3a51a3] border-[#3a51a3]/40"
    };
    return colors[type] || colors.string;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Create New Page</h2>
                <p className="text-white/80 text-sm">Add a custom page to Umrah Categories</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              disabled={submitting}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium text-sm">Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Page Name Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Page Name
              </label>
              <input 
                value={pageName} 
                onChange={(e) => setPageName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent transition-all placeholder-gray-400"
                placeholder="e.g., Prayer Guidelines, Umrah Steps"
                required 
                disabled={submitting}
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Code size={12} />
                <span>Route and component will be generated automatically</span>
              </div>
            </div>

            {/* Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Page Fields</h3>
                  <p className="text-xs text-gray-500">Define the data structure for your page</p>
                </div>
                <button 
                  type="button" 
                  onClick={addField} 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#4A90E2] hover:text-[#357ABD] hover:bg-[#4A90E2]/10 rounded-lg transition-colors"
                  disabled={submitting}
                >
                  <Plus size={14} />
                  Add Field
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                {fields.map((field, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      {/* Field Name */}
                      <div className="col-span-7">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Field Name
                        </label>
                        <input 
                          value={field.fieldName} 
                          onChange={(e) => updateField(idx, 'fieldName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-sm"
                          placeholder="e.g., description, steps"
                          required 
                          disabled={submitting}
                        />
                      </div>
                      
                      {/* Field Type */}
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Data Type
                        </label>
                        <div className="relative">
                          <select 
                            value={field.type} 
                            onChange={(e) => updateField(idx, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-sm appearance-none bg-white"
                            disabled={submitting}
                          >
                            <option value="string">Text (String)</option>
                            <option value="int">Number (Int)</option>
                            <option value="text">Long Text</option>
                            <option value="image">Image Upload</option>
                            <option value="video">Video URL</option>
                            <option value="url">Web Link</option>
                            <option value="map">Map Location</option>
                          </select>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex justify-end pt-6">
                        {fields.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeField(idx)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove field"
                            disabled={submitting}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Field Type Badge */}
                    <div className="mt-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getFieldTypeColor(field.type)}`}>
                        <span>{getFieldTypeIcon(field.type)}</span>
                        <span>{field.type}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No fields added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {pageName && (
              <div className="bg-[#4A90E2]/10 border border-[#4A90E2]/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#357ABD] mb-2">Page Preview</h4>
                <div className="space-y-1 text-xs text-[#3a51a3]">
                  <p><span className="font-medium">Name:</span> {pageName}</p>
                  <p><span className="font-medium">Route:</span> /{pageName.toLowerCase().replace(/\s+/g, '-')}</p>
                  <p><span className="font-medium">Fields:</span> {fields.length} field(s) defined</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Always Visible */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={submitting || !pageName.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-[#4A90E2] hover:bg-[#357ABD] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Page
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddForm;
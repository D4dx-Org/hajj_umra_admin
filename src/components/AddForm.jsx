import React, { useState } from "react";
import { X, Plus, Save, Trash2 } from "lucide-react";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Create Umrah Category Page</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>

        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-1">Page Name</label>
            <input value={pageName} onChange={(e)=>setPageName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="e.g., Prayer" required />
            <p className="text-xs text-gray-500 mt-1">Slug and component are generated automatically.</p>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Fields</span>
            <button type="button" onClick={addField} className="flex items-center text-blue-600 text-sm"><Plus size={14} className="mr-1"/>Add field</button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {fields.map((f, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-3">
                  <label className="block text-xs text-gray-600 mb-1">Field name</label>
                  <input value={f.fieldName} onChange={(e)=>updateField(idx,'fieldName', e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., description" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Type</label>
                  <select value={f.type} onChange={(e)=>updateField(idx,'type', e.target.value)} className="w-full p-2 border rounded">
                    <option value="string">string</option>
                    <option value="int">int</option>
                    <option value="text">text</option>
                    <option value="image">image</option>
                    <option value="video">video</option>
                  </select>
                </div>
                <div className="col-span-5 text-right">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => removeField(idx)} className="inline-flex items-center text-red-600 text-xs"><Trash2 size={14} className="mr-1"/>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-5">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
              <Save size={16} className="mr-1" />
              {submitting ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddForm; 
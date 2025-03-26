import React from 'react';

const TableComponent = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className="px-4 py-3 text-left text-sm font-bold text-[#002147]"
                >
                  {column.title}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-bold text-[#002147]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {columns.map((column) => (
                  <td 
                    key={`${rowIndex}-${column.key}`}
                    className="px-4 py-3 text-sm"
                  >
                    {typeof row[column.key] === 'object' && row[column.key] !== null
                      ? `Lat: ${row[column.key].lat}, Lng: ${row[column.key].lng}`
                      : row[column.key]
                    }
                  </td>
                ))}
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => onEdit(row)} className="text-blue-500 hover:underline">Edit</button>
                  <button onClick={() => onDelete(row._id)} className="text-red-500 hover:underline ml-2">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableComponent;
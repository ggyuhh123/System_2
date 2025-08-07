import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";

const COLUMN_HEADERS = [...Array(26)].map((_, i) =>
  String.fromCharCode(65 + i) // A to Z
);

function ImmersionRecords() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/file-data?filename=${encodeURIComponent(filename)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file data");
        return res.json();
      })
      .then((json) => {
        setData(json.rows);
      })
      .catch((e) => setError(e.message));
  }, [filename]);

  const cellStyle = "border border-gray-500 px-3 py-2 text-sm text-white";
  const headerStyle = "bg-[#4c3a91] text-white font-semibold";

  return (
    <Dashboard>
      {/* Fixed back button sidebar */}
      <div className="fixed top-5 left-18 h-screen w-64 text-white">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#a361ef] rounded hover:bg-purple-700"
        >
          Back
        </button>
      </div>

      {/* Main content area */}
      <div className="ml-10 p-1 mt-10 mr-5 text-white">
        <h1 className="text-2xl font-bold mb-4">Excel View: {filename}</h1>

        {error && <p className="text-red-500">Error: {error}</p>}

        <div className="overflow-auto border border-gray-600 rounded-lg max-h-[600px]">
          <table className="min-w-[1500px] w-full table-fixed border-collapse text-left">
            <thead>
              <tr>
                {COLUMN_HEADERS.map((letter, i) => (
                  <th
                    key={i}
                    className={`${cellStyle} ${headerStyle} w-[120px] text-center`}
                  >
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={26} className="text-center text-gray-300 py-4">
                    No data to display.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#3a3a3a]"}
                  >
                    {COLUMN_HEADERS.map((_, colIndex) => {
                      // Column A (index 0) will show the row number
                      if (colIndex === 0) {
                        return (
                          <td key={colIndex} className={`${cellStyle} text-center`}>
                            {rowIndex + 1}
                          </td>
                        );
                      } else {
                        return (
                          <td key={colIndex} className={cellStyle}>
                            {row[colIndex - 1] || ""}
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Dashboard>
  );
}

export default ImmersionRecords;
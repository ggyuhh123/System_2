import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const writtenMaxScores = {
  WI: 10,
  CO: 10,
  "5S": 5,
  BO: 10,
  CBO: 5,
  SDG: 5,
  OHSA: 20,
  WE: 10,
  UJC: 15,
  ISO: 10,
  PO: 15,
  HR: 10,
  SUPP: 40,
  DS: 10,
};

const PERFORMANCE_SCALE = [
  [5, 100],
  [4, 95],
  [3, 85],
  [2, 79],
  [1, 75],
  [0, 60],
];

const supportDepartments = ["ACCTG", "ERT", "HSN", "HS", "ER"];
const productionDepartments = ["PROD"];
const technicalDepartments = ["IT"];

export default function ImmersionProduction() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname.toLowerCase();
  const isProduction = path.includes("/production/");
  const isSupport = path.includes("/records/");
  const isTechnical = path.includes("/technical/");

  const [rows, setRows] = useState(() => {
    let content = [];
    if (location.state?.row?.content) {
      content = location.state.row.content;
    } else {
      const storedData = JSON.parse(localStorage.getItem("immersionData")) || [];
      const matched = storedData.find((entry) => entry.fileName === filename);
      if (matched) {
        content = matched.content;
      }
    }

    const initialRows = content.map((row) => {
      const normalized = {};
      for (const key in row) {
        normalized[key.trim().toUpperCase()] = row[key];
      }
      return normalized;
    });

    return initialRows.map((row) => {
      const gradeFields = Object.keys(writtenMaxScores).reduce((acc, key) => {
        acc[key] = row[key] || "";
        return acc;
      }, {});
      return {
        ...row,
        grades: gradeFields,
        performance: row["PERFORMANCE APPRAISAL"] || "",
      };
    });
  });

  const filteredRows = rows.filter((row) => {
    const dept = (row["DEPARTMENT"] || "").toUpperCase().trim();
    if (isSupport) return supportDepartments.includes(dept);
    if (isProduction) return productionDepartments.includes(dept);
    if (isTechnical) return technicalDepartments.includes(dept);
    return true;
  });

  const handleGradeChange = (rowIndex, field, value) => {
    if (!/^\d{0,3}$/.test(value)) return;
    const max = writtenMaxScores[field];
    const numeric = parseInt(value, 10);
    if (!isNaN(numeric) && numeric > max) return;
    setRows((prev) => {
      const updated = [...prev];
      const updatedRow = { ...updated[rowIndex] };
      const updatedGrades = { ...updatedRow.grades };
      updatedGrades[field] = value;
      updatedRow.grades = updatedGrades;
      updated[rowIndex] = updatedRow;
      return updated;
    });
  };

  const handlePerformanceChange = (rowIndex, value) => {
    if (value === "") {
      setRows((prev) => {
        const updated = [...prev];
        const updatedRow = { ...updated[rowIndex], performance: value };
        updated[rowIndex] = updatedRow;
        return updated;
      });
      return;
    }

    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 5) {
      if (/^\d*\.?\d{0,2}$/.test(value)) {
        setRows((prev) => {
          const updated = [...prev];
          const updatedRow = { ...updated[rowIndex], performance: value };
          updated[rowIndex] = updatedRow;
          return updated;
        });
      }
    }
  };

  const lookupPerformanceGrade = (value) => {
    const score = parseFloat(value);
    if (isNaN(score)) return 0;
    for (const [limit, grade] of PERFORMANCE_SCALE) {
      if (score >= limit) return grade;
    }
    return 60;
  };

  const computeResults = (grades, performanceValue) => {
    const writtenTotal = Object.entries(grades).reduce(
      (sum, [_, val]) => sum + (parseInt(val, 10) || 0),
      0
    );
    const writtenRating = ((writtenTotal / 185) * 50 + 50).toFixed(2);
    const perfRating = lookupPerformanceGrade(performanceValue);
    const finalGrade = (
      parseFloat(writtenRating) * 0.3 +
      parseFloat(perfRating) * 0.7
    ).toFixed(2);
    const remarks = finalGrade < 75 ? "INCOMPLETE" : "COMPLETE";
    return {
      writtenTotal,
      writtenRating,
      performanceRating: perfRating,
      finalGrade,
      remarks,
    };
  };

  const cellStyle =
    "border border-gray-500 px-3 py-2 text-sm text-white text-center";
  const headerStyle = "bg-[#4c3a91] text-white font-semibold";

  const baseBtnClass = "px-4 py-2 rounded text-white font-semibold";
  const btnBaseColor = " bg-[#a361ef]";
  const btnHoverColor = "hover:bg- bg-[#a361ef]";
  const btnActiveColor = "bg-[#6f5ad5]";

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      {/* Top Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/immersion")}
            className="px-4 py-2 bg-[#a361ef] text-white rounded"
          >
            Back
          </button>
          <h1 className="px-4 py-2 bg-[#a361ef] text-white rounded break-all max-w-[600px] truncate">
            Excel File: {decodeURIComponent(filename)}
          </h1>
        </div>

        <button
          onClick={() => alert("Save clicked!")}
          className="px-4 py-2 bg-[#c92222] text-white rounded hover:bg-red-300"
        >
          Save
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="mb-1 flex flex-wrap gap-4">
        <button
          onClick={() => navigate(`/immersion/production/${filename}`)}
          className={`${baseBtnClass} ${
            isProduction ? btnActiveColor : btnBaseColor
          } ${!isProduction && btnHoverColor}`}
        >
          Production
        </button>
        <button
          onClick={() => navigate(`/immersion/records/${filename}`)}
          className={`${baseBtnClass} ${
            isSupport ? btnActiveColor : btnBaseColor
          } ${!isSupport && btnHoverColor}`}
        >
          Support
        </button>
        <button
          onClick={() => navigate(`/immersion/technical/${filename}`)}
          className={`${baseBtnClass} ${
            isTechnical ? btnActiveColor : btnBaseColor
          } ${!isTechnical && btnHoverColor}`}
        >
          Technical
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-[#1a1a1a] text-white max-w-full overflow-x-auto">
        {filteredRows.length === 0 ? (
          <p className="text-gray-400">No data to display.</p>
        ) : (
          <div className="overflow-auto border border-gray-600 rounded-lg max-h-[600px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className={`${cellStyle} ${headerStyle}`} colSpan={4}>
                    Learners' Name
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} colSpan={2}>
                    General Info
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                    PERFORMANCE APPRAISAL
                    <p className="text-xs">(0 - 5)</p>
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} colSpan={6}>
                    NTOP
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} colSpan={6}>
                    WVS
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} colSpan={2}>
                    ASSESSMENT
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                    TOTAL SCORE
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                    AVERAGE
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                    FINAL GRADE
                  </th>
                  <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                    REMARKS
                  </th>
                </tr>
                <tr>
                  <th className={`${cellStyle} ${headerStyle}`}>No.</th>
                  <th className={`${cellStyle} ${headerStyle}`}>LAST NAME</th>
                  <th className={`${cellStyle} ${headerStyle}`}>FIRST NAME</th>
                  <th className={`${cellStyle} ${headerStyle}`}>MIDDLE NAME</th>
                  <th className={`${cellStyle} ${headerStyle}`}>STRAND</th>
                  <th className={`${cellStyle} ${headerStyle}`}>DEPARTMENT</th>

                  {["WI", "CO", "5S", "BO", "CBO", "SDG"].map((key) => (
                    <th className={`${cellStyle} ${headerStyle}`} key={key}>
                      {key}
                    </th>
                  ))}
                  {["OHSA", "WE", "UJC", "ISO", "PO", "HR"].map((key) => (
                    <th className={`${cellStyle} ${headerStyle}`} key={key}>
                      {key}
                    </th>
                  ))}
                  {["SUPP", "DS"].map((key) => (
                    <th className={`${cellStyle} ${headerStyle}`} key={key}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rowIndex) => {
                  const result = computeResults(row.grades, row.performance);
                  return (
                    <tr
                      key={rowIndex}
                      className={
                        rowIndex % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#3a3a3a]"
                      }
                    >
                      <td className={cellStyle}>{rowIndex + 1}</td>
                      <td className={cellStyle}>{row["LAST NAME"] || ""}</td>
                      <td className={cellStyle}>{row["FIRST NAME"] || ""}</td>
                      <td className={cellStyle}>{row["MIDDLE NAME"] || ""}</td>
                      <td className={cellStyle}>{row["STRAND"] || ""}</td>
                      <td className={cellStyle}>{row["DEPARTMENT"] || ""}</td>
                      <td className={cellStyle}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.performance}
                          onChange={(e) =>
                            handlePerformanceChange(rowIndex, e.target.value)
                          }
                          className="w-full bg-transparent text-white text-center outline-none"
                        />
                      </td>
                      {Object.keys(writtenMaxScores).map((field, i) => (
                        <td key={i} className={cellStyle}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={row.grades[field]}
                            onChange={(e) =>
                              handleGradeChange(rowIndex, field, e.target.value)
                            }
                            className="w-full bg-transparent text-white text-center outline-none"
                          />
                        </td>
                      ))}
                      <td className={cellStyle}>{result.writtenTotal}</td>
                      <td className={cellStyle}>{result.writtenRating}</td>
                      <td className={cellStyle}>{result.finalGrade}</td>
                      <td className={cellStyle}>{result.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

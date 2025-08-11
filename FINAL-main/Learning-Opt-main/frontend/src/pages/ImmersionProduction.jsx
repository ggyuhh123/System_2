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
  WI: 10,
  ELEX: 10,
  CM: 10,
  SPC: 10,
  PROD: 40,
  DS: 10,
};

const PERFORMANCE_SCALE = [
  [0, 60], [1, 75], [1.2, 75],
  [1.4, 75], [1.6, 76], [1.8, 77],
  [1.9, 78], [2, 79], [2.2, 80],
  [2.4, 81], [2.6, 82], [2.8, 83],
  [2.9, 84], [3, 85], [3.2, 86],
  [3.4, 87], [3.6, 88], [3.8, 89],
  [4, 95], [4.2, 96], [4.4, 97],
  [4.6, 98], [4.8, 99], [5, 100]
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
      updated[rowIndex].grades[field] = value;
      return updated;
    });
  };

  const handlePerformanceChange = (rowIndex, value) => {
    if (value === "") {
      setRows((prev) => {
        const updated = [...prev];
        updated[rowIndex].performance = value;
        return updated;
      });
      return;
    }

    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 5) {
      if (/^\d*\.?\d{0,2}$/.test(value)) {
        setRows((prev) => {
          const updated = [...prev];
          updated[rowIndex].performance = value;
          return updated;
        });
      }
    }
  };

  const lookupPerformanceGrade = (value) => {
    const score = parseFloat(value);
    if (isNaN(score)) return 0;
    let matchedGrade = 60;
    for (const [limit, grade] of PERFORMANCE_SCALE) {
      if (score >= limit) {
        matchedGrade = grade;
      } else {
        break;
      }
    }
    return matchedGrade;
  };

  const computeResults = (grades, performanceValue) => {
    const writtenTotal = Object.entries(grades).reduce(
      (sum, [_, val]) => sum + (parseInt(val, 10) || 0),
      0
    );
    const writtenRating = ((writtenTotal / 175) * 50 + 50).toFixed(2);
    const perfRating = lookupPerformanceGrade(performanceValue);
    const finalGrade = (
      parseFloat(writtenRating) * 0.3 +
      parseFloat(perfRating) * 0.7
    ).toFixed(2);
    const remarks = finalGrade < 75 ? "INCOMPLETE" : "PASSED";
    return {
      writtenTotal,
      writtenRating,
      performanceRating: perfRating,
      finalGrade,
      remarks,
    };
  };

 
  const totalColumns =
    1 +   
    6 +   
    6 +   // WVS fields
    6;    // EQUIP + ASSESSMENT fields (WI(EQUIP), ELEX, CM, SPC, PROD, DS)

  // Keyboard navigation handler
  const handleKeyDown = (e, rowIndex, colIndex) => {
    const key = e.key;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

    e.preventDefault();

    let newRow = rowIndex;
    let newCol = colIndex;

    if (key === "ArrowUp") newRow = Math.max(0, rowIndex - 1);
    if (key === "ArrowDown") newRow = Math.min(filteredRows.length - 1, rowIndex + 1);
    if (key === "ArrowLeft") newCol = Math.max(0, colIndex - 1);
    if (key === "ArrowRight") newCol = Math.min(totalColumns - 1, colIndex + 1);

    const targetId = `cell-${newRow}-${newCol}`;
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
    }
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

                {/* New NTOP Column */}
                <th className={`${cellStyle} ${headerStyle}`} colSpan={6}>
                  NTOP
                </th>

                {/* New WVS Column */}
                <th className={`${cellStyle} ${headerStyle}`} colSpan={6}>
                  WVS
                </th>

                {/* Existing Columns */}
                <th className={`${cellStyle} ${headerStyle}`} colSpan={4}>
                  EQUIP
                </th>
                <th className={`${cellStyle} ${headerStyle}`} colSpan={2}>
                  ASSESSMENT
                </th>
                <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                  TOTAL SCORE
                </th>
                <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                  WRITTEN WORKS
                </th>
                <th className={`${cellStyle} ${headerStyle}`} rowSpan={2}>
                  PERFORMANCE TASK
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

                {/* NTOP sub-columns */}
                {["WI", "CO", "5S", "BO", "CBO", "SDG"].map((key) => (
                  <th className={`${cellStyle} ${headerStyle}`} key={key}>
                    {key}
                  </th>
                ))}

                {/* WVS sub-columns */}
                {["OHSA", "WE", "UJC", "ISO", "PO", "HR"].map((key) => (
                  <th className={`${cellStyle} ${headerStyle}`} key={key}>
                    {key}
                  </th>
                ))}

                {/* Existing EQUIP sub-columns */}
                {["WI (EQUIP)", "ELEX", "CM", "SPC"].map((key) => (
                  <th className={`${cellStyle} ${headerStyle}`} key={key}>
                    {key}
                  </th>
                ))}
                {["PROD", "DS"].map((key) => (
                  <th className={`${cellStyle} ${headerStyle}`} key={key}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

              <tbody>
                {filteredRows.map((row, filteredIndex) => {
                  const rowIndex = rows.findIndex((r) => r === row);
                  const result = computeResults(row.grades, row.performance);

                  return (
                    <tr
                      key={filteredIndex}
                      className={filteredIndex % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#3a3a3a]"}
                    >
                      <td className={cellStyle}>{filteredIndex + 1}</td>
                      <td className={cellStyle}>{row["LAST NAME"] || ""}</td>
                      <td className={cellStyle}>{row["FIRST NAME"] || ""}</td>
                      <td className={cellStyle}>{row["MIDDLE NAME"] || ""}</td>
                      <td className={cellStyle}>{row["STRAND"] || ""}</td>
                      <td className={cellStyle}>{row["DEPARTMENT"] || ""}</td>

                      <td className={cellStyle}>
                        <input
                          id={`cell-${filteredIndex}-0`}
                          type="text"
                          inputMode="decimal"
                          value={row.performance}
                          onChange={(e) =>
                            handlePerformanceChange(rowIndex, e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, filteredIndex, 0)
                          }
                          className="w-full bg-transparent text-white text-center outline-none"
                          tabIndex={0}
                        />
                      </td>

                      {/* NTOP fields */}
                      {["WI", "CO", "5S", "BO", "CBO", "SDG"].map((field, i) => (
                        <td key={`ntop-${i}`} className={cellStyle}>
                          <input
                            id={`cell-${filteredIndex}-${1 + i}`}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={row.grades[field]}
                            onChange={(e) =>
                              handleGradeChange(rowIndex, field, e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, filteredIndex, 1 + i)
                            }
                            className="w-full bg-transparent text-white text-center outline-none"
                            tabIndex={0}
                          />
                        </td>
                      ))}

                      {/* WVS fields */}
                      {["OHSA", "WE", "UJC", "ISO", "PO", "HR"].map((field, i) => (
                        <td key={`wvs-${i}`} className={cellStyle}>
                          <input
                            id={`cell-${filteredIndex}-${7 + i}`}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={row.grades[field]}
                            onChange={(e) =>
                              handleGradeChange(rowIndex, field, e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, filteredIndex, 7 + i)
                            }
                            className="w-full bg-transparent text-white text-center outline-none"
                            tabIndex={0}
                          />
                        </td>
                      ))}

                      {/* EQUIP + ASSESSMENT fields */}
                      {["WI (EQUIP)", "ELEX", "CM", "SPC", "PROD", "DS"].map(
                        (field, i) => (
                          <td key={`equip-${i}`} className={cellStyle}>
                            <input
                              id={`cell-${filteredIndex}-${13 + i}`}
                              type="text"
                              inputMode="numeric"
                              pattern="\d*"
                              value={row.grades[field]}
                              onChange={(e) =>
                                handleGradeChange(rowIndex, field, e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleKeyDown(e, filteredIndex, 13 + i)
                              }
                              className="w-full bg-transparent text-white text-center outline-none"
                              tabIndex={0}
                            />
                          </td>
                        )
                      )}

                      <td className={cellStyle}>{result.writtenTotal}</td>
                      <td className={cellStyle}>{result.writtenRating}</td>
                      <td className={cellStyle}>{result.performanceRating}</td>
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

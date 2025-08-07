import os
from flask import Blueprint, request, send_file, jsonify
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
from copy import copy
from io import BytesIO

immersion_bp = Blueprint('immersion', __name__)

# Resolve absolute path to Grades.xlsx template
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TEMPLATE_PATH = os.path.join(basedir, "uploads", "templates", "Grades.xlsx")
print("Resolved TEMPLATE_PATH:", TEMPLATE_PATH)
print("Exists?", os.path.exists(TEMPLATE_PATH))


@immersion_bp.route("/fill-template", methods=["POST"])
def fill_template():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        print("[1] Loading uploaded file...")
        file.stream.seek(0)
        wb_uploaded = load_workbook(file.stream)
        ws_uploaded = wb_uploaded.active

        print("[2] Extracting data from uploaded file...")
        data = []
        for row in ws_uploaded.iter_rows(min_row=2, values_only=True):
            if not any(row):
                continue
            data.append({
                "Last Name": row[0] if len(row) > 0 else "",
                "First Name": row[1] if len(row) > 1 else "",
                "Middle Name": row[2] if len(row) > 2 else "",
                "Strand": row[3] if len(row) > 3 else "",
                "Department": row[4] if len(row) > 4 else "",
            })

        print("[3] Checking template path:", TEMPLATE_PATH)
        if not os.path.exists(TEMPLATE_PATH):
            return jsonify({"error": f"Template not found at {TEMPLATE_PATH}"}), 500

        print("[4] Loading template file...")
        wb_template = load_workbook(TEMPLATE_PATH)
        ws_template = wb_template.active

        start_row = 10
        max_columns = 10  # Extend formatting for A–J

        print(f"[5] Writing {len(data)} rows starting from row {start_row}")

        # Determine last preformatted row by checking where styles are still applied
        preformatted_rows = [
            row for row in range(start_row, ws_template.max_row + 1)
            if ws_template.cell(row=row, column=2).value or ws_template.cell(row=row, column=2).has_style
        ]
        template_rows = len(preformatted_rows)
        extra_rows_needed = len(data) - template_rows

        if extra_rows_needed > 0:
            last_template_row = preformatted_rows[-1]

            for i in range(1, extra_rows_needed + 1):
                source_row_idx = last_template_row
                target_row_idx = last_template_row + i

                for col in range(1, max_columns + 1):
                    source_cell = ws_template.cell(row=source_row_idx, column=col)
                    target_cell = ws_template.cell(row=target_row_idx, column=col)

                    if source_cell.has_style:
                        target_cell.font = copy(source_cell.font)
                        target_cell.border = copy(source_cell.border)
                        target_cell.fill = copy(source_cell.fill)
                        target_cell.number_format = copy(source_cell.number_format)
                        target_cell.protection = copy(source_cell.protection)
                        target_cell.alignment = copy(source_cell.alignment)

        # Fill in the data (now that formatting is extended)
        for idx, entry in enumerate(data):
            row = start_row + idx
            ws_template.cell(row=row, column=1, value=idx + 1)               # #
            ws_template.cell(row=row, column=2, value=entry["Last Name"])    # B
            ws_template.cell(row=row, column=3, value=entry["First Name"])   # C
            ws_template.cell(row=row, column=4, value=entry["Middle Name"])  # D
            ws_template.cell(row=row, column=5, value=entry["Strand"])       # E
            ws_template.cell(row=row, column=6, value=entry["Department"])   # F

        # Auto-adjust column widths A–F
        for col in range(1, 7):
            max_length = 0
            col_letter = get_column_letter(col)
            for row in range(start_row, start_row + len(data)):
                cell = ws_template.cell(row=row, column=col)
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            ws_template.column_dimensions[col_letter].width = max_length + 2

        print("[6] Saving to memory...")
        output = BytesIO()
        wb_template.save(output)
        output.seek(0)

        print("[7] Sending file back...")
        return send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="TESDA_Filled_Template.xlsx"
        )

    except Exception as e:
        print("[ERROR] Exception occurred:")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

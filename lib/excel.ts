import * as XLSX from "xlsx";
import dayjs from "dayjs";

export function exportExcel(rows: Record<string, unknown>[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
}

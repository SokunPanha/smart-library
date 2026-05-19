import * as XLSX from "xlsx";
import dayjs from "dayjs";

export function exportExcel(rows: Record<string, unknown>[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
}

export const BOOK_IMPORT_COLUMNS = [
  "Title (KH)",
  "Title (EN)",
  "Author",
  "Publisher",
  "Year",
  "Category",
  "ISBN",
  "Dewey Code",
  "Total Copies",
  "Tags (comma-separated)",
] as const;

export function downloadBookTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([[...BOOK_IMPORT_COLUMNS]]);
  // Set column widths for readability
  ws["!cols"] = BOOK_IMPORT_COLUMNS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Books");
  XLSX.writeFile(wb, "book-import-template.xlsx");
}

export type BookImportRow = {
  titleKh: string | null;
  titleEn: string | null;
  author: string | null;
  publisher: string | null;
  publishYear: number | null;
  category: string | null;
  isbn: string | null;
  deweyCode: string | null;
  totalCopies: number;
  tags: string[];
  _row: number;
  _error: string | null;
};

export function parseBookImportFile(file: File): Promise<BookImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        const rows: BookImportRow[] = raw.map((r, i) => {
          const get = (key: string) => {
            const val = r[key];
            return val != null && String(val).trim() !== "" ? String(val).trim() : null;
          };

          const titleKh = get("Title (KH)");
          const titleEn = get("Title (EN)");
          const copiesRaw = get("Total Copies");
          const totalCopies = copiesRaw ? Math.max(1, Math.floor(Number(copiesRaw))) : 1;
          const tagsRaw = get("Tags (comma-separated)");
          const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
          const yearRaw = get("Year");
          const publishYear = yearRaw ? (isNaN(Number(yearRaw)) ? null : Number(yearRaw)) : null;

          const error = !titleKh && !titleEn ? "Title (KH) or Title (EN) is required" : null;

          return {
            titleKh,
            titleEn,
            author: get("Author"),
            publisher: get("Publisher"),
            publishYear,
            category: get("Category"),
            isbn: get("ISBN"),
            deweyCode: get("Dewey Code"),
            totalCopies: isNaN(totalCopies) ? 1 : totalCopies,
            tags,
            _row: i + 2,
            _error: error,
          };
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

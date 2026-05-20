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

export const BOOK_IMPORT_COLUMNS_KH = [
  "ចំណងជើង (ខ្មែរ)",
  "ចំណងជើង (អង់គ្លេស)",
  "អ្នកនិពន្ធ",
  "អ្នកបោះពុម្ព",
  "ឆ្នាំ",
  "ប្រភេទ",
  "ISBN",
  "លេខ Dewey",
  "ចំនួនច្បាប់",
  "ស្លាក (បំបែកដោយក្បៀស)",
] as const;

export function downloadBookTemplate(locale = "en") {
  const cols = locale === "km" ? [...BOOK_IMPORT_COLUMNS_KH] : [...BOOK_IMPORT_COLUMNS];
  const ws = XLSX.utils.aoa_to_sheet([cols]);
  ws["!cols"] = cols.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Books");
  XLSX.writeFile(wb, "book-import-template.xlsx");
}

export const MEMBER_IMPORT_COLUMNS = [
  "Name (KH)",
  "Name (EN)",
  "Member ID",
  "Type (STUDENT/TEACHER/PUBLIC/RESEARCHER)",
  "Class",
  "Phone",
  "Email",
  "Expires At (YYYY-MM-DD)",
] as const;

export const MEMBER_IMPORT_COLUMNS_KH = [
  "ឈ្មោះ (ខ្មែរ)",
  "ឈ្មោះ (អង់គ្លេស)",
  "លេខសម្គាល់",
  "ប្រភេទ (STUDENT/TEACHER/PUBLIC/RESEARCHER)",
  "ថ្នាក់",
  "ទូរស័ព្ទ",
  "អ៊ីមែល",
  "ផុតកំណត់ (YYYY-MM-DD)",
] as const;

export function downloadMemberTemplate(locale = "en") {
  const cols = locale === "km" ? [...MEMBER_IMPORT_COLUMNS_KH] : [...MEMBER_IMPORT_COLUMNS];
  const ws = XLSX.utils.aoa_to_sheet([cols]);
  ws["!cols"] = cols.map(() => ({ wch: 26 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Members");
  XLSX.writeFile(wb, "member-import-template.xlsx");
}

export type MemberImportRow = {
  nameKh: string | null;
  nameEn: string | null;
  memberId: string | null;
  type: "STUDENT" | "TEACHER" | "PUBLIC" | "RESEARCHER";
  className: string | null;
  phone: string | null;
  email: string | null;
  expiresAt: string | null;
  _row: number;
  _error: string | null;
};

const VALID_TYPES = new Set(["STUDENT", "TEACHER", "PUBLIC", "RESEARCHER"]);

export function parseMemberImportFile(file: File): Promise<MemberImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        const rows: MemberImportRow[] = raw.map((r, i) => {
          const get = (...keys: string[]) => {
            for (const key of keys) {
              const val = r[key];
              if (val != null && String(val).trim() !== "") return String(val).trim();
            }
            return null;
          };

          const nameKh = get("Name (KH)", "ឈ្មោះ (ខ្មែរ)");
          const nameEn = get("Name (EN)", "ឈ្មោះ (អង់គ្លេស)");
          const typeRaw = (get("Type (STUDENT/TEACHER/PUBLIC/RESEARCHER)", "ប្រភេទ (STUDENT/TEACHER/PUBLIC/RESEARCHER)") ?? "STUDENT").toUpperCase();
          const type = VALID_TYPES.has(typeRaw) ? (typeRaw as MemberImportRow["type"]) : "STUDENT";

          const expiresRaw = get("Expires At (YYYY-MM-DD)", "ផុតកំណត់ (YYYY-MM-DD)");
          let expiresAt: string | null = null;
          if (expiresRaw) {
            const d = new Date(expiresRaw);
            expiresAt = isNaN(d.getTime()) ? null : d.toISOString();
          }

          const error = !nameKh && !nameEn ? "Name (KH) or Name (EN) is required" : null;

          return {
            nameKh,
            nameEn,
            memberId: get("Member ID", "លេខសម្គាល់"),
            type,
            className: get("Class", "ថ្នាក់"),
            phone: get("Phone", "ទូរស័ព្ទ"),
            email: get("Email", "អ៊ីមែល"),
            expiresAt,
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
          const get = (...keys: string[]) => {
            for (const key of keys) {
              const val = r[key];
              if (val != null && String(val).trim() !== "") return String(val).trim();
            }
            return null;
          };

          const titleKh = get("Title (KH)", "ចំណងជើង (ខ្មែរ)");
          const titleEn = get("Title (EN)", "ចំណងជើង (អង់គ្លេស)");
          const copiesRaw = get("Total Copies", "ចំនួនច្បាប់");
          const totalCopies = copiesRaw ? Math.max(1, Math.floor(Number(copiesRaw))) : 1;
          const tagsRaw = get("Tags (comma-separated)", "ស្លាក (បំបែកដោយក្បៀស)");
          const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
          const yearRaw = get("Year", "ឆ្នាំ");
          const publishYear = yearRaw ? (isNaN(Number(yearRaw)) ? null : Number(yearRaw)) : null;

          const error = !titleKh && !titleEn ? "Title (KH) or Title (EN) is required" : null;

          return {
            titleKh,
            titleEn,
            author: get("Author", "អ្នកនិពន្ធ"),
            publisher: get("Publisher", "អ្នកបោះពុម្ព"),
            publishYear,
            category: get("Category", "ប្រភេទ"),
            isbn: get("ISBN"),
            deweyCode: get("Dewey Code", "លេខ Dewey"),
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

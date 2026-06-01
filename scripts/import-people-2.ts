import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { config } from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EXCEL_PATH = path.resolve(__dirname, "../imports/people-2.xlsx");

type ExcelRow = Record<string, string | number | null>;

const COLUMN_MAP: Record<string, string> = {
  الاسم: "full_name",
  أرضي: "phone_landline",
  مخدوم: "phone_primary",
  الأب: "phone_father",
  الأم: "phone_mother",
  عمارة: "address_building",
  الشارع: "address_street",
  المنطقة: "address_area",
  الدور: "address_floor",
  الشقة: "address_apartment",
  "أقرب مكان": "address_landmark",
  Location: "google_maps_link",
  "أب\n الاعتراف": "church_confession_father",
  "كاهن\n الأسرة": "church_family_servant",
  الكلية: "education_college",
  "ملاحظات - اعدادي": "notes_public",
  "ملاحظات - ثانوي": "notes_private",
};

const PHONE_FIELDS = [
  "phone_primary",
  "phone_secondary",
  "phone_father",
  "phone_mother",
];

function cleanPhone(value: string | number | null): string | null {
  if (value == null) return null;
  const cleaned = String(value)
    .replace(/[\r\n]+/g, ", ")
    .trim();
  if (!cleaned) return null;
  return cleaned.startsWith("0") ? cleaned : `0${cleaned}`;
}

function buildBirthDate(row: ExcelRow): string | null {
  const y = row["Y"];
  const m = row["M"];
  const d = row["D"];
  if (!y) return null;
  const yearNum = parseInt(String(y), 10);
  const year =
    yearNum < 1000 ? `2${String(yearNum).padStart(3, "0")}` : String(yearNum);
  const month = String(m || 1).padStart(2, "0");
  const day = String(d || 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toText(value: string | number | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function mapRow(row: ExcelRow): Record<string, string | null> {
  const record: Record<string, string | null> = {};

  for (const [excelCol, dbCol] of Object.entries(COLUMN_MAP)) {
    const value = row[excelCol] ?? null;
    if (PHONE_FIELDS.includes(dbCol)) {
      record[dbCol] = cleanPhone(value);
    } else {
      record[dbCol] = toText(value);
    }
  }

  record.birth_date = buildBirthDate(row);
  record.church_family_group = "1";
  record.education_year = "1";
  record.church_family_servant = null;
  record.gender = "F";
  if (record.full_name) {
    record.full_name = record.full_name.replace(/✅/g, "").trim();
  }

  return record;
}

async function main() {
  console.log(`Reading ${EXCEL_PATH}...`);

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });

  console.log(`Found ${rows.length} rows in sheet "${sheetName}"`);

  const records: Record<string, string | null>[] = [];
  let skipped = 0;

  for (const row of rows) {
    const fullName = row["الاسم"];
    if (!fullName || String(fullName).trim() === "") {
      skipped++;
      continue;
    }
    records.push(mapRow(row));
  }

  console.log(
    `Mapped ${records.length} records (skipped ${skipped} without الاسم)`,
  );

  if (records.length === 0) {
    console.log("Nothing to insert.");
    return;
  }

  const BATCH_SIZE = 100;
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    for (const record of batch) {
      // Check if person with same full_name exists
      const { data: existing } = await supabase
        .from("people")
        .select("id")
        .eq("full_name", record.full_name!)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("people")
          .update(record)
          .eq("id", existing.id);

        if (error) {
          console.error(
            `Update failed for "${record.full_name}":`,
            error.message,
          );
          failed++;
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase.from("people").insert(record);

        if (error) {
          console.error(
            `Insert failed for "${record.full_name}":`,
            error.message,
          );
          failed++;
        } else {
          inserted++;
        }
      }
    }

    console.log(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${batch.length} rows`,
    );
  }

  console.log("\n--- Import Complete ---");
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated:  ${updated}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Total:    ${rows.length}`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

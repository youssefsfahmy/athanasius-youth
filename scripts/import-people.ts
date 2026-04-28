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

const EXCEL_PATH = path.resolve(__dirname, "../imports/people.xlsx");

type ExcelRow = Record<string, string | number | null>;

const COLUMN_MAP: Record<string, string> = {
  "Full Name": "full_name",
  Landline: "phone_landline",
  mobile: "phone_primary",
  "MOB 2": "phone_secondary",
  "Father MOB": "phone_father",
  "Mother MOB": "phone_mother",
  "Male/Female": "gender",
  المنطقه: "address_area",
  عماره: "address_building",
  الشارع: "address_street",
  العنوان: "address_details",
  الدور: "address_floor",
  الشقة: "address_apartment",
  "وصف لمكان البيت": "address_landmark",
  كلية: "education_college",
  جامعة: "education_university",
  "Edu. Year": "education_year",
  "أب الاعتراف": "church_confession_father",
  "Family 24/25": "church_family_group",
  "خادم الFamily 24/25": "church_family_servant",
  "امتي اخر افتقاد للشاب": "church_last_checkup_date",
  "Facebook Account": "social_facebook_url",
  Notes: "notes_public",
  "Notes Can't Print": "notes_private",
  image: "image_url",
};

const PHONE_FIELDS = [
  "phone_primary",
  "phone_secondary",
  "phone_landline",
  "phone_father",
  "phone_mother",
];

function cleanPhone(value: string | number | null): string | null {
  if (value == null) return null;
  return (
    String(value)
      .replace(/[\r\n]+/g, ", ")
      .trim() || null
  );
}

function buildBirthDate(row: ExcelRow): string | null {
  const y = row["Y"];
  const m = row["M"];
  const d = row["D"];
  if (!y) return null;
  const year = String(y).padStart(4, "0");
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
    const fullName = row["Full Name"];
    if (!fullName || String(fullName).trim() === "") {
      skipped++;
      continue;
    }
    records.push(mapRow(row));
  }

  console.log(
    `Mapped ${records.length} records (skipped ${skipped} without Full Name)`,
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

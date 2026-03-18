"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button, Badge } from "@repo/ui";
import { useLanguage } from "../../../../../../components/LanguageProvider";
import { bulkImportInventory } from "../../../../../actions/inventory";

const LABELS = {
  ar: {
    title: "استيراد المخزون",
    back: "عودة",
    step1: "رفع الملف",
    step2: "معاينة",
    step3: "تأكيد",
    upload: "رفع ملف CSV",
    dragDrop: "اسحب وأفلت ملف CSV هنا أو انقر للاختيار",
    preview: "معاينة البيانات",
    confirm: "تأكيد الاستيراد",
    importing: "جاري الاستيراد...",
    results: "النتائج",
    imported: "تم الاستيراد",
    errors: "أخطاء",
    row: "الصف",
    error: "الخطأ",
    downloadTemplate: "تحميل القالب",
    noData: "لا توجد بيانات",
  },
  en: {
    title: "Bulk Import Inventory",
    back: "Back",
    step1: "Upload",
    step2: "Preview",
    step3: "Confirm",
    upload: "Upload CSV File",
    dragDrop: "Drag & drop a CSV file here or click to select",
    preview: "Preview Data",
    confirm: "Confirm Import",
    importing: "Importing...",
    results: "Results",
    imported: "Imported",
    errors: "Errors",
    row: "Row",
    error: "Error",
    downloadTemplate: "Download Template",
    noData: "No data",
  },
};

const CSV_HEADERS = "itemNumber,productType,productLabel,areaSqm,basePriceSar,channel";

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export default function InventoryImportPage() {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [step, setStep] = React.useState(1);
  const [rows, setRows] = React.useState<any[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [results, setResults] = React.useState<{ imported: number; errors: any[] } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_HEADERS + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const items = rows.map((r) => ({
        itemNumber: r.itemNumber ?? "",
        productType: r.productType ?? "",
        productLabel: r.productLabel,
        areaSqm: r.areaSqm ? Number(r.areaSqm) : undefined,
        basePriceSar: r.basePriceSar ? Number(r.basePriceSar) : undefined,
        channel: r.channel || undefined,
      }));
      const result = await bulkImportInventory(projectId, items);
      setResults(result);
      setStep(3);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}`)} style={{ display: "inline-flex" }}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4">
        {[t.step1, t.step2, t.step3].map((label, i) => (
          <div key={i} className={`flex items-center gap-2 ${step > i + 1 ? "text-green-600" : step === i + 1 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step > i + 1 ? "bg-green-100 text-green-800" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className="text-sm">{label}</span>
            {i < 2 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.dragDrop}</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
          <Button variant="ghost" onClick={handleDownloadTemplate} style={{ display: "inline-flex" }}>
            {t.downloadTemplate}
          </Button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">{t.noData}</p>
          ) : (
            <>
              <div className="rounded-lg border overflow-auto max-h-[400px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-start">#</th>
                      {Object.keys(rows[0]!).map((h) => (
                        <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-1.5">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} style={{ display: "inline-flex" }}>
                  {t.back}
                </Button>
                <Button onClick={handleImport} disabled={importing} style={{ display: "inline-flex" }}>
                  {importing ? t.importing : `${t.confirm} (${rows.length})`}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && results && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="rounded-lg border p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{results.imported}</p>
                <p className="text-xs text-muted-foreground">{t.imported}</p>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 p-4 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
                  <p className="text-xs text-muted-foreground">{t.errors}</p>
                </div>
              </div>
            )}
          </div>

          {results.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-50 dark:bg-red-950/20">
                    <th className="px-4 py-2 text-start font-medium">{t.row}</th>
                    <th className="px-4 py-2 text-start font-medium">{t.error}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.errors.map((e: any, i: number) => (
                    <tr key={i} className="border-t border-red-100">
                      <td className="px-4 py-2">{e.row}</td>
                      <td className="px-4 py-2 text-red-600">{e.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button onClick={() => router.push(`/dashboard/projects/${projectId}`)} style={{ display: "inline-flex" }}>
            {t.back}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import {
  FileText as FilePdf,
  Image as FileImage,
  FileText,
  CloudUpload,
  Download,
  Trash2,
  MoreVertical,
  SquareDashedMousePointer,
  Search,
  Loader2
} from "lucide-react";
import { Button, Input, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { getDocuments, registerFileInDb } from "../../actions/documents";
import { UploadButton } from "../../../lib/uploadthing";
import { exportToExcel } from "../../../lib/export";

export default function DocumentVaultPage() {
  const { lang } = useLanguage();
  const [docs, setDocs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");

  React.useEffect(() => {
    async function loadDocs() {
      try {
        const data = await getDocuments();
        setDocs(data);
      } catch (err) {
        console.error("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  const handleUploadComplete = async (res: any) => {
    setUploadError(null);
    try {
      // res is an array of uploaded files
      for (const file of res) {
        await registerFileInDb({
          name: file.name,
          url: file.url,
          type: file.name.split('.').pop() || "unknown",
          category: "GENERAL"
        });
      }
      // Refresh list
      const updatedData = await getDocuments();
      setDocs(updatedData);
    } catch (err) {
      setUploadError(lang === "ar" ? "فشل تسجيل الوثيقة" : "Failed to register document");
    }
  };

  const handleExportDocuments = async () => {
    setExporting(true);
    try {
    exportToExcel({
      data: docs,
      columns: [
        { header: lang === "ar" ? "اسم الوثيقة" : "Document Name", key: "name", width: 35 },
        { header: lang === "ar" ? "التصنيف" : "Category", key: "category", width: 20 },
        { header: lang === "ar" ? "النوع" : "Type", key: "type", width: 15 },
        { header: lang === "ar" ? "تاريخ الرفع" : "Uploaded Date", key: "createdAt", width: 20, render: (val: any) => val ? new Date(val).toLocaleDateString("en-CA") : "" },
        { header: lang === "ar" ? "رفع بواسطة" : "Uploaded By", key: "uploadedBy", width: 25, render: (val: any) => val?.name ?? val ?? "" },
      ],
      filename: lang === "ar" ? "سجل_الوثائق" : "documents_list",
      lang,
      title: lang === "ar" ? "سجل الوثائق — ميماريك" : "Document List — Mimaric",
    });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "خزنة الوثائق" : "Document Vault"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "إدارة وتخزين كافة الوثائق الهندسية والقانونية للمشاريع." : "Manage and store all engineering and legal project documents."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" style={{ display: "inline-flex" }} onClick={handleExportDocuments} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? (lang === "ar" ? "جاري التصدير..." : "Exporting...") : (lang === "ar" ? "تصدير القائمة" : "Export List")}
          </Button>
          <UploadButton
            endpoint="blueprintUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => setUploadError(lang === "ar" ? `خطأ في الرفع: ${error.message}` : `Upload error: ${error.message}`)}
            appearance={{
              button: "bg-secondary hover:bg-green-bright text-white text-sm font-bold gap-2 flex h-9 px-4 rounded-md",
              allowedContent: "hidden"
            }}
            content={{
              button: (
                <div className="flex items-center gap-2">
                  <CloudUpload className="h-[18px] w-[18px]" />
                  {lang === "ar" ? "رفع وثيقة" : "Upload Document"}
                </div>
              )
            }}
          />
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{uploadError}</p>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">
            {lang === "ar" ? "إغلاق" : "Dismiss"}
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-card rounded-md border border-border p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 font-latin">{lang === "ar" ? "التصنيفات" : "Categories"}</h3>
              <div className="space-y-1">
                 {[
                   { id: "all", label: { ar: "جميع الوثائق", en: "All Documents" } },
                   { id: "BLUEPRINT", label: { ar: "مخططات", en: "Blueprints" } },
                   { id: "LEGAL", label: { ar: "تصاريح قانونية", en: "Legal Permits" } },
                   { id: "STRUCTURAL", label: { ar: "مخططات إنشائية", en: "Structural Plans" } },
                   { id: "COMMERCIAL", label: { ar: "تجاري", en: "Commercial" } },
                   { id: "MARKETING", label: { ar: "تسويق", en: "Marketing" } },
                   { id: "GENERAL", label: { ar: "عام", en: "General" } },
                 ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "w-full text-start px-3 py-2 text-sm rounded-md transition-colors",
                        activeCategory === cat.id
                          ? "bg-secondary/10 text-secondary font-bold"
                          : "text-muted-foreground hover:bg-muted hover:text-primary"
                      )}
                    >
                       {cat.label[lang]}
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="bg-primary-deep p-6 rounded-md text-white shadow-lg overflow-hidden relative">
              <FilePdf className="h-12 w-12 absolute -bottom-4 -right-4 opacity-10 rotate-12" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary font-latin">Storage Usage</p>
              <div className="mt-4 space-y-2">
                 <div className="h-1.5 w-full bg-card/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-3/4 rounded-full" />
                 </div>
                 <p className="text-[10px] text-white/50 text-end font-latin">7.2 GB / 10 GB</p>
              </div>
           </div>
        </div>

        {/* Document Grid */}
        <div className="lg:col-span-3 space-y-6">
           {/* Filters */}
           <div className="bg-card rounded-md border border-border p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
             <div className="relative w-full md:w-80 group">
                <Search className="h-[18px] w-[18px] absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                <input 
                  type="text" 
                  placeholder={lang === "ar" ? "بحث في الوثائق..." : "Search documents..."}
                  className="w-full bg-muted/30 border-transparent rounded py-2 pr-10 pl-4 text-sm outline-none focus:bg-card focus:border-border transition-all"
                />
             </div>
             <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                   <SquareDashedMousePointer className="h-[18px] w-[18px]" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Badge variant="available" className="bg-secondary/5 text-secondary border-none">Recent</Badge>
             </div>
           </div>

           {/* Files Grid */}
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className="bg-card rounded-md border border-border p-5 animate-pulse">
                   <div className="flex items-start justify-between mb-4">
                     <div className="h-12 w-12 rounded bg-muted" />
                     <div className="h-5 w-5 rounded bg-muted" />
                   </div>
                   <div className="space-y-2">
                     <div className="h-4 bg-muted rounded w-3/4" />
                     <div className="h-3 bg-muted rounded w-1/3" />
                   </div>
                   <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                     <div className="h-4 bg-muted rounded w-16" />
                     <div className="h-8 w-8 rounded-full bg-muted" />
                   </div>
                 </div>
               ))}
             </div>
           ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {docs.filter((doc) => activeCategory === "all" || doc.category === activeCategory).length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  <CloudUpload className="h-12 w-12 mx-auto opacity-20 mb-4" />
                  <p>{lang === "ar" ? "لا توجد وثائق حالياً. ابدأ برفع أول وثيقة." : "No documents yet. Start by uploading one."}</p>
                </div>
              )}
              {docs.filter((doc) => activeCategory === "all" || doc.category === activeCategory).map((doc) => (
                <div key={doc.id} className="bg-card rounded-md border border-border p-5 hover:shadow-md transition-all group relative border-b-4 border-b-transparent hover:border-b-secondary">
                   <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "h-12 w-12 rounded flex items-center justify-center",
                        ['pdf'].includes(doc.type?.toLowerCase()) ? "bg-red-50 text-red-500" : ['jpg', 'png', 'jpeg'].includes(doc.type?.toLowerCase()) ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500"
                      )}>
                         {['pdf'].includes(doc.type?.toLowerCase()) ? <FilePdf className="h-7 w-7" /> : ['jpg', 'png', 'jpeg'].includes(doc.type?.toLowerCase()) ? <FileImage className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
                      </div>
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                         <MoreVertical className="h-5 w-5" />
                      </button>
                   </div>
                   
                   <div className="space-y-1">
                      <h4 className="text-sm font-bold text-primary truncate">{doc.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-latin">{new Date(doc.createdAt).toLocaleDateString()}</p>
                   </div>

                   <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <Badge variant="available" className="text-[9px] bg-muted text-muted-foreground border-none">{doc.category}</Badge>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-secondary transition-all">
                         <Download className="h-[18px] w-[18px]" />
                      </a>
                   </div>
                </div>
              ))}
           </div>
           )}
        </div>
      </div>
    </div>
  );
}

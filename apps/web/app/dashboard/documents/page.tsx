"use client";

import { useLanguage } from "../../../components/LanguageProvider";
import * as React from "react";
import { 
  FilePdf, 
  FileImage, 
  FileText, 
  FolderSimplePlus, 
  CloudArrowUp,
  DownloadSimple,
  Trash,
  DotsThreeVertical,
  Selection,
  MagnifyingGlass,
  Spinner
} from "@phosphor-icons/react";
import { Button, Input, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { getDocuments, registerFileInDb } from "../../actions/documents";
import { UploadButton } from "../../../lib/uploadthing";

export default function DocumentVaultPage() {
  const { lang } = useLanguage();
  const [docs, setDocs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

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
      alert("Failed to register document");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "خزنة الوثائق" : "Document Vault"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "إدارة وتخزين كافة الوثائق الهندسية والقانونية للمشاريع." : "Manage and store all engineering and legal project documents."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UploadButton
            endpoint="blueprintUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => alert(`ERROR! ${error.message}`)}
            appearance={{
              button: "bg-secondary hover:bg-green-bright text-white text-sm font-bold gap-2 flex h-9 px-4 rounded-md",
              allowedContent: "hidden"
            }}
            content={{
              button: (
                <div className="flex items-center gap-2">
                  <CloudArrowUp size={18} weight="fill" />
                  {lang === "ar" ? "رفع وثيقة" : "Upload Document"}
                </div>
              )
            }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-card rounded-md border border-border p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 font-latin">Categories</h3>
              <div className="space-y-1">
                 {['All Documents', 'Blueprints', 'Legal Permits', 'Structural Plans', 'Commercial', 'Marketing'].map((cat) => (
                    <button key={cat} className="w-full text-start px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors font-primary text-neutral hover:text-primary">
                       {cat}
                    </button>
                 ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4 gap-2 text-secondary hover:bg-secondary/5 border-dashed border border-secondary/20">
                 <FolderSimplePlus size={16} />
                 {lang === "ar" ? "مجلد جديد" : "New Folder"}
              </Button>
           </div>
           
           <div className="bg-primary-deep p-6 rounded-md text-white shadow-lg overflow-hidden relative">
              <FilePdf size={48} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
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
                <MagnifyingGlass size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral group-focus-within:text-secondary transition-colors" />
                <input 
                  type="text" 
                  placeholder={lang === "ar" ? "بحث في الوثائق..." : "Search documents..."}
                  className="w-full bg-muted/30 border-transparent rounded py-2 pr-10 pl-4 text-sm outline-none font-primary focus:bg-card focus:border-border transition-all"
                />
             </div>
             <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                   <Selection size={18} />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Badge variant="available" className="bg-secondary/5 text-secondary border-none">Recent</Badge>
             </div>
           </div>

           {/* Files Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {docs.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center text-neutral">
                  <CloudArrowUp size={48} className="mx-auto opacity-20 mb-4" />
                  <p>{lang === "ar" ? "لا توجد وثائق حالياً. ابدأ برفع أول وثيقة." : "No documents yet. Start by uploading one."}</p>
                </div>
              )}
              {docs.map((doc) => (
                <div key={doc.id} className="bg-card rounded-md border border-border p-5 hover:shadow-md transition-all group relative border-b-4 border-b-transparent hover:border-b-secondary">
                   <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "h-12 w-12 rounded flex items-center justify-center",
                        ['pdf'].includes(doc.type?.toLowerCase()) ? "bg-red-50 text-red-500" : ['jpg', 'png', 'jpeg'].includes(doc.type?.toLowerCase()) ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500"
                      )}>
                         {['pdf'].includes(doc.type?.toLowerCase()) ? <FilePdf size={28} /> : ['jpg', 'png', 'jpeg'].includes(doc.type?.toLowerCase()) ? <FileImage size={28} /> : <FileText size={28} />}
                      </div>
                      <button className="text-neutral hover:text-primary transition-colors">
                         <DotsThreeVertical size={20} />
                      </button>
                   </div>
                   
                   <div className="space-y-1">
                      <h4 className="text-sm font-bold text-primary truncate font-primary">{doc.name}</h4>
                      <p className="text-[10px] text-neutral font-latin">{new Date(doc.createdAt).toLocaleDateString()}</p>
                   </div>

                   <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <Badge variant="available" className="text-[9px] bg-muted text-neutral border-none">{doc.category}</Badge>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-neutral hover:text-secondary transition-all">
                         <DownloadSimple size={18} />
                      </a>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

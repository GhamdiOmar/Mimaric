"use client";

import * as React from "react";
import { 
  Plus, 
  Buildings, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Warehouse,
  Users,
  Spinner
} from "@phosphor-icons/react";
import { Button, Input, Badge } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { createProject } from "../../../actions/projects";
import { useRouter } from "next/navigation";

const steps = [
  { id: "basic", label: { ar: "بيانات المشروع", en: "Project Details" } },
  { id: "physical", label: { ar: "المخطط الإنشائي", en: "Physical Layout" } },
  { id: "commercial", label: { ar: "التسعير والبيع", en: "Pricing & Sales" } },
  { id: "review", label: { ar: "مراجعة واعتماد", en: "Review & Confirm" } },
];

export default function NewProjectPage() {
  const [lang, setLang] = React.useState<"ar" | "en">("ar");
  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    type: "RESIDENTIAL",
    location: ""
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      // organizationId would ideally come from the session on the server
      await createProject({
        ...formData,
        organizationId: "temp-org-id" // This will be handled by the server action using session
      } as any);
      router.push("/dashboard/projects");
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 animate-in fade-in duration-500" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-primary">
            {lang === "ar" ? "إضافة مشروع جديد" : "Add New Project"}
          </h1>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "ابدأ رحلة تطوير عقاري جديدة مع ميماريك." : "Start a new property development journey with Mimaric."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
           {lang === "ar" ? "English" : "العربية"}
        </Button>
      </div>

      {/* Stepper */}
      <div className="relative h-1 bg-border rounded-full mx-10">
         <div 
           className="absolute h-full bg-secondary transition-all duration-500" 
           style={{ width: `${(currentStep / (steps.length - 1)) * 100}%`, right: lang === "ar" ? 0 : 'auto', left: lang === "en" ? 0 : 'auto' }} 
         />
         <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0">
            {steps.map((step, i) => (
              <div key={step.id} className="relative">
                 <div className={cn(
                   "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                   i <= currentStep ? "bg-secondary border-secondary text-white" : "bg-white border-border text-neutral"
                 )}>
                    {i < currentStep ? <CheckCircle size={20} weight="fill" /> : i + 1}
                 </div>
                 <span className={cn(
                   "absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest font-primary",
                   i === currentStep ? "text-primary" : "text-neutral/50"
                 )}>
                    {step.label[lang]}
                 </span>
              </div>
            ))}
         </div>
      </div>

      <div className="pt-10">
        <div className="bg-white rounded-md shadow-card border border-border p-10 min-h-[400px]">
           {currentStep === 0 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-primary">{lang === "ar" ? "اسم المشروع" : "Project Name"}</label>
                      <Input 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={lang === "ar" ? "مثال: مجمع الأرجوان" : "e.g. Al Arjuan Compound"} 
                        className="font-primary" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-primary">{lang === "ar" ? "نوع المشروع" : "Project Type"}</label>
                      <select 
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm outline-none focus:border-secondary transition-all font-primary"
                      >
                         <option value="RESIDENTIAL">{lang === "ar" ? "سكني" : "Residential"}</option>
                         <option value="COMMERCIAL">{lang === "ar" ? "تجاري" : "Commercial"}</option>
                         <option value="MIXED_USE">{lang === "ar" ? "متعدد الاستخدامات" : "Mixed-use"}</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-primary">{lang === "ar" ? "الموقع" : "Location"}</label>
                   <div className="relative">
                      <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                      <Input 
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder={lang === "ar" ? "الرياض، حي الملقا" : "Riyadh, Al Malqa"} 
                        className="pr-10 font-primary" 
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-primary">{lang === "ar" ? "وصف المشروع" : "Description"}</label>
                   <textarea 
                     name="description"
                     value={formData.description}
                     onChange={handleInputChange}
                     className="w-full p-3 bg-white border border-border rounded-md text-sm outline-none focus:border-secondary transition-all font-primary min-h-[120px]" 
                   />
                </div>
             </div>
           )}

           {currentStep === 1 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-primary font-primary">{lang === "ar" ? "قائمة المباني / الأبراج" : "Buildings & Towers"}</h3>
                   <Button variant="secondary" size="sm" className="gap-2">
                      <Plus size={16} />
                      {lang === "ar" ? "إضافة مبنى" : "Add Building"}
                   </Button>
                </div>
                
                <div className="space-y-4">
                   {[1, 2].map(i => (
                     <div key={i} className="flex items-center justify-between p-4 border border-border rounded-md bg-muted/5">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                              <Buildings size={24} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-primary font-primary">{lang === "ar" ? `مبنى ${i === 1 ? 'أ' : 'ب'}` : `Building ${i === 1 ? 'A' : 'B'}`}</p>
                              <p className="text-[10px] text-neutral font-latin">12 Units • Ground + 4 Floors</p>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm">تعديل</Button>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {currentStep > 1 && (
             <div className="flex flex-col items-center justify-center py-20 text-neutral space-y-4">
                <Warehouse size={64} weight="duotone" className="text-secondary opacity-40" />
                <p className="font-primary text-sm">{lang === "ar" ? "سيتم تفعيل هذا القسم قريباً..." : "This section will be active soon..."}</p>
             </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 px-2">
           <Button 
             variant="ghost" 
             onClick={prevStep} 
             disabled={currentStep === 0 || loading}
             className="gap-2"
           >
              {lang === "ar" ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              {lang === "ar" ? "السابق" : "Previous"}
           </Button>
           
           {currentStep === steps.length - 1 ? (
             <Button 
               onClick={handleCreateProject}
               disabled={loading || !formData.name}
               className="gap-2 bg-secondary hover:bg-green-bright transition-colors px-10"
             >
                {loading ? <Spinner className="animate-spin" /> : <CheckCircle size={20} weight="fill" />}
                {lang === "ar" ? "اعتماد المشروع" : "Approve Project"}
             </Button>
           ) : (
             <Button onClick={nextStep} className="gap-2 px-10">
                {lang === "ar" ? "التالي" : "Next"}
                {lang === "ar" ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
             </Button>
           )}
        </div>
      </div>
    </div>
  );
}

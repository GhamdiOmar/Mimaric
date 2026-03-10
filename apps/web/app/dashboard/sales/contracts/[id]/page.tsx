"use client";

import { useLanguage } from "../../../../../components/LanguageProvider";
import * as React from "react";
import { RiyalIcon } from "@repo/ui";
import { 
  FilePdf, 
  Printer, 
  ShareNetwork, 
  CheckCircle, 
  Clock, 
  Warning,
  PencilSimple,
  DownloadSimple,
  ShieldCheck,
  Buildings,
  User,
  CaretRight,
  CaretLeft
} from "@phosphor-icons/react";
import { cn } from "@repo/ui/lib/utils";
import { Button, Badge } from "@repo/ui";
import Link from "next/link";
import { MimaricLogo } from "../../../../../components/brand/MimaricLogo";

export default function ContractPage() {
  const { lang } = useLanguage();
  const [isSigned, setIsSigned] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral">
          <Link href="/dashboard/sales/contracts" className="hover:text-primary transition-colors">
            {lang === "ar" ? "العقود" : "Contracts"}
          </Link>
          <span className="text-border">/</span>
          <span className="text-primary truncate max-w-[150px]">SALE-2026-0042</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2">
            <ShareNetwork size={16} />
            {lang === "ar" ? "مشاركة" : "Share"}
          </Button>
          <Button variant="secondary" size="sm" className="gap-2">
            <DownloadSimple size={16} />
            {lang === "ar" ? "تحميل PDF" : "Download"}
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsSigned(true)} disabled={isSigned}>
            <PencilSimple size={16} />
            {lang === "ar" ? (isSigned ? "تم التوقيع" : "توقيع المستند") : (isSigned ? "Signed" : "Sign Document")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Document Viewer (Paper style) */}
        <div className="xl:col-span-3">
          <div className="bg-card rounded-md shadow-card border border-border min-h-[1000px] p-16 md:p-24 overflow-hidden relative" dir={lang === "ar" ? "rtl" : "ltr"}>
            {/* Header of Contract */}
            <div className="flex justify-between items-start mb-16">
              <div className="flex items-center gap-3">
                <MimaricLogo width={120} />
                <div>
                  <h1 className="text-xl font-bold text-primary tracking-tight">Mimaric PropTech</h1>
                  <p className="text-[10px] text-neutral font-dm-sans leading-none uppercase mt-1">Real Estate Development & Solution</p>
                </div>
              </div>
              <div className="text-end">
                <h2 className="text-2xl font-bold text-primary">{lang === "ar" ? "عقد بيع وحدة عقارية" : "Sales Purchase Agreement"}</h2>
                <p className="text-xs text-neutral mt-1">Ref: SALE-2026-0042</p>
              </div>
            </div>

            {/* Contract Body */}
            <div className="space-y-10 text-sm leading-relaxed text-primary">
              <section>
                <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">{lang === "ar" ? "1. أطراف العقد" : "1. Parties to the Agreement"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start">
                  <div className="space-y-2 p-4 bg-muted/20 rounded border border-muted border-dashed">
                    <p className="text-[10px] font-bold text-neutral uppercase tracking-widest">{lang === "ar" ? "الطرف الأول (البائع)" : "First Party (Seller)"}</p>
                    <p className="font-bold">شركة ميماريك للتطوير العقاري</p>
                    <p className="text-xs text-neutral">CR: 1010XXXXXX | VAT: 3101XXXXXXXXX</p>
                  </div>
                  <div className="space-y-2 p-4 bg-muted/20 rounded border border-muted border-dashed">
                    <p className="text-[10px] font-bold text-neutral uppercase tracking-widest">{lang === "ar" ? "الطرف الثاني (المشتري)" : "Second Party (Buyer)"}</p>
                    <p className="font-bold">محمد بن إبراهيم العتيبي</p>
                    <p className="text-xs text-neutral">ID: 108XXXXXXX | Phone: 050XXXXXXX</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">{lang === "ar" ? "2. موضوع التعاقد" : "2. Subject of Agreement"}</h3>
                <p className="text-justify indent-8">
                  {lang === "ar" 
                    ? "يقر الطرف الأول ببيع الوحدة العقارية رقم (502) الواقعة في (برج الأفق) بمدينة الرياض بمساحة إجمالية قدرها (135) متر مربع للطرف الثاني القابل لذلك وفقاً للمخططات المعتمدة والمواصفات المتفق عليها..." 
                    : "The First Party acknowledges the sale of real estate unit No. (502) located in (Horizon Tower) in the city of Riyadh, with a total area of (135) square meters, to the Second Party, who accepts it, according to the approved plans..."}
                </p>
              </section>

              <section>
                <h3 className="font-bold border-b-2 border-primary/10 pb-2 mb-4 w-fit">{lang === "ar" ? "3. القيمة المالية وطريقة السداد" : "3. Financial Value & Payment"}</h3>
                <p className="mb-4">
                  {lang === "ar" 
                    ? "تم الاتفاق على أن السعر الإجمالي للوحدة هو (950,000) ريال سعودي شاملاً ضريبة التصرفات العقارية..." 
                    : "It has been agreed that the total price of the unit is "}<RiyalIcon size={14} className="inline mr-1"/>{lang === "ar" ? "٩٥٠,٠٠٠ شامل ضريبة التصرفات العقارية..." : "950,000, including Real Estate Transaction Tax..."}
                </p>
                <div className="bg-muted capitalize overflow-x-auto border border-border">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="bg-muted-foreground/5">
                        <th className="px-4 py-3 text-start">{lang === "ar" ? "الدفعة" : "Installment"}</th>
                        <th className="px-4 py-3 text-start">{lang === "ar" ? "النسبة" : "Percentage"}</th>
                        <th className="px-4 py-3 text-start">{lang === "ar" ? "المبلغ" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card">
                      <tr>
                        <td className="px-4 py-3">{lang === "ar" ? "دفعة مقدمة" : "Downpayment"}</td>
                        <td className="px-4 py-3">10%</td>
                        <td className="px-4 py-3 font-bold flex items-center gap-1"><RiyalIcon size={14} /> 95,000</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">{lang === "ar" ? "عند الهيكل الإنشائي" : "Structure Completion"}</td>
                        <td className="px-4 py-3">30%</td>
                        <td className="px-4 py-3 font-bold flex items-center gap-1"><RiyalIcon size={14} /> 285,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Watermark for draft */}
              {!isSigned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-45 select-none">
                  <span className="text-primary font-black text-9xl">DRAFT</span>
                </div>
              )}
            </div>

            {/* Simplified digital signature slot */}
            <div className="mt-24 pt-12 border-t-2 border-primary/5 flex justify-between items-center px-12">
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-neutral uppercase">{lang === "ar" ? "توقيع البائع" : "Seller Signature"}</p>
                <div className="h-16 w-32 border-b-2 border-primary/20 flex items-center justify-center italic text-primary/50 text-xl font-dm-sans">Mimaric CEO</div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-neutral uppercase">{lang === "ar" ? "توقيع المشتري" : "Buyer Signature"}</p>
                <div className={cn(
                  "h-16 w-48 border-b-2 border-primary/20 flex items-center justify-center transition-all",
                  isSigned ? "text-secondary text-2xl font-bold font-ibm-plex-arabic" : "text-muted-foreground/30 text-xs"
                )}>
                  {isSigned ? (lang === "ar" ? "محمد العتيبي" : "Mohamed Al-Otaibi") : (lang === "ar" ? "بانتظار التوقيع" : "Waiting for signature")}
                </div>
                {isSigned && <span className="text-[10px] text-secondary">Verified Identity: GID-99283-X</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">{lang === "ar" ? "حالة المستند" : "Document Status"}</h3>
            <div className="flex items-center gap-3 mb-6">
              <Badge variant={isSigned ? "available" : "reserved"} className="px-3 py-1 text-xs">
                {isSigned ? (lang === "ar" ? "موقّع قانونياً" : "Legally Signed") : (lang === "ar" ? "بانتظار العميل" : "Awaiting Client")}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <ShieldCheck size={18} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">{lang === "ar" ? "موثق لدى ناجز" : "Najiz Verified"}</p>
                  <p className="text-[10px] text-neutral mt-0.5">{lang === "ar" ? "متوافق مع الأنظمة السعودية" : "Compliant with KSA regulations"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">{lang === "ar" ? "آخر تحديث" : "Last Activity"}</p>
                  <p className="text-[10px] text-neutral mt-0.5">{lang === "ar" ? "منذ 15 دقيقة" : "15 minutes ago"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-md shadow-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral mb-4">{lang === "ar" ? "البيانات المرتبطة" : "Related Entities"}</h3>
            <div className="space-y-3">
              <Link href="/dashboard/units" className="flex items-center justify-between p-3 rounded bg-muted/30 group hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Buildings size={18} className="text-neutral group-hover:text-primary" />
                  <span className="text-xs font-bold text-primary">{lang === "ar" ? "وحدة 502" : "Unit 502"}</span>
                </div>
                <CaretLeft size={14} className="text-neutral group-hover:text-primary icon-directional" />
              </Link>
              <Link href="/dashboard/sales/customers" className="flex items-center justify-between p-3 rounded bg-muted/30 group hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-neutral group-hover:text-primary" />
                  <span className="text-xs font-bold text-primary">محمد العتيبي</span>
                </div>
                <CaretLeft size={14} className="text-neutral group-hover:text-primary icon-directional" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

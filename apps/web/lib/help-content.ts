export type FAQCategory =
  | "getting_started"
  | "offplan_development"
  | "planning"
  | "sales_crm"
  | "property_management"
  | "finance"
  | "security_privacy"
  | "technical";

export type FAQItem = {
  id: string;
  question: { ar: string; en: string };
  answer: { ar: string; en: string };
  category: FAQCategory;
};

export type GuideItem = {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  steps: { ar: string; en: string }[];
  module: string;
};

export const FAQ_CATEGORIES: { key: FAQCategory; label: { ar: string; en: string } }[] = [
  { key: "getting_started", label: { ar: "البدء", en: "Getting Started" } },
  { key: "offplan_development", label: { ar: "التطوير على الخارطة", en: "Off-Plan Development" } },
  { key: "planning", label: { ar: "التخطيط والتقسيم", en: "Planning & Subdivision" } },
  { key: "sales_crm", label: { ar: "المبيعات والعملاء", en: "Sales & CRM" } },
  { key: "property_management", label: { ar: "إدارة العقارات", en: "Property Management" } },
  { key: "finance", label: { ar: "المالية", en: "Finance" } },
  { key: "security_privacy", label: { ar: "الأمان والخصوصية", en: "Security & Privacy" } },
  { key: "technical", label: { ar: "الدعم الفني", en: "Technical" } },
];

export const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    id: "gs-1",
    question: { ar: "كيف أبدأ استخدام ميماريك؟", en: "How do I get started with Mimaric?" },
    answer: { ar: "بعد تسجيل الدخول، ستصل إلى لوحة التحكم الرئيسية. يمكنك البدء بإضافة مشروع جديد من قسم المشاريع، ثم إضافة المباني والوحدات.", en: "After logging in, you'll reach the main dashboard. Start by adding a new project from the Projects section, then add buildings and units." },
    category: "getting_started",
  },
  {
    id: "gs-2",
    question: { ar: "ما هي الأدوار المتاحة في النظام؟", en: "What roles are available in the system?" },
    answer: { ar: "يوفر ميماريك 13 دوراً: مدير النظام، دعم النظام، مدير الشركة، مدير المشاريع، مدير المبيعات، وكيل مبيعات، مدير العقارات، مسؤول مالي، فني صيانة، استشاري هندسي، مشتري، مستأجر، ومستخدم. كل دور له صلاحيات محددة.", en: "Mimaric offers 13 roles: System Admin, System Support, Company Admin, Project Manager, Sales Manager, Sales Agent, Property Manager, Finance Officer, Technician, Engineering Consultant, Buyer, Tenant, and User. Each has specific permissions." },
    category: "getting_started",
  },
  {
    id: "gs-3",
    question: { ar: "كيف أطلب صلاحيات إضافية؟", en: "How do I request additional permissions?" },
    answer: { ar: "اذهب إلى صفحة المساعدة > طلب الصلاحيات. اختر الدور المطلوب واكتب سبب الطلب. سيراجع المدير طلبك ويوافق عليه أو يرفضه.", en: "Go to Help > Request Permissions. Select the desired role and write your reason. An admin will review and approve or decline your request." },
    category: "getting_started",
  },
  // Off-Plan Development
  {
    id: "op-1",
    question: { ar: "ما هو التطوير على الخارطة (Off-Plan)؟", en: "What is Off-Plan Development?" },
    answer: { ar: "التطوير على الخارطة هو بيع الوحدات العقارية قبل اكتمال بنائها. يمر المشروع بـ 12 مرحلة من التصميم المبدئي حتى الإطلاق، وتشمل التقسيم والموافقات والبنية التحتية وهيكلة المخزون والتسعير والإطلاق.", en: "Off-Plan development is selling real estate units before construction is complete. A project goes through 12 stages from concept design to launch, including subdivision, approvals, infrastructure, inventory structuring, pricing, and launch." },
    category: "offplan_development",
  },
  {
    id: "op-2",
    question: { ar: "كيف أدير البنية التحتية للمشروع؟", en: "How do I manage project infrastructure?" },
    answer: { ar: "من تبويب 'البنية التحتية' في صفحة المشروع، يمكنك إضافة فئات (كهرباء، مياه، طرق، صرف صحي...) مع تحديد المقاول والتكلفة والتاريخ المستهدف ونسبة الجاهزية. النظام يتابع التقدم ويعرض الفئات المتأخرة.", en: "From the 'Infrastructure' tab on the project page, add categories (electricity, water, roads, sewage...) with contractor, cost, target date, and readiness percentage. The system tracks progress and highlights delayed items." },
    category: "offplan_development",
  },
  {
    id: "op-3",
    question: { ar: "كيف أهيكل مخزون الوحدات للبيع على الخارطة؟", en: "How do I structure inventory for off-plan sales?" },
    answer: { ar: "من تبويب 'المخزون'، أضف عناصر يدوياً مع تحديد نوع المنتج (فيلا، تاون هاوس، دوبلكس، تجاري، شقة...)، المساحة، السعر الأساسي، ومرحلة الإطلاق. كل عنصر يمر بحالات: لم يُطلق ← متاح ← محجوز ← مباع.", en: "From the 'Inventory' tab, add items manually specifying product type (villa, townhouse, duplex, commercial, apartment...), area, base price, and release phase. Each item goes through statuses: Unreleased → Available → Reserved → Sold." },
    category: "offplan_development",
  },
  {
    id: "op-4",
    question: { ar: "كيف أضع قواعد التسعير؟", en: "How do I set pricing rules?" },
    answer: { ar: "من تبويب 'التسعير'، أضف قواعد مثل سعر المتر المربع الأساسي، علاوة الزاوية، علاوة إطلالة الحديقة وغيرها. حدد نوع القاعدة والمعامل والأولوية. انقر 'حساب الأسعار' لتطبيق القواعد على جميع عناصر المخزون.", en: "From the 'Pricing' tab, add rules like base price per sqm, corner premium, park-facing premium, etc. Set rule type, factor, and priority. Click 'Calculate Prices' to apply rules across all inventory items." },
    category: "offplan_development",
  },
  {
    id: "op-5",
    question: { ar: "ما هي موجات الإطلاق؟", en: "What are launch waves?" },
    answer: { ar: "موجات الإطلاق تقسّم المخزون إلى مراحل بيع متتالية. من تبويب 'الإطلاق'، أنشئ موجة جديدة بتحديد الاسم وتاريخ الإطلاق وعدد الوحدات. كل موجة تمر بحالات: مخطط ← مُطلق ← مغلق.", en: "Launch waves split inventory into sequential sales phases. From the 'Launch' tab, create a new wave with name, planned date, and inventory count. Each wave goes through statuses: Planned → Launched → Closed." },
    category: "offplan_development",
  },
  {
    id: "op-6",
    question: { ar: "كيف أتحقق من جاهزية المشروع للإطلاق؟", en: "How do I check launch readiness?" },
    answer: { ar: "تبويب 'جاهزية الإطلاق' يعرض قائمة تحقق تلقائية: مخطط تقسيم معتمد، موافقات الجهات، جاهزية البنية التحتية ≥ 70%، إنشاء المخزون، تطبيق قواعد التسعير، وتخطيط موجة إطلاق. العناصر غير المستوفاة تظهر مع زر 'إصلاح' ينقلك مباشرة للتبويب المعني.", en: "The 'Launch Readiness' tab shows an automatic checklist: approved subdivision plan, authority approvals, infrastructure readiness ≥ 70%, inventory created, pricing rules applied, and launch wave planned. Failed items show a 'Fix' button linking directly to the relevant tab." },
    category: "offplan_development",
  },
  {
    id: "op-7",
    question: { ar: "ما هي خريطة المخزون؟", en: "What is the Inventory Map?" },
    answer: { ar: "خريطة المخزون تعرض جميع عناصر المخزون في شبكة ملونة حسب الحالة: أخضر (متاح)، أزرق (محجوز)، أصفر (مباع)، رمادي (لم يُطلق). يمكنك النقر على أي عنصر لعرض تفاصيله أو حجزه مباشرة.", en: "The Inventory Map displays all inventory items in a color-coded grid by status: green (available), blue (reserved), yellow (sold), gray (unreleased). Click any item to view details or reserve it directly." },
    category: "offplan_development",
  },
  {
    id: "op-8",
    question: { ar: "كيف أتابع التحليلات والأداء؟", en: "How do I track analytics and performance?" },
    answer: { ar: "تبويب 'التحليلات' يعرض مؤشرات الأداء: إجمالي القيمة، متوسط سعر المتر المربع، عدد عناصر المخزون، ومعدل التحويل. كما يعرض جدول أداء الموجات (متاح/محجوز/مباع لكل موجة) وجدول التسعير حسب نوع المنتج.", en: "The 'Analytics' tab shows KPIs: total value, average price per sqm, inventory count, and conversion rate. It also displays wave performance tables (available/reserved/sold per wave) and pricing breakdown by product type." },
    category: "offplan_development",
  },
  {
    id: "op-9",
    question: { ar: "كيف أدير التقسيم والموافقات؟", en: "How do I manage subdivision and approvals?" },
    answer: { ar: "من تبويب 'التقسيم'، أنشئ مخططات تقسيم مع البلكات والقطع. من تبويب 'الموافقات'، قدّم طلبات للجهات الحكومية (بلدي، شركة الكهرباء، المياه...) وتابع حالتها (مقدم ← قيد المراجعة ← موافق/مرفوض).", en: "From the 'Subdivision' tab, create subdivision plans with blocks and plots. From the 'Approvals' tab, submit requests to government entities (Balady, electricity company, water...) and track their status (Submitted → Under Review → Approved/Rejected)." },
    category: "offplan_development",
  },
  {
    id: "op-10",
    question: { ar: "ما التقارير المتاحة للمشاريع على الخارطة؟", en: "What reports are available for off-plan projects?" },
    answer: { ar: "يتوفر 3 تقارير متخصصة: تقرير مسار التطوير (توزيع المشاريع على المراحل)، تقرير حالة الموافقات (معدلات النجاح ووقت المعالجة)، وتقرير تحليل التسعير (متوسط الأسعار حسب نوع المنتج). جميعها قابلة للتصدير PDF/Excel.", en: "3 specialized reports are available: Development Pipeline (projects by stage), Approval Status (success rates and processing time), and Pricing Analysis (average prices by product type). All exportable as PDF/Excel." },
    category: "offplan_development",
  },
  // Planning & Subdivision
  {
    id: "pl-1",
    question: { ar: "ما هو نظام التخطيط (Planning OS)؟", en: "What is the Planning OS?" },
    answer: { ar: "نظام التخطيط يمكّنك من تخطيط تقسيم الأراضي بسيناريوهات متعددة. أنشئ مساحة عمل من أرض أو مشروع، ارسم القطع والشوارع على الخريطة، شغّل فحص الامتثال للتحقق من معايير البناء، واحسب الجدوى المالية تلقائياً.", en: "The Planning OS lets you plan land subdivision with multiple scenarios. Create a workspace from a land parcel or project, draw plots and roads on the map, run compliance checks against building regulations, and auto-calculate financial feasibility." },
    category: "planning",
  },
  {
    id: "pl-2",
    question: { ar: "كيف أنشئ مساحة عمل تخطيطية؟", en: "How do I create a planning workspace?" },
    answer: { ar: "اذهب إلى قسم التخطيط وانقر 'مساحة عمل جديدة'. حدد الاسم والموقع والمساحة واختيارياً اربطها بأرض من سجلاتك. يمكنك أيضاً الضغط على 'فتح في التخطيط' من صفحة الأرض أو المشروع مباشرة.", en: "Go to the Planning section and click 'New Workspace'. Set the name, location, area, and optionally link it to a land record. You can also click 'Open in Planning' from the Land or Project detail page." },
    category: "planning",
  },
  {
    id: "pl-3",
    question: { ar: "كيف أقارن بين السيناريوهات؟", en: "How do I compare scenarios?" },
    answer: { ar: "من تبويب 'المقارنة' في مساحة العمل، يعرض النظام جدولاً مقارناً لجميع السيناريوهات: عدد القطع، المساحة القابلة للبيع، الشوارع، المساحات المفتوحة، الإيرادات المتوقعة، والعائد على الاستثمار. اختر السيناريو الأفضل واعتمده كخط أساس.", en: "From the 'Comparison' tab in the workspace, the system shows a side-by-side table of all scenarios: plot count, sellable area, roads, open space, estimated revenue, and ROI. Pick the best scenario and approve it as the baseline." },
    category: "planning",
  },
  {
    id: "pl-4",
    question: { ar: "كيف يعمل فحص الامتثال؟", en: "How does compliance checking work?" },
    answer: { ar: "من تبويب 'الامتثال'، انقر 'تشغيل الفحص'. يقارن النظام القطع والشوارع بقواعد التخطيط السعودية (الحد الأدنى لمساحة القطعة، عرض الشارع، نسبة المساحات المفتوحة...). تظهر النتائج بألوان: أخضر (ناجح)، أحمر (فشل)، أصفر (تحذير).", en: "From the 'Compliance' tab, click 'Run Check'. The system compares plots and roads against Saudi planning rules (minimum plot area, road width, open space percentage...). Results show color-coded: green (pass), red (fail), yellow (warning)." },
    category: "planning",
  },
  {
    id: "pl-5",
    question: { ar: "كيف أحسب الجدوى المالية للسيناريو؟", en: "How do I calculate scenario feasibility?" },
    answer: { ar: "من تبويب 'الجدوى'، أدخل افتراضات التسعير (سعر م² للسكني والتجاري)، تكاليف البناء والبنية التحتية، ونسب التكاليف غير المباشرة. النظام يحسب تلقائياً: إجمالي الإيرادات، التكاليف، صافي الربح، والعائد على الاستثمار.", en: "From the 'Feasibility' tab, enter pricing assumptions (price/sqm for residential and commercial), construction and infrastructure costs, and soft cost percentages. The system auto-calculates: total revenue, costs, net profit, and ROI." },
    category: "planning",
  },
  {
    id: "pl-6",
    question: { ar: "كيف أستورد بيانات مكانية؟", en: "How do I import spatial data?" },
    answer: { ar: "من زر 'استيراد' في مساحة العمل، يمكنك رفع ملفات GeoJSON أو KML أو CSV (مع أعمدة lat/lng). الملفات تُضاف كطبقات مكانية على الخريطة يمكنك التحكم بظهورها.", en: "From the 'Import' button in the workspace, upload GeoJSON, KML, or CSV files (with lat/lng columns). Files are added as spatial layers on the map with visibility toggles." },
    category: "planning",
  },
  // Sales & CRM
  {
    id: "sc-1",
    question: { ar: "كيف أضيف عميلاً جديداً؟", en: "How do I add a new customer?" },
    answer: { ar: "من قسم العملاء، انقر على 'إضافة عميل'. أدخل بيانات العميل (الاسم، الهاتف، الهوية الوطنية). سيتم تشفير البيانات الشخصية تلقائياً.", en: "From the Customers section, click 'Add Customer'. Enter customer details (name, phone, national ID). Personal data is automatically encrypted." },
    category: "sales_crm",
  },
  {
    id: "sc-2",
    question: { ar: "ما الفرق بين عرض كانبان وعرض القائمة؟", en: "What's the difference between Kanban and List view?" },
    answer: { ar: "عرض كانبان يعرض العملاء في أعمدة حسب حالتهم (جديد، مهتم، مؤهل، معاينة، محجوز). عرض القائمة يعرضهم في جدول مع إمكانية الفرز والفلترة.", en: "Kanban view shows customers in columns by status (New, Interested, Qualified, Viewing, Reserved). List view shows them in a sortable, filterable table." },
    category: "sales_crm",
  },
  {
    id: "sc-3",
    question: { ar: "كيف أنشئ حجزاً لعميل؟", en: "How do I create a reservation for a customer?" },
    answer: { ar: "من قسم الحجوزات، انقر على 'حجز جديد'. اختر مصدر الحجز: 'من الوحدات' للوحدات التقليدية أو 'من المخزون' لعناصر البيع على الخارطة. اختر العميل ثم الوحدة/العنصر وأكمل خطوات المعالج الرباعي.", en: "From Reservations, click 'New Reservation'. Choose the source: 'From Units' for traditional units or 'From Inventory' for off-plan items. Select the customer, then the unit/item, and complete the 4-step wizard." },
    category: "sales_crm",
  },
  // Property Management
  {
    id: "pm-1",
    question: { ar: "كيف أتابع حالة الوحدات؟", en: "How do I track unit status?" },
    answer: { ar: "من قسم الوحدات، يمكنك رؤية جميع الوحدات مع حالتها (متاح، محجوز، مباع، مؤجر، صيانة). يمكنك تعديل الأسعار وتغيير الحالة.", en: "From the Units section, view all units with their status (Available, Reserved, Sold, Rented, Maintenance). You can edit prices and change status." },
    category: "property_management",
  },
  {
    id: "pm-2",
    question: { ar: "كيف أقدم طلب صيانة؟", en: "How do I submit a maintenance request?" },
    answer: { ar: "من قسم الصيانة، انقر على 'طلب جديد'. حدد الوحدة، الفئة (كهرباء، سباكة، تكييف...)، الأولوية، ووصف المشكلة.", en: "From Maintenance, click 'New Request'. Select the unit, category (electrical, plumbing, HVAC...), priority, and describe the issue." },
    category: "property_management",
  },
  {
    id: "pm-3",
    question: { ar: "ما هي الصيانة الوقائية؟", en: "What is preventive maintenance?" },
    answer: { ar: "الصيانة الوقائية هي جدولة أعمال صيانة دورية (يومية، أسبوعية، شهرية، سنوية) لمنع الأعطال. يتم إنشاء أوامر عمل تلقائياً حسب الجدول.", en: "Preventive maintenance schedules recurring work (daily, weekly, monthly, annual) to prevent breakdowns. Work orders are auto-generated per schedule." },
    category: "property_management",
  },
  // Finance
  {
    id: "fi-1",
    question: { ar: "كيف أتابع الأقساط المستحقة؟", en: "How do I track due installments?" },
    answer: { ar: "من قسم الإيجارات > تحصيل الإيجارات، يمكنك رؤية جميع الأقساط مع حالتها (مدفوع، غير مدفوع، متأخر). يمكنك تسجيل الدفعات من هناك.", en: "From Rentals > Rent Collection, view all installments with status (Paid, Unpaid, Overdue). You can record payments from there." },
    category: "finance",
  },
  {
    id: "fi-2",
    question: { ar: "هل النظام متوافق مع متطلبات هيئة الزكاة والضريبة (ZATCA)؟", en: "Is the system ZATCA compliant?" },
    answer: { ar: "نعم، يدعم ميماريك حساب ضريبة القيمة المضافة (15%) وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك. الفوترة الإلكترونية قيد التطوير.", en: "Yes, Mimaric supports VAT calculation (15%) per ZATCA requirements. E-invoicing integration is under development." },
    category: "finance",
  },
  {
    id: "fi-3",
    question: { ar: "كيف أصدر تقارير مالية؟", en: "How do I generate financial reports?" },
    answer: { ar: "من قسم التقارير، اختر نوع التقرير (مالي، إشغال، صيانة، مسار التطوير، حالة الموافقات، تحليل التسعير...) وحدد نطاق التاريخ. يمكنك التصدير بصيغة Excel أو PDF. يتوفر 10 أنواع من التقارير تشمل التقارير التشغيلية والمالية والتطويرية والتنظيمية.", en: "From Reports, select the report type (financial, occupancy, maintenance, development pipeline, approval status, pricing analysis...) and date range. Export as Excel or PDF. 10 report types are available covering operational, financial, development, and regulatory categories." },
    category: "finance",
  },
  // Security & Privacy
  {
    id: "sp-1",
    question: { ar: "كيف يتم حماية بيانات العملاء الشخصية؟", en: "How is customer personal data protected?" },
    answer: { ar: "يتم تشفير البيانات الشخصية (الهوية الوطنية، الهاتف، البريد الإلكتروني) بتقنية AES-256-GCM. فقط المستخدمون المصرح لهم يمكنهم عرض البيانات الكاملة.", en: "Personal data (national ID, phone, email) is encrypted with AES-256-GCM. Only authorized users can view full data." },
    category: "security_privacy",
  },
  {
    id: "sp-2",
    question: { ar: "ما هي سياسة كلمة المرور؟", en: "What is the password policy?" },
    answer: { ar: "يتطلب النظام كلمة مرور لا تقل عن 10 أحرف، ولا تحتوي على اسمك أو بريدك الإلكتروني، وليست من قائمة كلمات المرور الشائعة.", en: "The system requires a password of at least 10 characters, not containing your name or email, and not in a common password list." },
    category: "security_privacy",
  },
  {
    id: "sp-3",
    question: { ar: "هل يمكنني مراجعة سجل النشاطات؟", en: "Can I review the activity log?" },
    answer: { ar: "نعم، المديرون يمكنهم الوصول إلى سجل التدقيق من الإعدادات > سجل التدقيق. يتم تسجيل جميع عمليات الوصول والتعديل والتصدير.", en: "Yes, admins can access the audit trail from Settings > Audit Log. All access, modification, and export operations are logged." },
    category: "security_privacy",
  },
  // Technical
  {
    id: "te-1",
    question: { ar: "كيف أغير كلمة المرور؟", en: "How do I change my password?" },
    answer: { ar: "اذهب إلى الإعدادات > الأمان. أدخل كلمة المرور الحالية ثم الجديدة. يجب أن تستوفي كلمة المرور الجديدة سياسة الأمان.", en: "Go to Settings > Security. Enter your current password then the new one. The new password must meet the security policy." },
    category: "technical",
  },
  {
    id: "te-2",
    question: { ar: "هل يدعم النظام اللغة العربية والإنجليزية؟", en: "Does the system support Arabic and English?" },
    answer: { ar: "نعم، يدعم ميماريك اللغتين العربية والإنجليزية مع تخطيط RTL/LTR. يمكنك تغيير اللغة من الشريط العلوي.", en: "Yes, Mimaric supports both Arabic and English with RTL/LTR layout. Toggle the language from the top bar." },
    category: "technical",
  },
  {
    id: "te-3",
    question: { ar: "هل يدعم النظام التاريخ الهجري؟", en: "Does the system support Hijri dates?" },
    answer: { ar: "نعم، يعرض النظام التاريخ الهجري والميلادي معاً في جميع الأقسام.", en: "Yes, the system displays both Hijri and Gregorian dates across all sections." },
    category: "technical",
  },
  // Land Management
  {
    id: "pm-4",
    question: { ar: "كيف أضيف أرضاً جديدة؟", en: "How do I add a new land parcel?" },
    answer: { ar: "من قسم الأراضي، انقر على 'إضافة أرض'. أدخل اسم الأرض، رقم القطعة، رقم الصك، المساحة، نوع الاستخدام (سكني، تجاري، صناعي، زراعي، متعدد)، الموقع (المنطقة، المدينة، الحي)، وحدد الموقع على الخريطة. يمكنك أيضاً إضافة اسم المالك والقيمة التقديرية.", en: "From the Lands section, click 'Add Land'. Enter the land name, parcel number, deed number, area, land use type (residential, commercial, industrial, agricultural, mixed-use), location (region, city, district), and pin the location on the map. You can also add the owner name and estimated value." },
    category: "property_management",
  },
  {
    id: "pm-5",
    question: { ar: "ما هو مؤشر ملاءمة الأرض؟", en: "What is the land suitability score?" },
    answer: { ar: "مؤشر الملاءمة هو تقييم من 0 إلى 100 يعكس مدى مناسبة الأرض للتطوير. النتيجة 70% وأعلى تظهر باللون الأخضر (ممتازة)، 40-69% باللون البرتقالي (متوسطة)، وأقل من 40% باللون الأحمر (ضعيفة). تمر الأرض بحالات: تم تحديدها ← قيد المراجعة ← تم الاستحواذ.", en: "The suitability score is a 0-100 rating reflecting how suitable the land is for development. Scores of 70%+ appear green (excellent), 40-69% amber (moderate), and below 40% red (poor). Land parcels go through statuses: Identified → Under Review → Acquired." },
    category: "property_management",
  },
  // Document Vault
  {
    id: "pm-6",
    question: { ar: "كيف أرفع وأدير المستندات؟", en: "How do I upload and manage documents?" },
    answer: { ar: "من قسم المستندات، انقر 'رفع مستند' لرفع ملفات PDF أو صور أو مستندات نصية. المستندات تُصنّف تلقائياً (مخططات، تصاريح قانونية، مخططات إنشائية، تجاري، تسويق). يمكنك البحث بالاسم، إنشاء مجلدات جديدة، وتحميل أي مستند. يعرض النظام مؤشر المساحة المستخدمة من إجمالي التخزين المتاح.", en: "From the Documents section, click 'Upload Document' to upload PDFs, images, or text files. Documents are categorized automatically (blueprints, legal permits, structural plans, commercial, marketing). You can search by name, create new folders, and download any document. The system shows a storage usage indicator of your total available space." },
    category: "property_management",
  },
  // Billing & Subscription
  {
    id: "fi-4",
    question: { ar: "كيف أدير اشتراكي؟", en: "How do I manage my subscription?" },
    answer: { ar: "من قسم الفوترة، يمكنك رؤية خطتك الحالية وحالتها (تجريبي، نشط، متأخر، ملغي)، دورة الفوترة (شهري، ربع سنوي، نصف سنوي، سنوي)، تاريخ الفاتورة التالية، وطرق الدفع المحفوظة. انقر 'تغيير الخطة' لعرض الخطط المتاحة والمقارنة بينها.", en: "From the Billing section, view your current plan and its status (trialing, active, past due, canceled), billing cycle (monthly, quarterly, semi-annual, annual), next billing date, and saved payment methods. Click 'Change Plan' to browse and compare available plans." },
    category: "finance",
  },
  {
    id: "fi-5",
    question: { ar: "كيف أستخدم كود الخصم (كوبون)؟", en: "How do I apply a coupon code?" },
    answer: { ar: "من صفحة الخطط (الفوترة > الخطط)، أدخل كود الخصم في حقل الكوبون وانقر 'تطبيق'. إذا كان الكود صالحاً، سيظهر الخصم (نسبة مئوية أو مبلغ ثابت) على أسعار الخطط مع عرض السعر الأصلي مشطوباً والسعر الجديد باللون الأخضر ومبلغ التوفير.", en: "From the Plans page (Billing > Plans), enter the discount code in the coupon field and click 'Apply'. If valid, the discount (percentage or fixed amount) appears on plan prices with the original price crossed out, the new price in green, and the savings amount displayed." },
    category: "finance",
  },
  {
    id: "fi-6",
    question: { ar: "ماذا يحدث عند تأخر سداد الاشتراك؟", en: "What happens when my subscription payment is overdue?" },
    answer: { ar: "عند تأخر السداد، تتحول حالة اشتراكك إلى 'متأخر' ويظهر شريط تنبيه مع زر 'تحديث الدفع'. لديك فترة سماح لتحديث طريقة الدفع قبل تعليق الخدمة. يمكنك مراجعة فواتيرك ومبالغها من صفحة الفواتير.", en: "When payment is overdue, your subscription status changes to 'Past Due' and a warning banner appears with an 'Update Payment' button. You have a grace period to update your payment method before service suspension. You can review your invoices and amounts from the Invoices page." },
    category: "finance",
  },
  {
    id: "fi-7",
    question: { ar: "كيف أتابع مدفوعات الإيجار؟", en: "How do I track and record rental payments?" },
    answer: { ar: "من الإيجارات > المدفوعات، تظهر لوحة بأربعة مؤشرات: إجمالي المستحق، المحصّل، المتأخر، والمعلق. الجدول يعرض كل قسط مع اسم المستأجر ورقم الوحدة والمبلغ وتاريخ الاستحقاق والحالة. انقر 'تسجيل دفعة' على أي قسط غير مدفوع لتسجيل التحصيل. النظام يحدّث الأقساط المتأخرة تلقائياً.", en: "From Rentals > Payments, a dashboard shows four KPIs: Total Due, Collected, Overdue, and Pending. The table lists each installment with tenant name, unit number, amount, due date, and status. Click 'Record Payment' on any unpaid installment to record collection. The system automatically marks overdue installments." },
    category: "finance",
  },
  // Sales Contracts
  {
    id: "sc-4",
    question: { ar: "كيف أتابع عقود المبيعات؟", en: "How do I track sales contracts?" },
    answer: { ar: "من المبيعات > العقود، يعرض النظام جدولاً بجميع العقود مع بيانات العميل (الاسم والهاتف)، الوحدة (الرقم والمبنى)، نوع العقد (بيع أو إيجار)، المبلغ بالريال، التاريخ بالهجري والميلادي، والحالة. يمكنك تصفية العقود حسب الحالة: مسودة، مُرسل، موقّع، ملغي. انقر 'عرض' لفتح تفاصيل أي عقد.", en: "From Sales > Contracts, the system shows a table of all contracts with customer info (name and phone), unit (number and building), contract type (sale or lease), amount in SAR, date in Hijri and Gregorian, and status. Filter contracts by status: Draft, Sent, Signed, Canceled. Click 'View' to open any contract's details." },
    category: "sales_crm",
  },
  // Site Logs
  {
    id: "op-11",
    question: { ar: "كيف أستخدم سجلات الموقع؟", en: "How do I use site logs?" },
    answer: { ar: "من صفحة المشروع > سجلات الموقع، يمكنك تسجيل ومتابعة الأحداث اليومية للموقع. أنواع السجلات: سجل يومي، تفتيش، ملاحظة فنية، سلامة، وطقس. كل سجل له مستوى خطورة (منخفض، متوسط، عالي، حرج) وحالة (مفتوح أو محلول). يمكنك تصفية السجلات حسب النوع والخطورة، وحل أي سجل مفتوح بنقرة واحدة.", en: "From the Project page > Site Logs, you can record and track daily site events. Log types: Daily Log, Inspection, Snag, Safety, and Weather. Each log has a severity level (Low, Medium, High, Critical) and status (Open or Resolved). Filter logs by type and severity, and resolve any open log with one click." },
    category: "offplan_development",
  },
  // Onboarding / Getting Started
  {
    id: "gs-4",
    question: { ar: "كيف أُعدّ حسابي ومنشأتي في ميماريك؟", en: "How do I set up my account and organization in Mimaric?" },
    answer: { ar: "عند أول تسجيل دخول، يظهر معالج الإعداد المكوّن من 4 خطوات: (1) الانضمام لشركة قائمة أو المتابعة مستقلاً، (2) بيانات المنشأة (الاسم بالعربية والإنجليزية، السجل التجاري، الرقم الضريبي، نوع الكيان والشكل القانوني)، (3) بيانات التواصل (الجوال، المدينة، المنطقة)، (4) دعوة أعضاء الفريق عبر البريد الإلكتروني مع تحديد أدوارهم. يمكنك تخطي أي خطوة والعودة لإكمالها لاحقاً.", en: "On first login, a 4-step setup wizard appears: (1) Join an existing company or continue independently, (2) Organization details (Arabic and English names, CR number, VAT number, entity type, legal form), (3) Contact information (mobile, city, region), (4) Invite team members by email with role assignment. You can skip any step and complete it later." },
    category: "getting_started",
  },
  {
    id: "gs-5",
    question: { ar: "كيف أنضم لشركة قائمة في ميماريك؟", en: "How do I join an existing company in Mimaric?" },
    answer: { ar: "في الخطوة الأولى من الإعداد، اختر 'انضم لشركة'. أدخل رقم السجل التجاري المكوّن من 10 خانات وانقر 'بحث'. إذا وُجدت الشركة، ستظهر بياناتها ويمكنك إرسال طلب انضمام. سيراجع مدير الشركة طلبك ويوافق عليه.", en: "In the first setup step, choose 'Join a Company'. Enter the 10-digit CR number and click 'Search'. If the company is found, its details appear and you can send a join request. The company admin will review and approve your request." },
    category: "getting_started",
  },
  // Platform Administration
  {
    id: "te-4",
    question: { ar: "ما هي أدوات إدارة المنصة (للمسؤولين)؟", en: "What are the platform administration tools (for admins)?" },
    answer: { ar: "لوحة الإدارة تتيح للمسؤولين: إدارة خطط الاشتراك (إنشاء وتعديل الخطط والأسعار والميزات)، متابعة جميع الاشتراكات (نشط، تجريبي، متأخر، ملغي) مع إحصائيات شاملة، إنشاء وإدارة الكوبونات (كود الخصم، النسبة أو المبلغ، الحد الأقصى للاستخدام، الصلاحية)، وعرض جميع الفواتير والمدفوعات عبر المنصة مع إجمالي الإيرادات.", en: "The Admin panel lets administrators: manage subscription plans (create and edit plans, pricing, and features), monitor all subscriptions (active, trialing, past due, canceled) with comprehensive statistics, create and manage coupons (discount codes, percentage or fixed amount, max redemptions, validity), and view all invoices and payments across the platform with total revenue." },
    category: "technical",
  },
];

export const GUIDE_ITEMS: GuideItem[] = [
  {
    id: "guide-1",
    title: { ar: "إضافة مشروع جديد", en: "Add a New Project" },
    description: { ar: "تعلم كيفية إنشاء مشروع عقاري جديد مع البيانات الأساسية", en: "Learn how to create a new real estate project with basic data" },
    module: "projects",
    steps: [
      { ar: "اذهب إلى قسم المشاريع من القائمة الجانبية", en: "Go to the Projects section from the sidebar" },
      { ar: "انقر على زر 'مشروع جديد'", en: "Click the 'New Project' button" },
      { ar: "أدخل اسم المشروع، النوع (سكني، تجاري، متعدد الاستخدام)، والموقع", en: "Enter the project name, type (residential, commercial, mixed-use), and location" },
      { ar: "أضف بيانات الصك وأرقام القطعة والمخطط", en: "Add deed data, plot number, and plan information" },
      { ar: "انقر 'حفظ' لإنشاء المشروع", en: "Click 'Save' to create the project" },
    ],
  },
  {
    id: "guide-2",
    title: { ar: "إدارة الوحدات", en: "Manage Units" },
    description: { ar: "كيفية إضافة وتعديل وحذف الوحدات العقارية في المشاريع", en: "How to add, edit, and delete units in projects" },
    module: "units",
    steps: [
      { ar: "اذهب إلى قسم الوحدات", en: "Go to the Units section" },
      { ar: "اختر المشروع والمبنى المراد إضافة وحدات له", en: "Select the project and building to add units to" },
      { ar: "انقر 'إضافة وحدة' وأدخل الرقم، النوع، المساحة، والسعر", en: "Click 'Add Unit' and enter number, type, area, and price" },
      { ar: "يمكنك تعديل عدة وحدات معاً باستخدام التحديد المتعدد", en: "You can bulk-edit units using multi-select" },
      { ar: "غيّر حالة الوحدة (متاح، محجوز، مباع) حسب الحاجة", en: "Change unit status (Available, Reserved, Sold) as needed" },
    ],
  },
  {
    id: "guide-3",
    title: { ar: "إنشاء عميل", en: "Create a Customer" },
    description: { ar: "إضافة عميل جديد إلى نظام إدارة العلاقات", en: "Add a new customer to the CRM system" },
    module: "customers",
    steps: [
      { ar: "اذهب إلى قسم العملاء", en: "Go to the Customers section" },
      { ar: "انقر 'إضافة عميل'", en: "Click 'Add Customer'" },
      { ar: "أدخل الاسم بالعربية والإنجليزية", en: "Enter the name in Arabic and English" },
      { ar: "أدخل رقم الهاتف ورقم الهوية الوطنية", en: "Enter phone number and national ID" },
      { ar: "اختر مصدر العميل (موقع، إحالة، معرض، إلخ)", en: "Select the customer source (website, referral, exhibition, etc.)" },
      { ar: "انقر 'حفظ' — سيتم تشفير البيانات الحساسة تلقائياً", en: "Click 'Save' — sensitive data is auto-encrypted" },
    ],
  },
  {
    id: "guide-4",
    title: { ar: "إنشاء عقد إيجار", en: "Create a Lease" },
    description: { ar: "خطوات إنشاء عقد إيجار جديد مع جدول الأقساط", en: "Steps to create a new lease with installment schedule" },
    module: "rentals",
    steps: [
      { ar: "اذهب إلى قسم الإيجارات", en: "Go to the Rentals section" },
      { ar: "انقر 'عقد إيجار جديد'", en: "Click 'New Lease'" },
      { ar: "اختر الوحدة والمستأجر", en: "Select the unit and tenant" },
      { ar: "حدد تاريخ البدء والانتهاء والمبلغ الإجمالي", en: "Set start date, end date, and total amount" },
      { ar: "سيتم إنشاء جدول الأقساط الشهرية تلقائياً", en: "Monthly installment schedule is auto-generated" },
    ],
  },
  {
    id: "guide-5",
    title: { ar: "تقديم طلب صيانة", en: "Submit a Maintenance Request" },
    description: { ar: "كيفية تقديم طلب صيانة لوحدة عقارية", en: "How to submit a maintenance request for a unit" },
    module: "maintenance",
    steps: [
      { ar: "اذهب إلى قسم الصيانة", en: "Go to the Maintenance section" },
      { ar: "انقر 'طلب صيانة جديد'", en: "Click 'New Maintenance Request'" },
      { ar: "اختر الوحدة المعنية", en: "Select the relevant unit" },
      { ar: "حدد الفئة (كهرباء، سباكة، تكييف، مصعد، إلخ) والأولوية", en: "Select category (electrical, plumbing, HVAC, elevator, etc.) and priority" },
      { ar: "اكتب وصفاً تفصيلياً للمشكلة", en: "Write a detailed description of the issue" },
      { ar: "انقر 'إرسال' — سيتم تعيين فني حسب الأولوية", en: "Click 'Submit' — a technician will be assigned by priority" },
    ],
  },
  {
    id: "guide-6",
    title: { ar: "تصدير التقارير", en: "Export Reports" },
    description: { ar: "كيفية إنشاء وتصدير التقارير بصيغة Excel أو PDF", en: "How to generate and export reports as Excel or PDF" },
    module: "reports",
    steps: [
      { ar: "اذهب إلى قسم التقارير", en: "Go to the Reports section" },
      { ar: "اختر نوع التقرير (إشغال، مالي، صيانة، إيجارات، عملاء، مسار التطوير، حالة الموافقات، تحليل التسعير)", en: "Select report type (occupancy, financial, maintenance, leases, customers, development pipeline, approval status, pricing analysis)" },
      { ar: "حدد نطاق التاريخ المطلوب", en: "Set the desired date range" },
      { ar: "انقر زر Excel (أخضر) أو PDF (أحمر) للتصدير", en: "Click Excel (green) or PDF (red) button to export" },
    ],
  },
  {
    id: "guide-7",
    title: { ar: "إدارة فريق العمل", en: "Manage Team Members" },
    description: { ar: "إضافة وإدارة أعضاء الفريق وتعيين الأدوار", en: "Add and manage team members and assign roles" },
    module: "settings",
    steps: [
      { ar: "اذهب إلى الإعدادات > إدارة الفريق", en: "Go to Settings > Team Management" },
      { ar: "انقر 'دعوة عضو جديد'", en: "Click 'Invite Member'" },
      { ar: "أدخل الاسم والبريد الإلكتروني وكلمة المرور", en: "Enter name, email, and password" },
      { ar: "اختر الدور المناسب (مدير مشاريع، وكيل مبيعات، فني، إلخ)", en: "Select the appropriate role (Project Manager, Sales Agent, Technician, etc.)" },
      { ar: "انقر 'حفظ' — سيتمكن العضو من تسجيل الدخول فوراً", en: "Click 'Save' — the member can log in immediately" },
    ],
  },
  {
    id: "guide-8",
    title: { ar: "طلب صلاحيات", en: "Request Permissions" },
    description: { ar: "كيفية طلب ترقية صلاحياتك في النظام", en: "How to request a permission upgrade in the system" },
    module: "help",
    steps: [
      { ar: "اذهب إلى صفحة المساعدة من القائمة الجانبية", en: "Go to the Help page from the sidebar" },
      { ar: "انقر على تبويب 'طلب صلاحيات'", en: "Click the 'Request Permissions' tab" },
      { ar: "اختر الدور الذي تريد الترقية إليه", en: "Select the role you want to upgrade to" },
      { ar: "اكتب سبب الطلب بالتفصيل", en: "Write a detailed reason for the request" },
      { ar: "انقر 'إرسال الطلب' — سيتم إشعار المدير", en: "Click 'Submit Request' — the admin will be notified" },
      { ar: "تابع حالة طلبك من نفس الصفحة", en: "Track your request status from the same page" },
    ],
  },
  // Off-Plan Development Guides
  {
    id: "guide-9",
    title: { ar: "إعداد مشروع بيع على الخارطة", en: "Set Up an Off-Plan Project" },
    description: { ar: "الخطوات الكاملة لإعداد مشروع تطوير على الخارطة من البداية", en: "Complete steps to set up an off-plan development project from scratch" },
    module: "offplan",
    steps: [
      { ar: "أنشئ مشروعاً جديداً من قسم المشاريع واختر النوع (سكني/تجاري)", en: "Create a new project from the Projects section and select type (residential/commercial)" },
      { ar: "من تبويب 'المخطط المبدئي'، أضف بدائل التصميم للمقارنة", en: "From the 'Concept Plan' tab, add design alternatives for comparison" },
      { ar: "من تبويب 'التقسيم'، أنشئ مخطط تقسيم مع البلكات والقطع", en: "From the 'Subdivision' tab, create a subdivision plan with blocks and plots" },
      { ar: "من تبويب 'الموافقات'، قدّم طلبات للجهات الحكومية المعنية", en: "From the 'Approvals' tab, submit requests to relevant government entities" },
      { ar: "من تبويب 'البنية التحتية'، أضف فئات البنية التحتية وعيّن المقاولين", en: "From the 'Infrastructure' tab, add infrastructure categories and assign contractors" },
      { ar: "تابع تبويب 'جاهزية الإطلاق' حتى تستوفي جميع المتطلبات", en: "Monitor the 'Launch Readiness' tab until all requirements are met" },
    ],
  },
  {
    id: "guide-10",
    title: { ar: "هيكلة المخزون وإطلاق البيع", en: "Structure Inventory & Launch Sales" },
    description: { ar: "كيفية إعداد المخزون وتسعيره وإطلاق موجات البيع", en: "How to set up inventory, price it, and launch sales waves" },
    module: "offplan",
    steps: [
      { ar: "من تبويب 'المخزون'، أضف عناصر المخزون (فيلا، تاون هاوس، شقة، تجاري...)", en: "From the 'Inventory' tab, add inventory items (villa, townhouse, apartment, commercial...)" },
      { ar: "حدد لكل عنصر: المساحة، السعر الأساسي، مرحلة الإطلاق، وقناة البيع", en: "For each item set: area, base price, release phase, and sales channel" },
      { ar: "من تبويب 'التسعير'، أضف قواعد التسعير (سعر أساسي، علاوات، خصومات)", en: "From the 'Pricing' tab, add pricing rules (base price, premiums, discounts)" },
      { ar: "انقر 'حساب الأسعار' لتطبيق القواعد على المخزون", en: "Click 'Calculate Prices' to apply rules to inventory" },
      { ar: "من تبويب 'الإطلاق'، أنشئ موجة إطلاق جديدة بتاريخ وعدد وحدات", en: "From the 'Launch' tab, create a new launch wave with date and unit count" },
      { ar: "راجع 'خريطة المخزون' لمتابعة الحالة المرئية لكل عنصر", en: "Review the 'Inventory Map' for a visual status overview of each item" },
    ],
  },
  {
    id: "guide-11",
    title: { ar: "حجز من المخزون (البيع على الخارطة)", en: "Reserve from Inventory (Off-Plan Sales)" },
    description: { ar: "كيفية إنشاء حجز لعميل من مخزون البيع على الخارطة", en: "How to create a reservation for a customer from off-plan inventory" },
    module: "offplan",
    steps: [
      { ar: "اذهب إلى المبيعات > الحجوزات > حجز جديد", en: "Go to Sales > Reservations > New Reservation" },
      { ar: "انقر 'من المخزون' في أعلى الصفحة لتغيير المصدر", en: "Click 'From Inventory' at the top of the page to switch source" },
      { ar: "اختر العميل من القائمة أو ابحث باسمه أو رقمه", en: "Select the customer from the list or search by name or number" },
      { ar: "اختر المشروع ثم اختر عنصر المخزون المتاح", en: "Select the project then choose an available inventory item" },
      { ar: "أكمل بيانات الدفع في الخطوة الثانية", en: "Complete payment details in the second step" },
      { ar: "راجع الملخص وأكد الحجز — سيتم تحديث حالة العنصر تلقائياً إلى 'محجوز'", en: "Review the summary and confirm — the item status will automatically update to 'Reserved'" },
    ],
  },
  {
    id: "guide-12",
    title: { ar: "متابعة تحليلات المشروع", en: "Track Project Analytics" },
    description: { ar: "كيفية استخدام لوحة التحليلات لمتابعة أداء المشروع", en: "How to use the analytics dashboard to monitor project performance" },
    module: "offplan",
    steps: [
      { ar: "افتح المشروع واذهب إلى تبويب 'التحليلات'", en: "Open the project and go to the 'Analytics' tab" },
      { ar: "راجع بطاقات المؤشرات: إجمالي القيمة، متوسط السعر، المخزون، معدل التحويل", en: "Review KPI cards: total value, average price, inventory count, conversion rate" },
      { ar: "استعرض جدول أداء الموجات لمقارنة المتاح والمحجوز والمباع", en: "Review the wave performance table to compare available, reserved, and sold" },
      { ar: "استعرض جدول التسعير حسب النوع لتحليل الأسعار بحسب فئة المنتج", en: "Review the pricing by type table to analyze prices by product category" },
      { ar: "استخدم مؤشرات لوحة التحكم الرئيسية لمتابعة إجمالي المخزون ونشاط الإطلاق", en: "Use the main dashboard KPIs to track total inventory and launch activity" },
    ],
  },
  // Land Management Guide
  {
    id: "guide-13",
    title: { ar: "إضافة وإدارة الأراضي", en: "Add & Manage Land Parcels" },
    description: { ar: "كيفية إضافة أراضي جديدة وتتبع حالتها وملاءمتها للتطوير", en: "How to add new land parcels and track their status and development suitability" },
    module: "lands",
    steps: [
      { ar: "اذهب إلى قسم الأراضي من القائمة الجانبية", en: "Go to the Lands section from the sidebar" },
      { ar: "انقر زر 'إضافة أرض' لفتح نموذج الإضافة", en: "Click the 'Add Land' button to open the form" },
      { ar: "أدخل اسم الأرض، رقم القطعة، ورقم الصك", en: "Enter the land name, parcel number, and deed number" },
      { ar: "حدد المساحة (م²) ونوع الاستخدام (سكني، تجاري، صناعي، زراعي، أو متعدد)", en: "Set the area (sqm) and land use (residential, commercial, industrial, agricultural, or mixed-use)" },
      { ar: "أدخل الموقع (المنطقة، المدينة، الحي) وحدد الموقع على الخريطة", en: "Enter the location (region, city, district) and pin the location on the map" },
      { ar: "اختيارياً: أضف اسم المالك والقيمة التقديرية بالريال", en: "Optionally: add the owner name and estimated value in SAR" },
      { ar: "انقر 'حفظ' — ستظهر الأرض في الجدول مع مؤشر الملاءمة والحالة", en: "Click 'Save' — the land appears in the table with suitability score and status" },
    ],
  },
  // Document Vault Guide
  {
    id: "guide-14",
    title: { ar: "رفع وإدارة المستندات", en: "Upload & Manage Documents" },
    description: { ar: "كيفية رفع الملفات وتصنيفها والبحث عنها في خزنة المستندات", en: "How to upload files, categorize them, and search in the document vault" },
    module: "documents",
    steps: [
      { ar: "اذهب إلى قسم المستندات من القائمة الجانبية", en: "Go to the Documents section from the sidebar" },
      { ar: "انقر زر 'رفع مستند' واختر ملفاً من جهازك (PDF، صورة، أو نص)", en: "Click 'Upload Document' and select a file from your device (PDF, image, or text)" },
      { ar: "سيتم رفع الملف وتصنيفه تلقائياً في الفئة المناسبة", en: "The file will be uploaded and automatically categorized" },
      { ar: "استخدم القائمة الجانبية للتصفية حسب الفئة (مخططات، تصاريح، إنشائية، تجاري، تسويق)", en: "Use the sidebar to filter by category (blueprints, legal permits, structural, commercial, marketing)" },
      { ar: "استخدم شريط البحث للعثور على أي مستند بالاسم", en: "Use the search bar to find any document by name" },
      { ar: "انقر زر التحميل على أي بطاقة مستند لتحميله إلى جهازك", en: "Click the download button on any document card to download it" },
    ],
  },
  // Sales Contracts Guide
  {
    id: "guide-15",
    title: { ar: "متابعة عقود المبيعات", en: "Track Sales Contracts" },
    description: { ar: "كيفية عرض وتصفية ومتابعة دورة حياة عقود البيع والإيجار", en: "How to view, filter, and track the lifecycle of sales and lease contracts" },
    module: "sales",
    steps: [
      { ar: "اذهب إلى المبيعات > العقود من القائمة الجانبية", en: "Go to Sales > Contracts from the sidebar" },
      { ar: "استخدم أزرار التصفية في الأعلى لاختيار الحالة (الكل، مسودة، مُرسل، موقّع، ملغي)", en: "Use the filter buttons at the top to select status (All, Draft, Sent, Signed, Canceled)" },
      { ar: "استعرض الجدول الذي يعرض بيانات العميل والوحدة ونوع العقد والمبلغ والتاريخ", en: "Browse the table showing customer info, unit, contract type, amount, and date" },
      { ar: "انقر 'عرض' لفتح صفحة تفاصيل العقد", en: "Click 'View' to open the contract details page" },
      { ar: "تابع دورة حياة العقد: مسودة ← مُرسل ← موقّع", en: "Follow the contract lifecycle: Draft → Sent → Signed" },
    ],
  },
  // Rental Payments Guide
  {
    id: "guide-16",
    title: { ar: "تسجيل مدفوعات الإيجار", en: "Record Rental Payments" },
    description: { ar: "كيفية متابعة أقساط الإيجار وتسجيل المدفوعات المحصّلة", en: "How to monitor rental installments and record collected payments" },
    module: "rentals",
    steps: [
      { ar: "اذهب إلى الإيجارات > المدفوعات من القائمة الجانبية", en: "Go to Rentals > Payments from the sidebar" },
      { ar: "راجع بطاقات المؤشرات: إجمالي المستحق، المحصّل، المتأخر، والمعلق", en: "Review the KPI cards: Total Due, Collected, Overdue, and Pending" },
      { ar: "استعرض جدول الأقساط مع بيانات المستأجر والوحدة والمبلغ وتاريخ الاستحقاق", en: "Browse the installments table with tenant info, unit, amount, and due date" },
      { ar: "حدد القسط المطلوب تسجيله (غير مدفوع أو متأخر)", en: "Find the installment to record (unpaid or overdue)" },
      { ar: "انقر زر 'تسجيل دفعة' — سيتم تحديث الحالة تلقائياً إلى 'مدفوع'", en: "Click 'Record Payment' — the status will automatically update to 'Paid'" },
    ],
  },
  // Billing & Subscription Guide
  {
    id: "guide-17",
    title: { ar: "إدارة الاشتراك والفوترة", en: "Manage Subscription & Billing" },
    description: { ar: "كيفية اختيار خطة اشتراك وتطبيق كوبون ومراجعة الفواتير", en: "How to choose a subscription plan, apply a coupon, and review invoices" },
    module: "billing",
    steps: [
      { ar: "اذهب إلى الفوترة من القائمة الجانبية لعرض خطتك الحالية", en: "Go to Billing from the sidebar to view your current plan" },
      { ar: "انقر 'تغيير الخطة' لاستعراض الخطط المتاحة", en: "Click 'Change Plan' to browse available plans" },
      { ar: "بدّل بين الفوترة الشهرية والسنوية (وفّر 20% مع السنوية)", en: "Toggle between monthly and annual billing (save 20% with annual)" },
      { ar: "اختيارياً: أدخل كود خصم في حقل الكوبون وانقر 'تطبيق'", en: "Optionally: enter a discount code in the coupon field and click 'Apply'" },
      { ar: "انقر 'اختر الخطة' أو 'ابدأ التجربة المجانية' للاشتراك", en: "Click 'Choose Plan' or 'Start Free Trial' to subscribe" },
      { ar: "راجع فواتيرك من صفحة الفواتير (رقم الفاتورة، التاريخ، الحالة، المبلغ مع الضريبة)", en: "Review your invoices from the Invoices page (invoice number, date, status, amount with VAT)" },
    ],
  },
  // Site Logs Guide
  {
    id: "guide-18",
    title: { ar: "تسجيل سجلات الموقع", en: "Add Site Logs to a Project" },
    description: { ar: "كيفية تسجيل أحداث الموقع اليومية (تفتيش، ملاحظات، سلامة، طقس)", en: "How to log daily site events (inspections, snags, safety, weather)" },
    module: "projects",
    steps: [
      { ar: "افتح المشروع المطلوب واذهب إلى 'سجلات الموقع'", en: "Open the desired project and go to 'Site Logs'" },
      { ar: "انقر زر 'إضافة سجل' لفتح نموذج الإدخال", en: "Click 'Add Log' to open the entry form" },
      { ar: "حدد التاريخ ونوع السجل (يومي، تفتيش، ملاحظة فنية، سلامة، أو طقس)", en: "Select the date and log type (daily, inspection, snag, safety, or weather)" },
      { ar: "اكتب وصفاً تفصيلياً للحدث أو الملاحظة", en: "Write a detailed description of the event or observation" },
      { ar: "اختيارياً: حدد مستوى الخطورة (منخفض، متوسط، عالي، حرج) واسم المُبلّغ", en: "Optionally: set the severity level (low, medium, high, critical) and reporter name" },
      { ar: "انقر 'حفظ' — يمكنك لاحقاً تصفية السجلات حسب النوع والخطورة، وحل المفتوح منها", en: "Click 'Save' — you can later filter logs by type and severity, and resolve open ones" },
    ],
  },
  // Planning OS Guides
  {
    id: "guide-20",
    title: { ar: "تخطيط تقسيم أرض جديدة", en: "Plan a New Land Subdivision" },
    description: { ar: "الخطوات الكاملة لتخطيط تقسيم أرض باستخدام نظام التخطيط", en: "Complete steps to plan a land subdivision using the Planning OS" },
    module: "planning",
    steps: [
      { ar: "اذهب إلى قسم التخطيط من القائمة الجانبية", en: "Go to the Planning section from the sidebar" },
      { ar: "انقر 'مساحة عمل جديدة' أو اضغط 'فتح في التخطيط' من صفحة الأرض", en: "Click 'New Workspace' or press 'Open in Planning' from the Land page" },
      { ar: "أنشئ سيناريو جديد — سيتم إنشاء مخطط تقسيم فارغ تلقائياً", en: "Create a new scenario — an empty subdivision plan is auto-created" },
      { ar: "استخدم أدوات الرسم على الخريطة لإضافة حدود الموقع والقطع والشوارع", en: "Use the map drawing tools to add site boundary, plots, and roads" },
      { ar: "شغّل فحص الامتثال للتحقق من مطابقة المعايير السعودية", en: "Run compliance check to verify Saudi regulation compliance" },
      { ar: "أدخل افتراضات الجدوى واحسب العائد المتوقع", en: "Enter feasibility assumptions and calculate expected returns" },
      { ar: "كرر العملية لسيناريوهات بديلة وقارن بينها", en: "Repeat for alternative scenarios and compare them" },
      { ar: "اعتمد السيناريو الأفضل كخط أساس", en: "Approve the best scenario as baseline" },
    ],
  },
  {
    id: "guide-21",
    title: { ar: "تصدير تقارير التخطيط", en: "Export Planning Reports" },
    description: { ar: "كيفية تصدير جدول القطع وتقرير المقارنة والجدوى", en: "How to export parcel schedules, comparison, and feasibility reports" },
    module: "planning",
    steps: [
      { ar: "افتح مساحة العمل واختر السيناريو المطلوب", en: "Open the workspace and select the desired scenario" },
      { ar: "لتصدير جدول القطع: من تبويب 'السيناريوهات' اختر 'تصدير جدول القطع'", en: "To export parcel schedule: from 'Scenarios' tab choose 'Export Parcel Schedule'" },
      { ar: "لتصدير تقرير المقارنة: من تبويب 'المقارنة' اختر 'تصدير'", en: "To export comparison: from 'Comparison' tab choose 'Export'" },
      { ar: "لتصدير الجدوى: من تبويب 'الجدوى' اختر 'تصدير الجدوى'", en: "To export feasibility: from 'Feasibility' tab choose 'Export Feasibility'" },
      { ar: "التقارير متاحة بصيغة Excel مع جداول مفصلة", en: "Reports are available as Excel files with detailed tables" },
    ],
  },
  // Onboarding Guide
  {
    id: "guide-19",
    title: { ar: "إكمال إعداد الحساب", en: "Complete Account Setup" },
    description: { ar: "خطوات إعداد الحساب والمنشأة ودعوة فريق العمل عند أول استخدام", en: "Steps to set up your account, organization, and invite your team on first use" },
    module: "onboarding",
    steps: [
      { ar: "الخطوة 1: اختر 'انضم لشركة' (أدخل رقم السجل التجاري) أو 'تابع مستقلاً'", en: "Step 1: Choose 'Join a Company' (enter CR number) or 'Continue Independently'" },
      { ar: "الخطوة 2: أدخل بيانات المنشأة (الاسم بالعربية والإنجليزية، السجل التجاري، الرقم الضريبي)", en: "Step 2: Enter organization details (Arabic and English name, CR number, VAT number)" },
      { ar: "اختر نوع الكيان (مؤسسة، شركة، فرع...) والشكل القانوني (ذ.م.م، مساهمة...)", en: "Select entity type (establishment, company, branch...) and legal form (LLC, joint stock...)" },
      { ar: "الخطوة 3: أدخل بيانات التواصل (رقم الجوال 05XXXXXXXX، المدينة، المنطقة)", en: "Step 3: Enter contact info (mobile 05XXXXXXXX, city, region)" },
      { ar: "الخطوة 4: أضف أعضاء الفريق عبر البريد الإلكتروني واختر دور كل عضو", en: "Step 4: Add team members by email and select each member's role" },
      { ar: "انقر 'إرسال الدعوات وإكمال الإعداد' — سيتمكن فريقك من الدخول فوراً", en: "Click 'Send Invitations & Complete Setup' — your team can log in immediately" },
    ],
  },
];

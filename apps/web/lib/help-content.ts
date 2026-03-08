export type FAQCategory =
  | "getting_started"
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
    answer: { ar: "يوفر ميماريك 11 دوراً: مدير النظام، مدير التطوير، مدير المشاريع، مدير المبيعات، وكيل مبيعات، مدير العقارات، مسؤول مالي، فني صيانة، مشتري، مستأجر، ومستخدم. كل دور له صلاحيات محددة.", en: "Mimaric offers 11 roles: Super Admin, Dev Admin, Project Manager, Sales Manager, Sales Agent, Property Manager, Finance Officer, Technician, Buyer, Tenant, and User. Each has specific permissions." },
    category: "getting_started",
  },
  {
    id: "gs-3",
    question: { ar: "كيف أطلب صلاحيات إضافية؟", en: "How do I request additional permissions?" },
    answer: { ar: "اذهب إلى صفحة المساعدة > طلب الصلاحيات. اختر الدور المطلوب واكتب سبب الطلب. سيراجع المدير طلبك ويوافق عليه أو يرفضه.", en: "Go to Help > Request Permissions. Select the desired role and write your reason. An admin will review and approve or decline your request." },
    category: "getting_started",
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
    answer: { ar: "من قسم الحجوزات، انقر على 'حجز جديد'. اختر العميل والوحدة وتاريخ الانتهاء. الحجز يحتفظ بالوحدة مؤقتاً حتى تاريخ الانتهاء.", en: "From Reservations, click 'New Reservation'. Select the customer, unit, and expiry date. The reservation holds the unit temporarily until expiry." },
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
    answer: { ar: "من قسم التقارير، اختر نوع التقرير (مالي، إشغال، صيانة...) وحدد نطاق التاريخ. يمكنك التصدير بصيغة Excel أو PDF.", en: "From Reports, select the report type (financial, occupancy, maintenance...) and date range. Export as Excel or PDF." },
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
      { ar: "اختر نوع التقرير (إشغال، مالي، صيانة، إيجارات، عملاء)", en: "Select report type (occupancy, financial, maintenance, leases, customers)" },
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
      { ar: "انقر 'إضافة عضو جديد'", en: "Click 'Add New Member'" },
      { ar: "أدخل الاسم والبريد الإلكتروني وكلمة المرور", en: "Enter name, email, and password" },
      { ar: "اختر الدور المناسب (مدير مشاريع، وكيل مبيعات، فني، إلخ)", en: "Select the appropriate role (Project Manager, Sales Agent, Technician, etc.)" },
      { ar: "انقر 'دعوة' — سيتمكن العضو من تسجيل الدخول فوراً", en: "Click 'Invite' — the member can log in immediately" },
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
];

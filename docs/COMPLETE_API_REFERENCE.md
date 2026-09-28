# 📘 المرجع الشامل والكامل لواجهات برمجة التطبيقات (CenterK Complete API Reference)

مرجع هندسي دقيق وشامل يوثق كل مسار (Endpoint) في نظام سنتر الدروس، مع توضيح الصلاحيات، المدخلات، المخرجات، وحالات الخطأ.

---

## 📑 الفهرس (Table of Contents)
1. [قواعد عامة والتوثيق الموحد](#1-قواعد-عامة-والتوثيق-الموحد)
2. [المجموعة الأولى: التوثيق والحسابات (Authentication)](#2-المجموعة-الأولى-التوثيق-والحسابات-authentication)
3. [المجموعة الثانية: إدارة شؤون الطلاب (Students Management)](#3-المجموعة-الثانية-إدارة-شؤون-الطلاب-students-management)
4. [المجموعة الثالثة: المدرسين والمحافظ المالية (Teachers & Wallets)](#4-المجموعة-الثالثة-المدرسين-والمحافظ-المالية-teachers--wallets)
5. [المجموعة الرابعة: المواد والمجموعات الدراسية (Subjects & Groups)](#5-المجموعة-الرابعة-المواد-والمجموعات-الدراسية-subjects--groups)
6. [المجموعة الخامسة: الحصص والحضور الذكي والـ Dynamic QR (Sessions & Attendance)](#6-المجموعة-الخامسة-الحصص-والحضور-الذكي-والـ-dynamic-qr-sessions--attendance)
7. [المجموعة السادسة: المنظومة المالية والفواتير والمصروفات (Finance & Accounting)](#7-المجموعة-السادسة-المنظومة-المالية-والفواتير-والمصروفات-finance--accounting)
8. [المجموعة السابعة: المحتوى الرقمي والفيديوهات والمذكرات (Digital Content - LMS)](#8-المجموعة-السابعة-المحتوى-الرقمي-والفيديوهات-والمذكرات-digital-content---lms)

---

## 1. قواعد عامة والتوثيق الموحد

* **الرابط الأساسي**: `http://localhost:5000/api/v1`
* **Swagger UI التفاعلي**: `http://localhost:5000/api-docs`
* **صيغة ترويسة التوثيق (Authorization Header)**:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **صيغة الرد القياسي في حالات النجاح (Standard Success Format)**:
  ```json
  {
    "message": "نص الرسالة التوضيحية",
    "data": {}, // أو كائن الرد المباشر
    "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
  }
  ```
* **صيغة الرد القياسي في حالات الخطأ (Standard Error Format)**:
  ```json
  {
    "message": "بيانات غير صالحة (Validation Error)",
    "errors": [
      { "field": "phone", "message": "رقم الهاتف يجب أن يكون رقم مصري صالح" }
    ]
  }
  ```

---

## 2. المجموعة الأولى: التوثيق والحسابات (Authentication)

### 2.1 تسجيل الدخول
* **المسار**: `POST /auth/login`
* **الصلاحية**: عام (Public - Rate limited: 10 attempts / 15m)
* **المدخلات (Request Body)**:
  ```json
  {
    "identifier": "01000000000", // هاتف أو بريد إلكتروني
    "password": "Admin@123456"
  }
  ```
* **المخرجات (200 OK)**:
  ```json
  {
    "message": "تم تسجيل الدخول بنجاح",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "67d8f9e0a1b2c3d4e5f6a7b8",
      "name": "مدير النظام",
      "phone": "01000000000",
      "email": "admin@centerk.com",
      "role": "super_admin",
      "status": "active",
      "mustChangePassword": false
    }
  }
  ```
* **الأخطاء المتوقعة**: `400` (مدخلات ناقصة), `401` (بيانات الاعتماد غير صحيحة), `429` (تجاوز معدل المحاولات).

---

### 2.2 تجديد الـ Access Token
* **المسار**: `POST /auth/refresh`
* **الصلاحية**: عام (يحمل Refresh Token صالح)
* **المدخلات**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
* **المخرجات (200 OK)**:
  ```json
  {
    "message": "تم تجديد رمز الدخول بنجاح",
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
* **الأخطاء المتوقعة**: `401` (رمز التحديث غير متوفر، منتهي الصلاحية، أو المستخدم غير نشط).

---

### 2.3 استعراض بيانات الحساب الحالي (Me)
* **المسار**: `GET /auth/me`
* **الصلاحية**: أي مستخدم مسجل دخوله (`super_admin`, `admin`, `teacher`, `student`)
* **المخرجات (200 OK)**: كائن المستخدم كاملاً مع تاريخ الإنشاء ودون كلمة المرور.

---

### 2.4 تسجيل توكن إشعارات الموبايل (FCM Token)
* **المسار**: `POST /auth/device-token`
* **الصلاحية**: أي مستخدم مسجل دخوله
* **المدخلات**:
  ```json
  {
    "token": "dK4X9...fcm_token_from_mobile_device"
  }
  ```
* **المخرجات (200 OK)**: `{ "message": "تم تسجيل توكن الإشعارات للجهاز بنجاح" }`

---

### 2.5 تغيير كلمة المرور
* **المسار**: `POST /auth/change-password`
* **الصلاحية**: أي مستخدم مسجل دخوله
* **المدخلات**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewStrongPassword123",
    "confirmPassword": "NewStrongPassword123"
  }
  ```
* **المخرجات (200 OK)**: `{ "message": "تم تغيير كلمة المرور بنجاح" }`

---

### 2.6 تسجيل الخروج
* **المسار**: `POST /auth/logout`
* **الصلاحية**: عام / خاص (يمسح الكوكيز ويسجل حركة الخروج في الـ Audit Log)

---

## 3. المجموعة الثانية: إدارة شؤون الطلاب (Students Management)

### 3.1 إنشاء طالب جديد وتوليد حسابه والـ QR المشفر
* **المسار**: `POST /students`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "name": "محمود عادل إبراهيم",
    "phone": "01012345678", // رقم هاتف مصري صالح (11 رقم يبدأ بـ 01)
    "email": "mahmoud@gmail.com", // اختياري
    "parentName": "عادل إبراهيم",
    "parentPhone": "01123456789",
    "grade": "الصف الثالث الثانوي",
    "packageId": "67d8f9e0a1b2c3d4e5f6a7b8", // اختياري
    "subjects": ["67d8f9e0a1b2c3d4e5f6a7b9"] // اختياري
  }
  ```
* **المخرجات (201 Created)**:
  ```json
  {
    "message": "تم إضافة الطالب بنجاح",
    "student": {
      "id": "67d8f9e0a1b2c3d4e5f6a7ba",
      "name": "محمود عادل إبراهيم",
      "phone": "01012345678",
      "grade": "الصف الثالث الثانوي",
      "subscriptionStatus": "active"
    },
    "qrCodeData": "3f9c...:8b2a...:91e0..." // 🛡️ كود مشفر بـ AES-256-GCM
  }
  ```
* **الأخطاء المتوقعة**: `400` (خطأ في البيانات)، `409` (رقم الهاتف أو الإيميل مسجل مسبقاً).

---

### 3.2 قائمة الطلاب مع البحث والفلترة
* **المسار**: `GET /students`
* **الصلاحية**: `super_admin`, `admin`, `teacher`
* **الـ Query Parameters**:
  * `page`: رقم الصفحة (افتراضي 1)
  * `limit`: عدد النتائج (افتراضي 20، حد أقصى 100)
  * `search`: بحث حر بالاسم أو رقم الهاتف
  * `grade`: فلترة بالمرحلة الدراسية
  * `subscriptionStatus`: فلترة بالحالة (`active`, `pending`, `overdue`, `suspended`)

---

### 3.3 استعراض ملف الطالب
* **المسار**: `GET /students/:id`
* **الصلاحية**: الإدارة، المدرس، أو الطالب نفسه (محمي من استعراض بيانات طالب آخر).

---

### 3.4 استعراض كود الـ QR المشفر للطالب
* **المسار**: `GET /students/:id/qr`
* **الصلاحية**: الإدارة أو الطالب نفسه صاحب الحساب.
* **المخرجات (200 OK)**:
  ```json
  {
    "studentId": "67d8f9e0a1b2c3d4e5f6a7ba",
    "qrData": "3f9c...:8b2a...:91e0..."
  }
  ```

---

### 3.5 تحديث بيانات الطالب
* **المسار**: `PUT /students/:id`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**: تقبل أي حقل من: `name`, `phone`, `email`, `parentName`, `parentPhone`, `grade`, `packageId`, `subjects`, `subscriptionStatus`, `status`.

---

## 4. المجموعة الثالثة: المدرسين والمحافظ المالية (Teachers & Wallets)

### 4.1 إضافة مدرس جديد
* **المسار**: `POST /teachers`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "name": "أ. حسام خليل",
    "phone": "01234567890",
    "email": "hossam@centerk.com",
    "salaryPercentage": 80, // نسبة المدرس من 0 إلى 100
    "subjects": ["67d8f9e0a1b2c3d4e5f6a7b9"]
  }
  ```
* **المخرجات (201 Created)**: بيانات المدرس والـ QR المشفر لبطاقته الشخصية.

---

### 4.2 استعراض المدرسين
* **المسار**: `GET /teachers`
* **الصلاحية**: `super_admin`, `admin`

---

### 4.3 كشف حساب محفظة المدرس (Teacher Wallet Ledger)
* **المسار**: `GET /finance/wallets/:teacherId`
* **الصلاحية**: `super_admin`, `admin`, أو المدرس نفسه.
* **المخرجات (200 OK)**:
  ```json
  {
    "teacher": { "id": "67d...", "name": "أ. حسام خليل", "salaryPercentage": 80 },
    "summary": {
      "totalEarned": 15000,
      "totalPaidOut": 10000,
      "pendingBalance": 5000
    },
    "entries": [
      {
        "_id": "67d...",
        "studentId": { "grade": "ثالثة ثانوي" },
        "subjectId": { "name": "فيزياء" },
        "amount": 400,
        "status": "pending",
        "createdAt": "2026-09-18T16:00:00.000Z"
      }
    ]
  }
  ```

---

### 4.4 تسوية وصرف مستحقات المدرس (Payout / Settle)
* **المسار**: `POST /finance/wallets/settle`
* **الصلاحية**: `super_admin` حصرياً
* **المدخلات**:
  ```json
  {
    "teacherId": "67d8f9e0a1b2c3d4e5f6a7bb",
    "amount": 2500,
    "notes": "صرف مستحقات أسبوعين نقداً"
  }
  ```
* **الأخطاء المتوقعة**: `400` إذا كان المبلغ المطلوب صرفه أكبر من الرصيد المعلق (`pendingBalance`).

---

## 5. المجموعة الرابعة: المواد والمجموعات الدراسية (Subjects & Groups)

### 5.1 إضافة مادة دراسية
* **المسار**: `POST /groups/subjects`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "name": "فيزياء",
    "grade": "الصف الثالث الثانوي",
    "teacherId": "67d8f9e0a1b2c3d4e5f6a7bb",
    "description": "منهج الثانوية العامة كاملاً"
  }
  ```

---

### 5.2 إنشاء مجموعة دراسية وجدول المواعيد
* **المسار**: `POST /groups`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "name": "مجموعة الأحد والثلاثاء - فيزياء",
    "subjectId": "67d8f9e0a1b2c3d4e5f6a7b9",
    "teacherId": "67d8f9e0a1b2c3d4e5f6a7bb",
    "grade": "الصف الثالث الثانوي",
    "capacity": 50,
    "schedule": [
      { "day": "Sunday", "startTime": "16:00", "endTime": "18:00" },
      { "day": "Tuesday", "startTime": "16:00", "endTime": "18:00" }
    ]
  }
  ```

---

### 5.3 تسجيل طالب في المجموعة
* **المسار**: `POST /groups/:id/students`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**: `{ "studentId": "67d..." }`
* **الحماية البرمجية**: يتحقق السيرفر تلقائياً من أن عدد الطلاب لم يتجاوز الـ `capacity`، ومن عدم تسجيل الطالب مرتين.

---

## 6. المجموعة الخامسة: الحصص والحضور الذكي والـ Dynamic QR (Sessions & Attendance)

### 6.1 إنشاء حصة جديدة
* **المسار**: `POST /sessions`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "subjectId": "67d...",
    "teacherId": "67d...",
    "groupId": "67d...",
    "date": "2026-09-18",
    "startTime": "16:00",
    "endTime": "18:00"
  }
  ```
* **الميزة التلقائية**: يقوم السيرفر بإنشاء سجلات حضور أولية بحالة `pending` لكل الطلاب المقيدين في المجموعة فورياً.

---

### 6.2 كود الـ QR الدوار المباشر للحصة (Live Rotating QR)
* **المسار**: `GET /sessions/:id/qr`
* **الصلاحية**: `super_admin`, `admin`, `teacher`
* **الوصف**: يعرض على شاشة القاعة أو البروجيكتور؛ يتجدد تلقائياً كل 30 ثانية لمنع تصوير الشاشة (Replay Attack Defense).
* **المخرجات (200 OK)**:
  ```json
  {
    "sessionId": "67d...",
    "qrData": "91a...:4c1...:2d7...",
    "expiresInSeconds": 30,
    "expiresAt": "2026-09-18T16:55:00.000Z"
  }
  ```

---

### 6.3 مسح الطالب لكود الحصة من شاشة القاعة (Mobile Scan)
* **المسار**: `POST /sessions/scan/session`
* **الصلاحية**: `student`
* **المدخلات**:
  ```json
  {
    "qrData": "<STRING_READ_FROM_SCREEN>"
  }
  ```
* **المخرجات (200 OK)**: `{ "message": "تم تسجيل حضورك بنجاح! 🎉", "checkInTime": "..." }`
* **الأخطاء المتوقعة**: `400` إذا كان الكود منتهياً أو تم تسجيل الحضور مسبقاً (Double Scan Prevention).

---

### 6.4 مسح موظف الاستقبال لكارت الطالب عند المدخل (Staff Scan)
* **المسار**: `POST /sessions/scan/student`
* **الصلاحية**: `super_admin`, `admin`, `teacher`
* **المدخلات**:
  ```json
  {
    "sessionId": "67d...",
    "qrData": "<STRING_READ_FROM_STUDENT_CARD>"
  }
  ```
* **الميزة**: يسجل الحضور فورياً ويطلق إشعار Push Notification فوري لموبايل ولي الأمر في الخلفية.

---

### 6.5 إحصائيات الحضور والغياب اللحظية للحصة
* **المسار**: `GET /sessions/:id/stats`
* **المخرجات**:
  ```json
  {
    "sessionId": "67d...",
    "stats": {
      "total": 50,
      "present": 44,
      "absent": 4,
      "late": 2,
      "attendancePercentage": 92
    }
  }
  ```

---

## 7. المجموعة السادسة: المنظومة المالية والفواتير والمصروفات (Finance & Accounting)

### 7.1 إصدار فاتورة شهرية لطالب
* **المسار**: `POST /finance/invoices`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "studentId": "67d...",
    "month": "2026-09",
    "totalAmount": 600,
    "dueDate": "2026-09-10",
    "notes": "اشتراك شهر سبتمبر"
  }
  ```
* **الحماية**: يمنع النظام إصدار فاتورتين لنفس الطالب في نفس الشهر `(studentId + month)`.

---

### 7.2 استعراض الفواتير
* **المسار**: `GET /finance/invoices?month=2026-09&status=pending`
* **الخصوصية**: الطالب يرى فواتيره فقط تلقائياً، بينما الإدارة تستعرض فواتير السنتر ككل.

---

### 7.3 تسجيل دفعة مالية (Transaction-Safe Payment)
* **المسار**: `POST /finance/payments`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "invoiceId": "67d...",
    "studentId": "67d...",
    "amount": 300,
    "method": "cash", // cash | visa | instapay | vodafone_cash
    "notes": "دفعة نقدية بالاستقبال"
  }
  ```
* **المعالجة الآمنة**:
  * تتم داخل **MongoDB Transaction**.
  * تفحص منع الدفع الزائد `amount <= remainingAmount`.
  * تخصم المبلغ من الفاتورة وتحدث حالتها (`partial` أو `paid`).
  * تحتسب فورياً أرباح المدرسين بحسب نسبهم وتضيفها لمحفظتهم.

---

### 7.4 تسجيل مصروفات السنتر التشغيلية
* **المسار**: `POST /finance/expenses`
* **الصلاحية**: `super_admin`, `admin`
* **المدخلات**:
  ```json
  {
    "title": "فاتورة كهرباء القاعات لشهر أغسطس",
    "amount": 1850,
    "category": "electricity", // electricity | water | internet | rent | salary | maintenance | supplies | other
    "date": "2026-09-18",
    "notes": "تم السداد عن طريق فوري"
  }
  ```

---

### 7.5 تقرير صافي أرباح السنتر والمديونيات (Net Profit)
* **المسار**: `GET /finance/summary`
* **الصلاحية**: `super_admin` حصرياً
* **المخرجات (200 OK)**:
  ```json
  {
    "summary": {
      "totalRevenue": 120000,
      "totalExpenses": 25000,
      "totalTeacherCuts": 65000,
      "netProfit": 30000,
      "uncollectedDebt": 8500,
      "unpaidInvoicesCount": 12
    }
  }
  ```

---

## 8. المجموعة السابعة: المحتوى الرقمي والفيديوهات والمذكرات (Digital Content - LMS)

### 8.1 استعراض الفيديوهات التعليمية
* **المسار**: `GET /media/videos?subjectId=67d...`
* **الصلاحية**: الجميع (مع بوابة فحص الاشتراك).
* **الحماية**:
  * الطلاب المشتركين تظهر لهم كل فيديوهات مواردهم المسجلة + الفيديوهات المجانية.
  * الطلاب غير المشتركين تظهر لهم فقط الفيديوهات المحددة كمعاينة مجانية (`isFreePreview: true`).

---

### 8.2 استعراض مذكرات الـ PDF
* **المسار**: `GET /media/pdfs?subjectId=67d...`
* **الصلاحية**: الجميع (بنفس بوابة فحص الاشتراك السابقة).

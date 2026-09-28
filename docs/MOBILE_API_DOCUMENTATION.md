# 📱 دليل ربط وتكامل تطبيق الموبايل (Education Center Mobile API Documentation)

دليل هندسي موجه لمطوري تطبيقات الموبايل (Flutter / React Native / Native iOS & Android) لربط واستخدام واجهات برمجة التطبيقات (REST APIs) الخاصة بنظام إدارة سنتر الدروس التعليمي.

---

## 🌐 1. الأساسيات والاتصال (Base Configuration)

* **الرابط الأساسي (Base URL)**: `http://<SERVER_IP>:5000/api/v1`
* **صيغة البيانات (Data Format)**: `application/json`
* **الترويسات الإلزامية في كل الطلبات المحمية (Headers)**:
  ```http
  Authorization: Bearer <YOUR_ACCESS_TOKEN>
  Content-Type: application/json
  ```

---

## 🔐 2. دورة حياة التوثيق وحفظ التوكنات (Auth & Token Lifecycle)

1. **عند تسجيل الدخول (`POST /auth/login`)**:
   * يستقبل التطبيق كلاً من:
     * `accessToken`: صالح لمدة **15 دقيقة**.
     * `refreshToken`: صالح لمدة **7 أيام**.
   * 🛡️ **توصية هامة**: قم بحفظ الـ `refreshToken` والـ `accessToken` في الـ **Secure Storage** (مثل `flutter_secure_storage` أو `expo-secure-store`).

2. **عند انتهاء صلاحية الـ Access Token (HTTP 401)**:
   * يقوم التطبيق بطلب تجديد التوكن في الخلفية:
     ```http
     POST /auth/refresh
     Body: { "refreshToken": "<STORED_REFRESH_TOKEN>" }
     ```
   * يتم استلام `accessToken` جديد وحفظه واستكمال طلبات المستخدم بدون تسجيل خروج.

3. **تسجيل توكن الإشعارات (FCM Push Notifications)**:
   * بعد تسجيل الدخول مباشرة، يقوم التطبيق بإرسال رمز الجهاز:
     ```http
     POST /auth/device-token
     Body: { "token": "<FCM_DEVICE_TOKEN>" }
     ```

---

## 📋 3. توثيق الـ Endpoints بالتفصيل

### 🔑 أ. منظومة الحسابات والتوثيق (Authentication)

#### 1. تسجيل الدخول (Login)
* **المسار**: `POST /auth/login`
* **الصلاحية**: عام (Public - Rate limited: 10 attempts / 15m)
* **المدخلات (Request Body)**:
  ```json
  {
    "identifier": "01012345678", // أو البريد الإلكتروني
    "password": "UserPassword123"
  }
  ```
* **المخرجات (Success Response 200)**:
  ```json
  {
    "message": "تم تسجيل الدخول بنجاح",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "67d...",
      "name": "أحمد محمود",
      "phone": "01012345678",
      "email": "ahmed@example.com",
      "role": "student", // super_admin | admin | teacher | student
      "status": "active",
      "mustChangePassword": false
    }
  }
  ```

#### 2. تجديد التوكن (Refresh Access Token)
* **المسار**: `POST /auth/refresh`
* **المدخلات**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
* **المخرجات (200)**:
  ```json
  {
    "message": "تم تجديد رمز الدخول بنجاح",
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```

#### 3. الحساب الشخصي (Get Profile)
* **المسار**: `GET /auth/me`
* **الترويسة**: `Authorization: Bearer <accessToken>`

#### 4. تغيير كلمة المرور (Change Password)
* **المسار**: `POST /auth/change-password`
* **المدخلات**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewStrongPassword123",
    "confirmPassword": "NewStrongPassword123"
  }
  ```

#### 5. تسجيل توكن إشعارات الموبايل (Register Device Token)
* **المسار**: `POST /auth/device-token`
* **المدخلات**:
  ```json
  {
    "token": "dK4X...fcm-token-string..."
  }
  ```

---

### 👨‍🎓 ب. الطلاب والـ QR Code المشفر (Students)

#### 1. استعراض قائمة الطلاب (List Students)
* **المسار**: `GET /students?page=1&limit=20&search=أحمد&grade=ثالثة ثانوي`
* **الصلاحية**: `super_admin`, `admin`, `teacher`

#### 2. إنشاء طالب جديد (Create Student)
* **المسار**: `POST /students`
* **المدخلات**:
  ```json
  {
    "name": "محمود عادل",
    "phone": "01123456789",
    "email": "mahmoud@gmail.com",
    "parentName": "عادل إبراهيم",
    "parentPhone": "01234567890",
    "grade": "ثانوية عامة",
    "subjects": ["67d..."]
  }
  ```

#### 3. جلب كود الـ QR المشفر للطالب (Get Student QR)
* **المسار**: `GET /students/:id/qr`
* **الصلاحية**: الإدارة أو الطالب نفسه صاحب الحساب
* **المخرجات (200)**:
  ```json
  {
    "studentId": "67d...",
    "qrData": "3f9c...:8b2a...:91e0..." // 🛡️ كود مشفر بـ AES-256-GCM
  }
  ```
  > 💡 **لمطور الموبايل**: قم بتمرير النص الموجود في `qrData` مباشرة لأي مكتبة توليد QR (مثل `QrImageView(data: qrData)` في Flutter) ليرسم الباركود على الشاشة.

---

### 📅 ج. الحصص ونظام الحضور الذكي (Sessions & Smart Attendance)

#### 1. استعراض الحصص (Get Sessions)
* **المسار**: `GET /sessions?date=2026-09-18&status=upcoming`

#### 2. جلب كود الحصة الدوار (Rotating Dynamic QR for Projector)
* **المسار**: `GET /sessions/:id/qr`
* **الوصف**: كود الحصة يتجدد تلقائياً كل 30 ثانية لمنع تصوير الشاشة.
* **المخرجات**:
  ```json
  {
    "sessionId": "67d...",
    "qrData": "91a...:4c1...:2d7...",
    "expiresInSeconds": 30,
    "expiresAt": "2026-09-18T16:55:00.000Z"
  }
  ```

#### 3. مسح الطالب لكود الحصة المعروض على البروجيكتور (Student Scans Session QR)
* **المسار**: `POST /sessions/scan/session`
* **الصلاحية**: طالب مسجل دخوله (`role: student`)
* **المدخلات**:
  ```json
  {
    "qrData": "<STRING_READ_BY_MOBILE_CAMERA>"
  }
  ```
* **المخرجات (200)**:
  ```json
  {
    "message": "تم تسجيل حضورك بنجاح! 🎉",
    "checkInTime": "2026-09-18T16:52:10.123Z"
  }
  ```

#### 4. مسح المسؤول لبطاقة الطالب عند مدخل السنتر (Staff Scans Student Card)
* **المسار**: `POST /sessions/scan/student`
* **المدخلات**:
  ```json
  {
    "sessionId": "67d...",
    "qrData": "<STRING_READ_FROM_STUDENT_CARD>"
  }
  ```

#### 5. إحصائيات الحضور اللحظية للحصة (Session Stats)
* **المسار**: `GET /sessions/:id/stats`
* **المخرجات**:
  ```json
  {
    "stats": {
      "total": 50,
      "present": 42,
      "absent": 5,
      "late": 3,
      "attendancePercentage": 90
    }
  }
  ```

---

### 💰 د. الفواتير والمدفوعات والمحفظة (Finance)

#### 1. فواتير الطالب (Invoices)
* **المسار**: `GET /finance/invoices?month=2026-09`
* *(إذا كان المستخدم طالب، يُرجع فقط فواتيره الخاصة تلقائياً)*

#### 2. تسجيل دفعة (Record Payment)
* **المسار**: `POST /finance/payments`
* **المدخلات**:
  ```json
  {
    "invoiceId": "67d...",
    "studentId": "67d...",
    "amount": 500,
    "method": "cash" // cash | visa | instapay | vodafone_cash
  }
  ```

#### 3. محفظة المدرس (Teacher Wallet)
* **المسار**: `GET /finance/wallets/:teacherId`
* **المخرجات**:
  ```json
  {
    "summary": {
      "totalEarned": 12500,
      "totalPaidOut": 8000,
      "pendingBalance": 4500
    },
    "entries": [...]
  }
  ```

---

### 📚 هـ. المحتوى الرقمي والمذكرات (Digital Content - LMS)

#### 1. الفيديوهات (Videos)
* **المسار**: `GET /media/videos?subjectId=67d...`
* 🛡️ **نظام الحماية**:
  * الطالب النشط تظهر له فيديوهات مواده المسجلة + الفيديوهات المجانية.
  * الطالب غير المشترك أو المتأخر تظهر له فقط الفيديوهات المجانية (`isFreePreview: true`).

#### 2. المذكرات وملفات الـ PDF (PDFs)
* **المسار**: `GET /media/pdfs?subjectId=67d...`

---

## ⚠️ 4. صيغة الأخطاء القياسية (Standard Error Format)

عند حدوث أي خطأ، يُرجع الـ Backend رمز الحالة المناسب (400, 401, 403, 404, 409) مع جسم استجابة JSON موحد:
```json
{
  "message": "بيانات غير صالحة (Validation Error)",
  "errors": [
    {
      "field": "phone",
      "message": "رقم الهاتف يجب أن يكون رقم مصري صالح"
    }
  ]
}
```
يمكنك عرض `message` مباشرة للمستخدم في تطبيق الموبايل عبر `SnackBar` أو `Alert Dialog`.

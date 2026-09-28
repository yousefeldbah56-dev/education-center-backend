# 🚀 دليل تشغيل واختبار المشروع خطوة بخطوة (How to Run CenterK Backend)

دليل تشغيلي شامل لتشغيل نظام الـ Backend وتجربته عبر المتصفح (Swagger UI) وعبر Postman.

---

## 🛠️ 1. المتطلبات الأساسية (Prerequisites)

تأكد من توفر الآتي على جهازك:
* **Node.js**: الإصدار 18 أو 20 أو أحدث (`node -v`).
* **قاعدة بيانات MongoDB**: إما خادم محلي (Local MongoDB على `mongodb://localhost:27017`) أو رابط سحابي من MongoDB Atlas.

---

## ⚙️ 2. خطوات التشغيل من الصفر (Step-by-Step)

### الخطوة 1: الدخول لمجلد الـ Backend
افتح سطر الأوامر (Terminal أو PowerShell) وتوجه لمجلد المشروع:
```bash
cd e:/centerk/backend
```

### الخطوة 2: تثبيت الحزم (إن لم تكن مثبتة)
```bash
npm install
```

### الخطوة 3: إعداد المتغيرات البيئية (`.env`)
تأكد من وجود ملف `.env` في مجلد `backend`، ويمكنك نسخه من `.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/education_center

# أسرار التشفير والتوكنات
JWT_ACCESS_SECRET=CenterK_Access_Secret_Key_Super_Strong_2026_!
JWT_REFRESH_SECRET=CenterK_Refresh_Secret_Key_Super_Strong_2026_!
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# تشفير أكواد الـ QR المشفرة
QR_ENCRYPTION_SECRET=CenterK_AES_256_Encryption_Secret_Key_2026_!
QR_ROTATION_INTERVAL_SECONDS=30
```

---

## 🌱 3. بذر البيانات وحساب المدير الافتراضي (Database Seeding)

قبل تشغيل السيرفر لأول مرة، نفذ أمر البذر لإنشاء إعدادات السنتر وحساب المدير الرئيسي:
```bash
npm run seed
```
> **بيانات حساب السوبر أدمن المنشأ تلقائياً:**
> * 📱 **الهاتف**: `01000000000`
> * 📧 **البريد**: `admin@centerk.com`
> * 🔑 **كلمة المرور**: `Admin@123456`
> * 🛡️ **الصلاحية**: `super_admin`

---

## 🛡️ 4. فحص الأمان الآلي (Automated Security Check)

للتأكد من سلامة جميع آليات التشفير والأمان:
```bash
npm run test:security
```
ستظهر لك رسالة النجاح الخضراء:
`🎉 All 4 Security & Logic Tests Passed Successfully!`

---

## 🏃 5. تشغيل خادم الـ API

### خيار أ: وضع التطوير مع التحديث التلقائي (Development Mode - مستحسن)
```bash
npm run dev
```

### خيار ب: وضع الإنتاج (Production Build)
```bash
npm run build
npm start
```

عند بدء التشغيل بنجاح، ستشاهد الرسالة الترحيبية في الـ Terminal:
```
  ┌───────────────────────────────────────────┐
  │  🎓 Education Center API                  │
  │  🚀 Running on: http://localhost:5000      │
  │  📚 Swagger UI:  http://localhost:5000/api-docs│
  │  📦 Environment: development              │
  └───────────────────────────────────────────┘
```

---

## 🧪 6. كيفية تجربة الـ APIs واختبارها

### 🌐 أولاً: عبر المتصفح مباشرة (Swagger UI)
1. افتح متصفحك وادخل على:
   👉 **`http://localhost:5000/api-docs`**
2. انزل إلى مسار **`POST /auth/login`** واضغط على زر **"Try it out"**.
3. ضع بيانات الدخول:
   ```json
   {
     "identifier": "01000000000",
     "password": "Admin@123456"
   }
   ```
4. اضغط **Execute**؛ ستستلم الـ `accessToken`.
5. انسخ التوكن واصعد لأعلى الصفحة واضغط على الزر الأخضر **Authorize 🔓**.
6. الصق التوكن واضغط **Authorize**.
7. الآن كل الـ APIs المحمية مفتوحة لك لتجربتها مباشرة وبضغطة زر واحدة!

---

### 📦 ثانياً: عبر برنامج Postman
1. افتح برنامج Postman.
2. اضغط على زر **Import** في أعلى اليسار.
3. اختر الملف الموجود في مشروعك:  
   📁 `backend/docs/CenterK_Postman_Collection.json`
4. ستظهر لك مجموعة **"CenterK Education Center API"** مقسمة في 5 مجلدات جاهزة.
5. نفذ طلب **Login** أولاً؛ وسيقوم Postman تلقائياً بتحديث متغير `{{accessToken}}` واستخدامه في باقي الطلبات بدون أي تدخل يدوي منك!

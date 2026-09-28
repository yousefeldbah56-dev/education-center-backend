/**
 * 📖 OpenAPI 3.0 / Swagger Specification for CenterK Education Center API
 */
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CenterK Education Center Management System API',
    version: '1.0.0',
    description:
      'وثائق ومواصفات واجهات برمجة التطبيقات (REST APIs) لنظام إدارة سنتر الدروس التعليمي (نظام الحضور بالـ QR، الحسابات، المجموعات، والميديا).\n\n**للتجربة**: اضغط على زر **Authorize** وضع الـ Access Token بصيغة: `Bearer <token>`',
    contact: {
      name: 'CenterK Tech Team',
      email: 'admin@centerk.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'أدخل الـ Access Token المأخوذ من مسار تسجيل الدخول',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'بيانات غير صالحة (Validation Error)' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'phone' },
                message: { type: 'string', example: 'رقم الهاتف يجب أن يكون رقم مصري صالح' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '67d8f9e0a1b2c3d4e5f6a7b8' },
          name: { type: 'string', example: 'أحمد محمود' },
          phone: { type: 'string', example: '01012345678' },
          email: { type: 'string', example: 'ahmed@example.com' },
          role: { type: 'string', enum: ['super_admin', 'admin', 'teacher', 'student'], example: 'student' },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
          mustChangePassword: { type: 'boolean', example: false },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: '1. Authentication', description: 'مسارات تسجيل الدخول، تجديد التوكن، والملف الشخصي وتوكنات الإشعارات' },
    { name: '2. Students', description: 'إدارة شؤون الطلاب وبطاقات الـ QR المشفرة بـ AES-256' },
    { name: '3. Teachers', description: 'إدارة المدرسين والنسب المالية والمحافظ' },
    { name: '4. Groups & Subjects', description: 'المواد الدراسية والمجموعات وسعة القاعات' },
    { name: '5. Sessions & Attendance', description: 'الحصص، كود الـ QR الدوار، وتسجيل الحضور المزدوج' },
    { name: '6. Finance & Accounting', description: 'الفواتير، الدفعات، تسوية المدرسين، المصروفات، وصافي الأرباح' },
    { name: '7. Digital Content (LMS)', description: 'مكتبة الفيديوهات والمذكرات وبوابة حماية الاشتراكات' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['1. Authentication'],
        summary: 'تسجيل الدخول (Login)',
        description: 'تسجيل الدخول برقم الهاتف أو البريد الإلكتروني مع كلمة المرور (Rate limited: 10 محاولات / 15 دقيقة)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string', example: '01000000000', description: 'رقم الهاتف أو البريد الإلكتروني' },
                  password: { type: 'string', example: 'Admin@123456', description: 'كلمة المرور' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'تم تسجيل الدخول بنجاح',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'تم تسجيل الدخول بنجاح' },
                    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'بيانات الاعتماد غير صحيحة أو الحساب غير مفعل' },
          429: { description: 'تجاوز عدد المحاولات المسموح بها' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['1. Authentication'],
        summary: 'تجديد الـ Access Token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'تم تجديد رمز الدخول بنجاح',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'تم تجديد رمز الدخول بنجاح' },
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'رمز التحديث غير صالح أو منتهي الصلاحية' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['1. Authentication'],
        summary: 'بيانات المستخدم الحالي',
        responses: {
          200: {
            description: 'الملف الشخصي للمستخدم',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'غير مصرح بالدخول' },
        },
      },
    },
    '/auth/device-token': {
      post: {
        tags: ['1. Authentication'],
        summary: 'تسجيل توكن جهاز الموبايل للإشعارات (FCM Token)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string', example: 'fcm_token_device_abc12345' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم تسجيل توكن الإشعارات للجهاز بنجاح' },
        },
      },
      delete: {
        tags: ['1. Authentication'],
        summary: 'إلغاء تسجيل توكن جهاز الموبايل عند تسجيل الخروج',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string', example: 'fcm_token_device_abc12345' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم إلغاء تسجيل توكن الإشعارات للجهاز بنجاح' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['1. Authentication'],
        summary: 'تغيير كلمة المرور',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword', 'confirmPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'Admin@123456' },
                  newPassword: { type: 'string', example: 'NewSecret@2026' },
                  confirmPassword: { type: 'string', example: 'NewSecret@2026' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم تغيير كلمة المرور بنجاح' },
          400: { description: 'كلمة المرور الحالية غير صحيحة أو البيانات غير متطابقة' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['1. Authentication'],
        summary: 'تسجيل الخروج',
        responses: {
          200: { description: 'تم تسجيل الخروج بنجاح ومسح الكوكيز' },
        },
      },
    },
    '/students': {
      post: {
        tags: ['2. Students'],
        summary: 'إضافة طالب جديد (SuperAdmin & Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'grade'],
                properties: {
                  name: { type: 'string', example: 'محمد إبراهيم' },
                  phone: { type: 'string', example: '01012345678' },
                  email: { type: 'string', example: 'mohamed@gmail.com' },
                  parentName: { type: 'string', example: 'إبراهيم علي' },
                  parentPhone: { type: 'string', example: '01198765432' },
                  grade: { type: 'string', example: 'الصف الثالث الثانوي' },
                  packageId: { type: 'string', example: '67d8f9e0a1b2c3d4e5f6a7b8' },
                  subjects: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'تم إضافة الطالب وتوليد كود الـ QR المشفر' },
          409: { description: 'رقم الهاتف أو البريد مسجل مسبقاً' },
        },
      },
      get: {
        tags: ['2. Students'],
        summary: 'قائمة الطلاب مع الفلاتر والصفحات',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'بحث بالاسم أو الهاتف' },
          { name: 'grade', in: 'query', schema: { type: 'string' } },
          { name: 'subscriptionStatus', in: 'query', schema: { type: 'string', enum: ['active', 'pending', 'overdue', 'suspended'] } },
        ],
        responses: {
          200: { description: 'قائمة الطلاب' },
        },
      },
    },
    '/students/{id}/qr': {
      get: {
        tags: ['2. Students'],
        summary: 'جلب كود الـ QR المشفر لبطاقة الطالب',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'كود الـ QR المشفر بـ AES-256-GCM',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string' },
                    qrData: { type: 'string', example: '3a8f...:19e2...:7b4c...' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/teachers': {
      post: {
        tags: ['3. Teachers'],
        summary: 'إضافة مدرس جديد وتحديد النسبة المالية',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'salaryPercentage'],
                properties: {
                  name: { type: 'string', example: 'أ. حسام خليل' },
                  phone: { type: 'string', example: '01234567890' },
                  salaryPercentage: { type: 'number', minimum: 0, maximum: 100, example: 75 },
                  subjects: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'تم إضافة المدرس بنجاح' },
        },
      },
      get: {
        tags: ['3. Teachers'],
        summary: 'قائمة المدرسين',
        responses: {
          200: { description: 'قائمة المدرسين' },
        },
      },
    },
    '/groups': {
      post: {
        tags: ['4. Groups & Subjects'],
        summary: 'إنشاء مجموعة دراسية جديدة',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'subjectId', 'teacherId', 'grade', 'capacity', 'schedule'],
                properties: {
                  name: { type: 'string', example: 'مجموعة الأحد والثلاثاء - فيزياء' },
                  subjectId: { type: 'string' },
                  teacherId: { type: 'string' },
                  grade: { type: 'string', example: 'الصف الثالث الثانوي' },
                  capacity: { type: 'integer', example: 50 },
                  schedule: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day: { type: 'string', example: 'Sunday' },
                        startTime: { type: 'string', example: '16:00' },
                        endTime: { type: 'string', example: '18:00' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'تم إنشاء المجموعة بنجاح' },
        },
      },
      get: {
        tags: ['4. Groups & Subjects'],
        summary: 'قائمة المجموعات الدراسية',
        responses: {
          200: { description: 'قائمة المجموعات' },
        },
      },
    },
    '/groups/{id}/students': {
      post: {
        tags: ['4. Groups & Subjects'],
        summary: 'تسجيل طالب في المجموعة مع فحص السعة الاستيعابية',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studentId'],
                properties: {
                  studentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم إضافة الطالب للمجموعة بنجاح' },
          400: { description: 'المجموعة مكتملة العدد أو الطالب مسجل مسبقاً' },
        },
      },
    },
    '/sessions': {
      post: {
        tags: ['5. Sessions & Attendance'],
        summary: 'إنشاء حصة جديدة وتجهيز سجل الحضور الأولي',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subjectId', 'teacherId', 'groupId', 'date', 'startTime', 'endTime'],
                properties: {
                  subjectId: { type: 'string' },
                  teacherId: { type: 'string' },
                  groupId: { type: 'string' },
                  date: { type: 'string', example: '2026-09-18' },
                  startTime: { type: 'string', example: '16:00' },
                  endTime: { type: 'string', example: '18:00' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'تم إنشاء الحصة بنجاح' },
        },
      },
      get: {
        tags: ['5. Sessions & Attendance'],
        summary: 'قائمة الحصص مع الفلاتر',
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string' } },
          { name: 'groupId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['upcoming', 'running', 'finished', 'cancelled'] } },
        ],
        responses: {
          200: { description: 'قائمة الحصص' },
        },
      },
    },
    '/sessions/{id}/qr': {
      get: {
        tags: ['5. Sessions & Attendance'],
        summary: 'كود الـ QR الدوار المباشر للحصة (يعرض على شاشة القاعة ويتجدد كل 30 ثانية)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'كود الـ QR المشفر مع مدة الصلاحية المتبقية بالثواني',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessionId: { type: 'string' },
                    qrData: { type: 'string' },
                    expiresInSeconds: { type: 'integer', example: 30 },
                    expiresAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/sessions/scan/session': {
      post: {
        tags: ['5. Sessions & Attendance'],
        summary: 'مسح الطالب لكود الحصة المعروض في القاعة من موبايله',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['qrData'],
                properties: {
                  qrData: { type: 'string', description: 'النص المقروء بكاميرا الموبايل من شاشة القاعة' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم تسجيل حضورك بنجاح! 🎉' },
          400: { description: 'انتهت صلاحية الكود أو تم تسجيل الحضور مسبقاً' },
        },
      },
    },
    '/sessions/scan/student': {
      post: {
        tags: ['5. Sessions & Attendance'],
        summary: 'مسح موظف الاستقبال لكارت الطالب عند مدخل السنتر',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId', 'qrData'],
                properties: {
                  sessionId: { type: 'string' },
                  qrData: { type: 'string', description: 'النص المقروء من كارت الطالب' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم تسجيل حضور الطالب بنجاح' },
        },
      },
    },
    '/finance/invoices': {
      post: {
        tags: ['6. Finance & Accounting'],
        summary: 'إصدار فاتورة اشتراك شهرية لطالب',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studentId', 'month', 'totalAmount', 'dueDate'],
                properties: {
                  studentId: { type: 'string' },
                  month: { type: 'string', example: '2026-09' },
                  totalAmount: { type: 'number', minimum: 0, example: 600 },
                  dueDate: { type: 'string', example: '2026-09-10' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'تم إنشاء الفاتورة بنجاح' },
          409: { description: 'تم إصدار فاتورة مسبقاً لنفس الطالب لنفس الشهر' },
        },
      },
      get: {
        tags: ['6. Finance & Accounting'],
        summary: 'قائمة الفواتير (الطلاب يرون فواتيرهم فقط)',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'partial', 'paid', 'overdue'] } },
        ],
        responses: {
          200: { description: 'قائمة الفواتير' },
        },
      },
    },
    '/finance/payments': {
      post: {
        tags: ['6. Finance & Accounting'],
        summary: 'تسجيل دفعة مالية مع حماية ضد الدفع الزائد واحتساب حصة المدرس',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['invoiceId', 'studentId', 'amount', 'method'],
                properties: {
                  invoiceId: { type: 'string' },
                  studentId: { type: 'string' },
                  amount: { type: 'number', minimum: 0.01, example: 300 },
                  method: { type: 'string', enum: ['cash', 'visa', 'instapay', 'vodafone_cash'], example: 'cash' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'تم تسجيل الدفعة بنجاح وتحديث الفاتورة ومحفظة المدرس' },
          400: { description: 'المبلغ أكبر من المتبقي أو الفاتورة مسددة بالكامل' },
        },
      },
    },
    '/finance/wallets/{teacherId}': {
      get: {
        tags: ['6. Finance & Accounting'],
        summary: 'كشف حساب محفظة المدرس (الأرباح والمستحقات المعلقة)',
        parameters: [{ name: 'teacherId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'رصيد ومستحقات المدرس' },
        },
      },
    },
    '/finance/wallets/settle': {
      post: {
        tags: ['6. Finance & Accounting'],
        summary: 'تسوية وصرف مستحقات المدرس (SuperAdmin فقط)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['teacherId', 'amount'],
                properties: {
                  teacherId: { type: 'string' },
                  amount: { type: 'number', minimum: 0.01, example: 1500 },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'تم تسوية مستحقات المدرس بنجاح' },
          400: { description: 'مبلغ التسوية أكبر من الرصيد المعلق' },
        },
      },
    },
    '/finance/summary': {
      get: {
        tags: ['6. Finance & Accounting'],
        summary: 'تقرير صافي أرباح السنتر والمديونيات (SuperAdmin فقط)',
        responses: {
          200: {
            description: 'صافي الربح والإيرادات والمصروفات',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: {
                      type: 'object',
                      properties: {
                        totalRevenue: { type: 'number', example: 50000 },
                        totalExpenses: { type: 'number', example: 12000 },
                        totalTeacherCuts: { type: 'number', example: 25000 },
                        netProfit: { type: 'number', example: 13000 },
                        uncollectedDebt: { type: 'number', example: 4500 },
                        unpaidInvoicesCount: { type: 'integer', example: 8 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/media/videos': {
      get: {
        tags: ['7. Digital Content (LMS)'],
        summary: 'فيديوهات الشرح (مع فحص حالة الاشتراك للطلاب)',
        parameters: [{ name: 'subjectId', in: 'query', schema: { type: 'string' } }],
        responses: {
          200: { description: 'قائمة الفيديوهات' },
        },
      },
    },
    '/media/pdfs': {
      get: {
        tags: ['7. Digital Content (LMS)'],
        summary: 'المذكرات وملفات الـ PDF',
        parameters: [{ name: 'subjectId', in: 'query', schema: { type: 'string' } }],
        responses: {
          200: { description: 'قائمة المذكرات' },
        },
      },
    },
  },
};

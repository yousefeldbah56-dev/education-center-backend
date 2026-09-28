import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  recordPayment,
  getTeacherWallet,
  settleTeacherWallet,
  createExpense,
  getExpenses,
  createPackage,
  getPackages,
  getFinancialSummary,
} from '../controllers/finance.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createInvoiceSchema,
  createPaymentSchema,
  createExpenseSchema,
  settleTeacherWalletSchema,
  createPackageSchema,
} from '../validations/finance.validation.js';

const router = Router();

router.use(authMiddleware);

// ─── Invoices ──────────────────────────────────────────────────
router.post(
  '/invoices',
  authorize('super_admin', 'admin'),
  validate(createInvoiceSchema),
  createInvoice
);

router.get('/invoices', getInvoices);

// ─── Payments ──────────────────────────────────────────────────
router.post(
  '/payments',
  authorize('super_admin', 'admin'),
  validate(createPaymentSchema),
  recordPayment
);

// ─── Teacher Wallets ───────────────────────────────────────────
router.get(
  '/wallets/:teacherId',
  authorize('super_admin', 'admin', 'teacher'),
  getTeacherWallet
);

router.post(
  '/wallets/settle',
  authorize('super_admin'),
  validate(settleTeacherWalletSchema),
  settleTeacherWallet
);

// ─── Operating Expenses ────────────────────────────────────────
router.post(
  '/expenses',
  authorize('super_admin', 'admin'),
  validate(createExpenseSchema),
  createExpense
);

router.get(
  '/expenses',
  authorize('super_admin', 'admin'),
  getExpenses
);

// ─── Packages ──────────────────────────────────────────────────
router.post(
  '/packages',
  authorize('super_admin', 'admin'),
  validate(createPackageSchema),
  createPackage
);

router.get('/packages', getPackages);

// ─── Financial Summary & Net Profit ────────────────────────────
router.get(
  '/summary',
  authorize('super_admin'),
  getFinancialSummary
);

export default router;

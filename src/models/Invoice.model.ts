import mongoose, { Document, Schema, Types } from 'mongoose';

export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  month: string; // e.g. "2026-09"
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Invoice month is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: [0, 'Remaining amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// One invoice per student per month
invoiceSchema.index({ studentId: 1, month: 1 }, { unique: true });

export const InvoiceModel = mongoose.model<IInvoice>('Invoice', invoiceSchema);

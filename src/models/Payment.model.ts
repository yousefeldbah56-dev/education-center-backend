import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentMethod = 'cash' | 'visa' | 'instapay' | 'vodafone_cash';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  paidDate: Date;
  collectedBy: Types.ObjectId; // Admin/SuperAdmin who collected the payment
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'], // 🛡️ Prevent zero/negative payments
    },
    method: {
      type: String,
      enum: ['cash', 'visa', 'instapay', 'vodafone_cash'],
      required: [true, 'Payment method is required'],
    },
    paidDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

export const PaymentModel = mongoose.model<IPayment>('Payment', paymentSchema);

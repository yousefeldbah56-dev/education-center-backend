import mongoose, { Document, Schema, Types } from 'mongoose';

export type ExpenseCategory =
  | 'electricity'
  | 'water'
  | 'internet'
  | 'rent'
  | 'salary'
  | 'maintenance'
  | 'supplies'
  | 'other';

export interface IExpense extends Document {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  createdBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      enum: ['electricity', 'water', 'internet', 'rent', 'salary', 'maintenance', 'supplies', 'other'],
      required: [true, 'Expense category is required'],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    createdBy: {
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

export const ExpenseModel = mongoose.model<IExpense>('Expense', expenseSchema);

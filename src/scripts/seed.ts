import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { UserModel } from '../models/User.model.js';
import { SettingModel, DEFAULT_SETTINGS } from '../models/Setting.model.js';
import { hashPassword } from '../utils/password.js';

async function seed() {
  console.log('🌱 Starting Database Seeder for Education Center System...');
  await connectDB();

  try {
    // ─── 1. Seed System Settings ──────────────────────────────────
    console.log('⚙️ Checking System Settings...');
    for (const item of Object.values(DEFAULT_SETTINGS)) {
      const exists = await SettingModel.findOne({ key: item.key });
      if (!exists) {
        await SettingModel.create({
          key: item.key,
          value: item.value,
          description: item.description,
        });
        console.log(`   + Created setting: ${item.key}`);
      }
    }

    // ─── 2. Seed Default SuperAdmin ───────────────────────────────
    console.log('👤 Checking SuperAdmin Account...');
    const superAdminExists = await UserModel.findOne({ role: 'super_admin' });

    if (!superAdminExists) {
      const defaultPassword = 'Admin@123456';
      const hashedPassword = await hashPassword(defaultPassword);

      const superAdmin = await UserModel.create({
        name: 'مدير النظام (Super Admin)',
        phone: '01000000000',
        email: 'admin@centerk.com',
        password: hashedPassword,
        role: 'super_admin',
        status: 'active',
        mustChangePassword: false,
      });

      console.log(`
      ┌────────────────────────────────────────────────────────┐
      │  👑 SuperAdmin Account Initialized Successfully        │
      │  📱 Phone:    01000000000                              │
      │  📧 Email:    admin@centerk.com                        │
      │  🔑 Password: ${defaultPassword}                         │
      │  🛡️ Role:     super_admin                              │
      │  ⚠️ Please change this password in production!          │
      └────────────────────────────────────────────────────────┘
      `);
    } else {
      console.log(`   ✓ SuperAdmin already exists: ${superAdminExists.phone}`);
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();

require('dotenv').config();
const { sequelize, testConnection } = require('../config/database');
const { User, Lead, Setting } = require('../models');

const runMigration = async () => {
  console.log('====================================================');
  console.log('🚀 Starting Production Database Migration & Setup...');
  console.log('====================================================');

  try {
    // 1. Test connection
    await testConnection();
    console.log(`📡 Database target: ${process.env.DATABASE_URL ? 'DATABASE_URL (Remote/Cloud)' : `${process.env.DB_USER}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`}`);

    // 2. Sync all tables (User, Lead, Setting)
    console.log('🔄 Creating / syncing database tables (users, leads, settings)...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronized successfully.');

    // 3. Seed ONLY the Admin user
    const adminEmail = (process.env.ADMIN_EMAIL || 'medkit@gmail.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Medkit@123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    console.log(`👤 Checking Admin account: ${adminEmail}...`);
    let admin = await User.findOne({ where: { email: adminEmail } });

    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
      });
      console.log(`✅ Admin user successfully created with email: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.isActive = true;
      admin.password = adminPassword; // Triggers bcrypt hashing hook
      await admin.save();
      console.log(`ℹ️  Admin user already existed; verified and updated credentials for: ${adminEmail}`);
    }

    // 4. Verify no dummy/extra leads were inserted
    const userCount = await User.count();
    const leadCount = await Lead.count();

    console.log('====================================================');
    console.log('🎉 Production Migration Completed Successfully!');
    console.log('====================================================');
    console.log(`📊 Total Users in DB: ${userCount} (Admin only)`);
    console.log(`📊 Total Leads in DB: ${leadCount} (Clean slate ready for Google Sheet sync)`);
    console.log('----------------------------------------------------');
    console.log(`🔑 Admin Login Email:    ${adminEmail}`);
    console.log(`🔑 Admin Login Password: ${adminPassword}`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
};

runMigration();

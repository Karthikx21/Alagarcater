import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Permanent admin credentials
const ADMIN_USERNAME = 'algarcatering';
const ADMIN_PASSWORD = 'Algar@2025!';
const ADMIN_NAME = 'Algar Catering Administrator';

async function resetAdmin() {
  try {
    console.log('🔄 Resetting admin user credentials...');
    
    // Delete all existing users (optional - remove if you want to keep other users)
    const existingUsers = await prisma.user.findMany();
    if (existingUsers.length > 0) {
      console.log(`⚠️  Found ${existingUsers.length} existing user(s). Removing all users...`);
      await prisma.user.deleteMany({});
    }

    // Create fresh admin user
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    
    const user = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashedPassword,
        name: ADMIN_NAME
      }
    });

    console.log('✅ Admin user reset successfully!');
    console.log('User details:', {
      id: user.id,
      username: user.username,
      name: user.name
    });

    console.log('\n📝 Admin Credentials:');
    console.log('Username:', ADMIN_USERNAME);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Please store these credentials securely!');
    console.log('💡 You can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error resetting admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();

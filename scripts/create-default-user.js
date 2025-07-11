import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Permanent admin credentials
const ADMIN_USERNAME = 'algarcatering';
const ADMIN_PASSWORD = 'Algar@2025!';
const ADMIN_NAME = 'Algar Catering Administrator';

async function main() {
  try {
    console.log('🔧 Setting up permanent admin user...');
    
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: ADMIN_USERNAME }
    });

    if (existingUser) {
      console.log('⚠️  Admin user already exists. Updating password...');
      
      // Update existing user password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      const updatedUser = await prisma.user.update({
        where: { username: ADMIN_USERNAME },
        data: {
          password: hashedPassword,
          name: ADMIN_NAME
        }
      });

      console.log('✅ Admin user password updated successfully!');
      console.log('User details:', {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name
      });
    } else {
      // Create the default user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      const user = await prisma.user.create({
        data: {
          username: ADMIN_USERNAME,
          password: hashedPassword,
          name: ADMIN_NAME
        }
      });

      console.log('✅ Permanent admin user created successfully!');
      console.log('User details:', {
        id: user.id,
        username: user.username,
        name: user.name
      });
    }

    console.log('\n📝 Admin Credentials:');
    console.log('Username:', ADMIN_USERNAME);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Please store these credentials securely!');
    console.log('💡 Consider changing the password after first login.');

  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
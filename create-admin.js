import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createNewAdmin() {
  try {
    // Delete existing admin user if it exists
    await prisma.user.deleteMany({
      where: { username: 'admin' }
    });

    // Create a fresh admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator'
      }
    });

    console.log('✅ New admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: password123');
    console.log('User ID:', user.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewAdmin();

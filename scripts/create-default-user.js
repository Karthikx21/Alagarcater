import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingUser) {
      console.log('User "admin" already exists');
      return;
    }

    // Create the default user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator'
      }
    });

    console.log('Default user created successfully:', {
      id: user.id,
      username: user.username,
      name: user.name
    });
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
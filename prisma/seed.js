const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create permanent admin user
  console.log('👤 Creating admin user...');
  const ADMIN_USERNAME = 'algarcatering';
  const ADMIN_PASSWORD = 'Algar@2025!';
  
  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    
    await prisma.user.upsert({
      where: { username: ADMIN_USERNAME },
      update: {
        password: hashedPassword,
        name: 'Algar Catering Administrator'
      },
      create: {
        username: ADMIN_USERNAME,
        password: hashedPassword,
        name: 'Algar Catering Administrator'
      }
    });
    
    console.log('✅ Admin user created/updated successfully');
    console.log('   Username:', ADMIN_USERNAME);
    console.log('   Password:', ADMIN_PASSWORD);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }

  // Seed Menu Items
  console.log('🍽️  Seeding menu items...');
  await prisma.menuItem.createMany({
    data: [
      { name: 'Veg Biryani', tamilName: 'வெஜ் பிரியாணி', category: 'Main Course', type: 'Vegetarian', price: 120 },
      { name: 'Chicken Biryani', tamilName: 'சிக்கன் பிரியாணி', category: 'Main Course', type: 'Non-Vegetarian', price: 180 },
      { name: 'Paneer Butter Masala', tamilName: 'பனீர் பட்டர் மசாலா', category: 'Main Course', type: 'Vegetarian', price: 150 },
      { name: 'Parotta', tamilName: 'பரோட்டா', category: 'Bread', type: 'Vegetarian', price: 30 },
      { name: 'Chicken Curry', tamilName: 'சிக்கன் கறி', category: 'Main Course', type: 'Non-Vegetarian', price: 160 },
      { name: 'Dal Fry', tamilName: 'தால் பிரை', category: 'Main Course', type: 'Vegetarian', price: 90 },
      { name: 'Rasam', tamilName: 'ரசம்', category: 'Soup', type: 'Vegetarian', price: 60 },
      { name: 'Curd Rice', tamilName: 'தயிர் சாதம்', category: 'Main Course', type: 'Vegetarian', price: 80 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Menu items seeded successfully');

  // Seed a sample customer
  console.log('👥 Seeding sample customer...');
  const customer = await prisma.customer.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      name: 'Ravi Kumar',
      mobile: '9876543210',
      address: 'No. 15, Gandhi Street, T. Nagar, Chennai - 600017',
      notes: 'Prefers vegetarian options'
    }
  });
  console.log('✅ Sample customer seeded successfully');

  // Seed a sample order
  console.log('📝 Seeding sample order...');
  const existingOrder = await prisma.order.findFirst({
    where: { orderId: 'ORD-001' }
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderId: 'ORD-001',
        customerId: customer.id,
        guestCount: 50,
        eventDate: new Date(),
        selectedItems: [
          { menuItemId: 1, quantity: 50, price: 120, name: 'Veg Biryani' },
          { menuItemId: 2, quantity: 50, price: 180, name: 'Chicken Biryani' },
        ],
        subtotal: 15000,
        serviceCharge: 750,
        gst: 2700,
        total: 18450,
        status: 'confirmed',
        paymentStatus: 'due',
        amountPaid: 0,
        amountDue: 18450,
        notes: 'Sample order for demonstration'
      },
    });
    console.log('✅ Sample order seeded successfully');
  } else {
    console.log('⚠️  Sample order already exists, skipping...');
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Admin Login Credentials:');
  console.log('   Username:', ADMIN_USERNAME);
  console.log('   Password:', ADMIN_PASSWORD);
  console.log('\n⚠️  IMPORTANT: Please store these credentials securely!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Seed Menu Items
  await prisma.menuItem.createMany({
    data: [
      { name: 'Veg Biryani', tamilName: 'வெஜ் பிரியாணி', category: 'lunch', type: 'veg', price: 120, description: 'Delicious vegetarian biryani', isActive: true },
      { name: 'Chicken Biryani', tamilName: 'சிக்கன் பிரியாணி', category: 'lunch', type: 'non-veg', price: 180, description: 'Spicy chicken biryani', isActive: true },
      { name: 'Paneer Butter Masala', tamilName: 'பனீர் பட்டர் மசாலா', category: 'lunch', type: 'veg', price: 150, description: 'Rich paneer curry', isActive: true },
      { name: 'Parotta', tamilName: 'பரோட்டா', category: 'dinner', type: 'veg', price: 30, description: 'Flaky layered bread', isActive: true },
    ],
    skipDuplicates: true,
  });

  // Seed a customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Ravi Kumar',
      mobile: '9876543210',
      address: 'Chennai',
    },
  });

  // Seed an order
  await prisma.order.create({
    data: {
      orderId: 'ORD-001',
      customerId: customer.id,
      guestCount: 50,
      eventDate: new Date(),
      selectedItems: [
        { menuItemId: 1, quantity: 50, price: 120 },
        { menuItemId: 2, quantity: 50, price: 180 },
      ],
      subtotal: 15000,
      serviceCharge: 750,
      gst: 2700,
      total: 18450,
      status: 'confirmed',
      paymentStatus: 'due',
      amountPaid: 0,
      amountDue: 18450,
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

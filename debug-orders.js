import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugOrders() {
  try {
    // Get all existing orders with their orderIds
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Existing orders:');
    orders.forEach(order => {
      console.log(`ID: ${order.id}, OrderID: ${order.orderId}, Created: ${order.createdAt}`);
    });
    
    // Test the NEW logic for generating next orderId
    const currentYear = new Date().getFullYear();
    const orderIdPrefix = `ACS${currentYear}`;
    
    // Find all orders for the current year and extract the highest number
    const ordersThisYear = await prisma.order.findMany({
      where: {
        orderId: {
          startsWith: orderIdPrefix
        }
      },
      select: { orderId: true },
    });
    
    console.log('\nAll orders this year:', ordersThisYear);
    
    let maxNumber = 0;
    ordersThisYear.forEach(order => {
      const match = order.orderId.match(/ACS(\d{4})(\d{3})/);
      if (match && match[1] === currentYear.toString()) {
        const num = parseInt(match[2], 10);
        console.log(`Extracted number from ${order.orderId}: ${num}`);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    const nextOrderId = `${orderIdPrefix}${String(nextNumber).padStart(3, '0')}`;
    console.log(`Max number found: ${maxNumber}`);
    console.log(`Next orderId would be: ${nextOrderId}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOrders();

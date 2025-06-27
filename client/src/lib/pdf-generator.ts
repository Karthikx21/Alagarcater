import { OrderData, SelectedMenuItem } from "@/types";

/**
 * Groups menu items by category
 * @param items Array of menu items
 * @returns Object with categories as keys and arrays of items as values
 */
function groupItemsByCategory(items: SelectedMenuItem[]): Record<string, SelectedMenuItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SelectedMenuItem[]>);
}

/**
 * Calculates the total price for a category
 * @param items Array of menu items in a category
 * @param guestCount Number of guests
 * @returns Total price for the category
 */
function calculateCategoryTotal(items: SelectedMenuItem[], guestCount: number): number {
  return items.reduce((total, item) => total + (item.price * guestCount), 0);
}

/**
 * Generates a PDF for the order
 * @param orderData The order data
 * @param type The type of PDF to generate (summary, detailed, categoryInvoice, or itemizedInvoice)
 * @param forPrint Whether to open the print dialog or download as PDF
 * @returns Promise that resolves when the PDF is generated
 */
export async function generatePDF(
  orderData: OrderData, 
  type: 'summary' | 'detailed' | 'categoryInvoice' | 'itemizedInvoice' = 'detailed', 
  forPrint: boolean = false
): Promise<void> {
  try {
    // Create a new window with the order content
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      alert("Please allow popups to download PDF");
      return;
    }

    const logoUrl = `${window.location.origin}/src/assets/catering_logo.png`;
    
    // Create HTML content based on the type
    let menuItemsHTML = '';
    let documentTitle = '';
    
    if (type === 'detailed') {
      // Detailed view with prices and calculations (menu preview with prices)
      documentTitle = 'Menu Preview with Prices';
      menuItemsHTML = orderData.selectedItems.map(item => `
        <div class="menu-item">
          <div class="menu-details">
            <div class="menu-name">${item.name}</div>
            <div class="menu-tamil tamil">${item.tamilName || ''}</div>
          </div>
          <div class="menu-price">
            <div class="menu-calculation">₹${item.price} × ${orderData.guestCount} guests</div>
            <div>₹${(item.price * orderData.guestCount).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `).join('');
    } else if (type === 'summary') {
      // Summary view with just the menu items (no prices)
      documentTitle = 'Menu List';
      menuItemsHTML = orderData.selectedItems.map(item => `
        <div class="menu-item">
          <div class="menu-details">
            <div class="menu-name">${item.name}</div>
            <div class="menu-tamil tamil">${item.tamilName || ''}</div>
          </div>
        </div>
      `).join('');
    } else if (type === 'categoryInvoice') {
      // Format A: Category-wise invoice with totals (simplified)
      documentTitle = 'Category-wise Summary Invoice';
      const groupedItems = groupItemsByCategory(orderData.selectedItems);
      
      menuItemsHTML = Object.entries(groupedItems).map(([category, items]) => {
        const categoryTotal = calculateCategoryTotal(items, orderData.guestCount);
        const itemCount = items.length;
        
        return `
          <div class="category-section">
            <div class="category-header">
              <div class="category-name">${category}</div>
              <div class="category-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
              <div class="category-total">₹${categoryTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>
        `;
      }).join('');
    } else if (type === 'itemizedInvoice') {
      // Format B: Itemized invoice with three columns (category, items, count/amount)
      documentTitle = 'Category & Items Invoice';
      
      // Group items by category
      const groupedItems = groupItemsByCategory(orderData.selectedItems);
      
      // Create table header
      menuItemsHTML = `
        <div class="itemized-invoice">
          <table class="invoice-table">
            <thead>
              <tr>
                <th class="category-column">Category</th>
                <th class="items-column">Items</th>
                <th class="amount-column">Count & Amount</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Add rows for each category
      Object.entries(groupedItems).forEach(([category, items]) => {
        const categoryTotal = calculateCategoryTotal(items, orderData.guestCount);
        
        // Create the items list for this category
        const itemsList = items.map(item => `
          <div class="invoice-item">
            <div class="item-name">${item.name}</div>
            <div class="item-tamil tamil">${item.tamilName || ''}</div>
          </div>
        `).join('');
        
        // Add a row for this category
        menuItemsHTML += `
          <tr>
            <td class="category-cell">${category}</td>
            <td class="items-cell">${itemsList}</td>
            <td class="amount-cell">
              <div class="amount-info">
                <div class="item-count">${items.length} item${items.length !== 1 ? 's' : ''}</div>
                <div class="guest-count">${orderData.guestCount} guests</div>
                <div class="category-total">₹${categoryTotal.toLocaleString('en-IN')}</div>
              </div>
            </td>
          </tr>
        `;
      });
      
      // Close the table
      menuItemsHTML += `
            </tbody>
          </table>
        </div>
      `;
    }

    // Create the summary section based on the type
    let summaryHTML = '';
    
    if (type === 'detailed' || type === 'categoryInvoice' || type === 'itemizedInvoice') {
      // Invoice summary for detailed view and both invoice formats
      summaryHTML = `
        <div class="summary">
          <div class="section-title">Invoice Summary</div>
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${orderData.summary.subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div class="summary-row">
            <span>GST (18%):</span>
            <span>₹${orderData.summary.gst.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row summary-total">
            <span>Total Amount:</span>
            <span>₹${orderData.summary.total.toLocaleString('en-IN')}</span>
          </div>
          ${orderData.paymentStatus ? `
          <div class="summary-row">
            <span>Payment Status:</span>
            <span>${orderData.paymentStatus.charAt(0).toUpperCase() + orderData.paymentStatus.slice(1)}</span>
          </div>
          <div class="summary-row">
            <span>Amount Paid:</span>
            <span>₹${Number(orderData.amountPaid || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row">
            <span>Amount Due:</span>
            <span>₹${Number(orderData.amountDue || 0).toLocaleString('en-IN')}</span>
          </div>
          ` : ''}
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documentTitle} - ${orderData.orderId || 'Preview'}</title>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
          }
          .tamil {
            font-family: 'Noto Sans Tamil', sans-serif;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #E65100;
            padding-bottom: 20px;
          }
          .logo {
            display: block;
            margin: 0 auto 10px auto;
            height: 60px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #E65100;
            margin-bottom: 5px;
          }
          .company-tamil {
            font-size: 20px;
            color: #8D6E63;
            margin-bottom: 10px;
          }
          .company-address {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .company-contact {
            font-size: 14px;
            color: #666;
          }
          .order-id {
            font-size: 16px;
            color: #666;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            width: 120px;
            color: #666;
            font-weight: 500;
          }
          .info-value {
            font-weight: 600;
          }
          .menu-item {
            display: flex;
            justify-content: between;
            align-items: center;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 10px;
          }
          .menu-details {
            flex: 1;
          }
          .menu-name {
            font-weight: 600;
            margin-bottom: 3px;
          }
          .menu-tamil {
            color: #8D6E63;
            font-size: 14px;
            margin-bottom: 3px;
          }
          .menu-category {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
          }
          .menu-desc {
            color: #666;
            font-size: 12px;
          }
          .menu-price {
            text-align: right;
            font-weight: 600;
          }
          .menu-calculation {
            font-size: 12px;
            color: #666;
          }
          /* Category-wise invoice styles */
          .category-section {
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
          }
          .category-header {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 20px;
            align-items: center;
            background: #f5f5f5;
            padding: 15px;
          }
          .category-name {
            font-weight: 600;
            font-size: 16px;
            color: #E65100;
          }
          .category-count {
            font-weight: 500;
            color: #666;
            text-align: right;
          }
          .category-total {
            font-weight: 600;
            color: #333;
            text-align: right;
          }
          
          /* Itemized invoice table styles */
          .itemized-invoice {
            margin-top: 20px;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #ddd;
          }
          .invoice-table th {
            background-color: #f0f0f0;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
          }
          .invoice-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }
          .category-column {
            width: 20%;
          }
          .items-column {
            width: 50%;
          }
          .amount-column {
            width: 30%;
          }
          .category-cell {
            font-weight: 600;
            color: #E65100;
          }
          .items-cell {
            padding-top: 8px;
          }
          .invoice-item {
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #eee;
          }
          .invoice-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .amount-cell {
            text-align: right;
          }
          .amount-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .item-count {
            font-size: 14px;
            color: #666;
          }
          .guest-count {
            font-size: 14px;
            color: #666;
          }
          .category-total {
            font-weight: 600;
            color: #333;
            margin-top: 5px;
            font-size: 16px;
          }
          .summary {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .summary-total {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          /* Download button removed */
          .print-only {
            display: ${forPrint ? 'block' : 'none'};
          }
          .document-title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #E65100;
            text-transform: uppercase;
          }
        </style>
        <script>
          // Auto print when the document loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Alagar Catering Service A to Z Logo" class="logo" />
          <div class="company-name">Alagar Catering Service A to Z</div>
          <div class="company-tamil tamil">அழகர் கேட்டரிங் சர்வீஸ்</div>
          <div class="company-address">
            Palladam Main Road, Puliyampatti, Pollachi, 642002
          </div>
          <div class="company-contact">
            Cell: 9865750514 | GPay: 9655250514
          </div>
          ${orderData.orderId ? `<div class="order-id">Order ID: ${orderData.orderId}</div>` : ''}
        </div>

        <div class="document-title">${documentTitle}</div>

        <div class="grid">
          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="info-row">
              <div class="info-label">Name:</div>
              <div class="info-value">${orderData.customer.name}</div>
            </div>
            ${orderData.customer.tamilName ? `
            <div class="info-row">
              <div class="info-label tamil">தமிழ் பெயர்:</div>
              <div class="info-value tamil">${orderData.customer.tamilName}</div>
            </div>
            ` : ''}
            <div class="info-row">
              <div class="info-label">Mobile:</div>
              <div class="info-value">${orderData.customer.mobile}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Address:</div>
              <div class="info-value">${orderData.customer.address}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Event Details</div>
            <div class="info-row">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date(orderData.eventDate).toLocaleDateString('en-IN')}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Guests:</div>
              <div class="info-value">${orderData.guestCount} people</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${type.includes('Invoice') ? 'Invoice Items' : 'Selected Menu Items'}</div>
          ${menuItemsHTML}
        </div>

        ${summaryHTML}

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Alagar Catering Service A to Z. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // If for print, just open the print dialog
    if (forPrint) {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
    // Otherwise, the download will be triggered by the onload script
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error generating PDF. Please try again.");
  }
}

/**
 * Prints the order
 * @param orderData The order data
 * @returns Promise that resolves when the order is printed
 */
export async function printOrder(orderData: OrderData): Promise<void> {
  await generatePDF(orderData, 'detailed', true);
}

/**
 * Generates a menu list PDF without prices
 * @param orderData The order data
 * @returns Promise that resolves when the menu list is generated
 */
export async function generateMenuList(orderData: OrderData): Promise<void> {
  await generatePDF(orderData, 'summary', false);
}

/**
 * Generates a category-wise invoice (Format A)
 * Shows items grouped by category with category totals
 * @param orderData The order data
 * @param forPrint Whether to open the print dialog or download as PDF
 * @returns Promise that resolves when the invoice is generated
 */
export async function generateCategoryInvoice(orderData: OrderData, forPrint: boolean = false): Promise<void> {
  await generatePDF(orderData, 'categoryInvoice', forPrint);
}

/**
 * Generates an itemized invoice (Format B)
 * Shows full item list with prices and total
 * @param orderData The order data
 * @param forPrint Whether to open the print dialog or download as PDF
 * @returns Promise that resolves when the invoice is generated
 */
export async function generateItemizedInvoice(orderData: OrderData, forPrint: boolean = false): Promise<void> {
  await generatePDF(orderData, 'itemizedInvoice', forPrint);
}

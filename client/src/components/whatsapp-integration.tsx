"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Copy, ExternalLink } from "lucide-react";
import type { Order, Customer } from "../../../shared/schema";

interface WhatsAppIntegrationProps {
  order: Order;
  customer: Customer;
}

export default function WhatsAppIntegration({ order, customer }: WhatsAppIntegrationProps) {
  const [messageType, setMessageType] = useState<string>("confirmation");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const getOrderItemsText = () => {
    try {
      const items = typeof order.selectedItems === 'string' 
        ? JSON.parse(order.selectedItems) 
        : order.selectedItems || [];
      
      return items.map((item: { name?: string; quantity: number; price: number }, index: number) => 
        `${index + 1}. ${item.name || 'Item'} x ${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');
    } catch {
      return 'Items details unavailable';
    }
  };

  const formatEventDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateMessage = () => {
    const eventDateFormatted = formatEventDate(order.eventDate);
    const itemsText = getOrderItemsText();
    
    const templates = {
      confirmation: `🍽️ *Algar Catering - Order Confirmation*

Dear ${customer.name},

Thank you for choosing Algar Catering! Your order has been confirmed.

📋 *Order Details:*
Order ID: #${order.orderId}
Event Date: ${eventDateFormatted}
Guest Count: ${order.guestCount}

🥘 *Items Ordered:*
${itemsText}

💰 *Total Amount: ₹${order.total}*
Payment Status: ${order.paymentStatus}

We will deliver fresh, delicious food on time for your event. If you have any questions, please feel free to contact us.

Thank you for your business!
- Algar Catering Team`,

      reminder: `🔔 *Algar Catering - Event Reminder*

Dear ${customer.name},

This is a friendly reminder about your upcoming catering order.

📋 *Order Details:*
Order ID: #${order.orderId}
Event Date: ${eventDateFormatted}
Guest Count: ${order.guestCount}

Your order is being prepared and will be delivered on time. Please ensure someone is available to receive the delivery.

If you need to make any changes, please contact us as soon as possible.

Thank you!
- Algar Catering Team`,

      ready: `✅ *Algar Catering - Order Ready*

Dear ${customer.name},

Great news! Your catering order is ready for delivery/pickup.

📋 *Order Details:*
Order ID: #${order.orderId}
Event Date: ${eventDateFormatted}

Our team will be delivering your fresh, hot food shortly. Please be available to receive the order.

Thank you for choosing Algar Catering!
- Algar Catering Team`,

      delivered: `🎉 *Algar Catering - Order Delivered*

Dear ${customer.name},

Your catering order has been successfully delivered. We hope you and your guests enjoy the delicious food!

📋 *Order Details:*
Order ID: #${order.orderId}
Delivered on: ${formatEventDate(new Date())}

If you have any feedback or need catering services in the future, please don't hesitate to contact us.

Thank you for choosing Algar Catering!
- Algar Catering Team`,

      custom: customMessage
    };

    return templates[messageType as keyof typeof templates] || templates.confirmation;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Message copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const openWhatsApp = () => {
    const message = generateMessage();
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = customer.mobile.replace(/[^0-9]/g, '');
    
    // Add country code if not present (assuming India +91)
    const fullPhoneNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
    
    const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendWhatsAppMessage = async () => {
    setSending(true);
    try {
      // In a real implementation, you would call a WhatsApp Business API
      // For now, we'll simulate sending and just open WhatsApp Web
      await new Promise(resolve => setTimeout(resolve, 1000));
      openWhatsApp();
      alert("Opening WhatsApp with pre-filled message");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const message = generateMessage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />
          WhatsApp Communication
        </CardTitle>
        <CardDescription>
          Send order updates and confirmations to the customer via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="messageType">Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmation">Order Confirmation</SelectItem>
                <SelectItem value="reminder">Event Reminder</SelectItem>
                <SelectItem value="ready">Order Ready</SelectItem>
                <SelectItem value="delivered">Order Delivered</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="customerMobile">Customer Mobile</Label>
            <Input
              id="customerMobile"
              value={customer.mobile}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        {messageType === "custom" && (
          <div>
            <Label htmlFor="customMessage">Custom Message</Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter your custom message..."
              rows={6}
            />
          </div>
        )}

        <div>
          <Label htmlFor="messagePreview">Message Preview</Label>
          <Textarea
            id="messagePreview"
            value={message}
            readOnly
            rows={12}
            className="bg-muted font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={sendWhatsAppMessage} 
            disabled={sending || !message.trim()}
            className="flex-1"
          >
            <Send size={16} className="mr-2" />
            {sending ? 'Sending...' : 'Send via WhatsApp'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => copyToClipboard(message)}
            className="flex-1"
          >
            <Copy size={16} className="mr-2" />
            Copy Message
          </Button>
          <Button 
            variant="outline" 
            onClick={openWhatsApp}
          >
            <ExternalLink size={16} className="mr-2" />
            Open WhatsApp
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>💡 <strong>Tip:</strong> You can copy the message and paste it manually in WhatsApp, or click &quot;Send via WhatsApp&quot; to open WhatsApp Web with the pre-filled message.</p>
        </div>
      </CardContent>
    </Card>
  );
}

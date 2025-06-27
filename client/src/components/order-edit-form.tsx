"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X } from "lucide-react";
import type { Order, Customer, MenuItem } from "../../../shared/schema";

interface OrderItem {
  menuItemId: number;
  quantity: number;
  price: number;
  customizations?: unknown[];
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface OrderEditFormProps {
  orderId: string;
  onSave: (updatedOrder: Order) => void;
  onCancel: () => void;
}

export default function OrderEditForm({ orderId, onSave, onCancel }: OrderEditFormProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  // Form state
  const [editedOrder, setEditedOrder] = useState<Partial<OrderWithItems>>({});
  const [editedCustomer, setEditedCustomer] = useState<Partial<Customer>>({});

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      
      const orderData = await response.json();
      // Parse selectedItems from JSON if needed
      const orderWithItems = {
        ...orderData,
        items: typeof orderData.selectedItems === 'string' 
          ? JSON.parse(orderData.selectedItems) 
          : orderData.selectedItems || []
      };
      setOrder(orderWithItems);
      setEditedOrder(orderWithItems);
      
      // Fetch customer details
      const customerResponse = await fetch(`/api/customers/${orderData.customerId}`);
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomer(customerData);
        setEditedCustomer(customerData);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const checkIfEditable = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/editable`);
      if (response.ok) {
        const { editable } = await response.json();
        setIsEditable(editable);
      }
    } catch (error) {
      console.error('Error checking if order is editable:', error);
    }
  }, [orderId]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const items = await response.json();
        setMenuItems(items);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrderDetails();
    checkIfEditable();
    fetchMenuItems();
  }, [fetchOrderDetails, checkIfEditable, fetchMenuItems]);

  const handleSave = async () => {
    if (!order || !isEditable) return;

    setSaving(true);
    try {
      // Update customer if changed
      if (customer && Object.keys(editedCustomer).length > 0) {
        const customerResponse = await fetch(`/api/customers/${customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedCustomer)
        });
        if (!customerResponse.ok) throw new Error('Failed to update customer');
      }

      // Update order
      const orderResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedOrder,
          selectedItems: editedOrder.items || [],
          lastModified: new Date()
        })
      });
      
      if (!orderResponse.ok) throw new Error('Failed to update order');
      
      const updatedOrder = await orderResponse.json();
      alert('Order updated successfully');
      onSave(updatedOrder);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateOrderItem = (itemId: number, field: string, value: number) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.menuItemId === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeOrderItem = (itemId: number) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.menuItemId !== itemId)
    }));
  };

  const addOrderItem = (menuItemId: string) => {
    const menuItem = menuItems.find(item => item.id === parseInt(menuItemId));
    if (!menuItem) return;

    setEditedOrder(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          menuItemId: menuItem.id,
          quantity: 1,
          price: parseFloat(menuItem.price),
          customizations: []
        }
      ]
    }));
  };

  const calculateTotal = () => {
    return editedOrder.items?.reduce((total: number, item: OrderItem) => {
      return total + (item.price * item.quantity);
    }, 0) || 0;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading order details...</div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Order not found</div>
        </CardContent>
      </Card>
    );
  }

  if (!isEditable) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-amber-600 mb-2">Order Cannot Be Edited</div>
            <p className="text-muted-foreground">
              This order cannot be edited because the event date has passed or the order has been delivered/cancelled.
            </p>
            <Button onClick={onCancel} className="mt-4">Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit size={20} />
            Edit Order #{order.id.toString().slice(-8)}
          </CardTitle>
          <CardDescription>
            Make changes to this order before the event date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  value={editedCustomer.name || customer?.name || ''}
                  onChange={(e) => setEditedCustomer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerMobile">Mobile</Label>
                <Input
                  id="customerMobile"
                  value={editedCustomer.mobile || customer?.mobile || ''}
                  onChange={(e) => setEditedCustomer(prev => ({ ...prev, mobile: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={editedCustomer.address || customer?.address || ''}
                  onChange={(e) => setEditedCustomer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerNotes">Customer Notes</Label>
                <Textarea
                  id="customerNotes"
                  value={editedCustomer.notes || customer?.notes || ''}
                  onChange={(e) => setEditedCustomer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions, preferences, etc."
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={editedOrder.eventDate ? formatDate(editedOrder.eventDate) : formatDate(order.eventDate)}
                  onChange={(e) => setEditedOrder(prev => ({ 
                    ...prev, 
                    eventDate: new Date(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="guestCount">Guest Count</Label>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  value={editedOrder.guestCount || order.guestCount}
                  onChange={(e) => setEditedOrder(prev => ({ 
                    ...prev, 
                    guestCount: parseInt(e.target.value) 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedOrder.status || order.status}
                  onValueChange={(value) => setEditedOrder(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_preparation">In Preparation</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="orderNotes">Order Notes</Label>
                <Textarea
                  id="orderNotes"
                  value={editedOrder.notes || order.notes || ''}
                  onChange={(e) => setEditedOrder(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions, changes, etc."
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Select onValueChange={addOrderItem}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add item..." />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map(item => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} - ₹{item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {editedOrder.items?.map(item => {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                return (
                  <Card key={item.menuItemId}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{menuItem?.name}</h4>
                          <div className="flex gap-4 mt-2">
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(
                                  item.menuItemId, 
                                  'quantity', 
                                  parseInt(e.target.value)
                                )}
                                className="w-20"
                              />
                            </div>
                            <div>
                              <Label>Price per item</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateOrderItem(
                                  item.menuItemId, 
                                  'price', 
                                  parseFloat(e.target.value)
                                )}
                                className="w-24"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</div>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeOrderItem(item.menuItemId)}
                            className="mt-2"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">
                Total: ₹{calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

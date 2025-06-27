"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarDays, Users, Phone, MapPin, Edit, MessageCircle, RefreshCw } from "lucide-react";
import type { Order, Customer } from "../../../shared/schema";
import OrderEditForm from "./order-edit-form";
import WhatsAppIntegration from "./whatsapp-integration";

interface OrderWithCustomer extends Order {
  customer: Customer;
}

export default function TodaysOrdersDashboard() {
  const [todaysOrders, setTodaysOrders] = useState<OrderWithCustomer[]>([]);
  const [tomorrowsOrders, setTomorrowsOrders] = useState<OrderWithCustomer[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [whatsappOrder, setWhatsappOrder] = useState<OrderWithCustomer | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [todayResponse, tomorrowResponse] = await Promise.all([
        fetch('/api/orders/today'),
        fetch('/api/orders/tomorrow')
      ]);

      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodaysOrders(todayData);
      }

      if (tomorrowResponse.ok) {
        const tomorrowData = await tomorrowResponse.json();
        setTomorrowsOrders(tomorrowData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = useCallback(() => {
    const orders = activeTab === "today" ? todaysOrders : tomorrowsOrders;
    
    let filtered = orders;
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.mobile.includes(searchTerm) ||
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeTab, statusFilter, searchTerm, todaysOrders, tomorrowsOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lastModified: new Date() })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
        alert('Order status updated successfully');
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'in_preparation': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatEventDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateRevenue = (orders: OrderWithCustomer[]) => {
    return orders.reduce((total, order) => total + parseFloat(order.total), 0);
  };

  const getOrderCounts = (orders: OrderWithCustomer[]) => {
    const counts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: orders.length,
      confirmed: counts.confirmed || 0,
      preparing: counts.in_preparation || 0,
      ready: counts.ready || 0,
      delivered: counts.delivered || 0
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading dashboard...</div>
        </CardContent>
      </Card>
    );
  }

  const todayCounts = getOrderCounts(todaysOrders);
  const tomorrowCounts = getOrderCounts(tomorrowsOrders);
  const todayRevenue = calculateRevenue(todaysOrders);
  const tomorrowRevenue = calculateRevenue(tomorrowsOrders);

  // If editing an order, show the edit form
  if (editingOrder) {
    return (
      <OrderEditForm
        orderId={editingOrder}
        onSave={() => {
          setEditingOrder(null);
          fetchOrders();
        }}
        onCancel={() => setEditingOrder(null)}
      />
    );
  }

  // If showing WhatsApp integration, show the component
  if (whatsappOrder) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">WhatsApp Communication</h2>
          <Button variant="outline" onClick={() => setWhatsappOrder(null)}>
            Back to Dashboard
          </Button>
        </div>
        <WhatsAppIntegration 
          order={whatsappOrder} 
          customer={whatsappOrder.customer} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Operations Dashboard</h1>
        <Button onClick={fetchOrders} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCounts.total}</div>
            <p className="text-xs text-muted-foreground">
              ₹{todayRevenue.toFixed(2)} revenue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tomorrow&apos;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tomorrowCounts.total}</div>
            <p className="text-xs text-muted-foreground">
              ₹{tomorrowRevenue.toFixed(2)} revenue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready for Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCounts.ready}</div>
            <p className="text-xs text-muted-foreground">
              Orders prepared
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Preparation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCounts.preparing}</div>
            <p className="text-xs text-muted-foreground">
              Orders being prepared
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <CardDescription>View and manage your catering orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name, mobile, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_preparation">In Preparation</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Today ({todayCounts.total})</TabsTrigger>
              <TabsTrigger value="tomorrow">Tomorrow ({tomorrowCounts.total})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-4">
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No orders found for today
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">#{order.orderId}</h3>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                {order.customer.name} ({order.guestCount} guests)
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                {order.customer.mobile}
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarDays size={14} />
                                {formatEventDate(order.eventDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {order.customer.address || 'Address not provided'}
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <span className="font-semibold">Total: ₹{order.total}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({order.paymentStatus})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id.toString(), value)}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_preparation">In Preparation</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingOrder(order.id.toString())}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWhatsappOrder(order)}
                              >
                                <MessageCircle size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tomorrow" className="mt-4">
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No orders found for tomorrow
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">#{order.orderId}</h3>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users size={14} />
                                {order.customer.name} ({order.guestCount} guests)
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                {order.customer.mobile}
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarDays size={14} />
                                {formatEventDate(order.eventDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {order.customer.address || 'Address not provided'}
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <span className="font-semibold">Total: ₹{order.total}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({order.paymentStatus})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id.toString(), value)}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_preparation">In Preparation</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingOrder(order.id.toString())}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWhatsappOrder(order)}
                              >
                                <MessageCircle size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

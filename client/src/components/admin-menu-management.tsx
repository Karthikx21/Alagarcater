import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { translateToTamil } from "@/lib/enhanced-tamil-translation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle, FileX, Languages } from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  tamilName: string;
  category: string;
  subcategory?: string;
  type: string;
  price: number;
  description?: string;
  customizationOptions?: Array<{
    name: string;
    tamilName?: string;
    options: Array<{
      name: string;
      tamilName?: string;
      priceAdjustment: number;
    }>;
  }>;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "breakfast", label: "Breakfast", tamilLabel: "காலை உணவு" },
  { value: "lunch", label: "Lunch", tamilLabel: "மதிய உணவு" },
  { value: "dinner", label: "Dinner", tamilLabel: "இரவு உணவு" },
];

const SUBCATEGORIES = {
  breakfast: [
    { value: "tiffin", label: "Tiffin", tamilLabel: "டிஃபின்" },
    { value: "snacks", label: "Snacks", tamilLabel: "சிற்றுண்டி" },
    { value: "sides", label: "Sides", tamilLabel: "பக்க உணவு" },
  ],
  lunch: [
    { value: "main-course", label: "Main Course", tamilLabel: "முதன்மை உணவு" },
    { value: "sides", label: "Sides", tamilLabel: "பக்க உணவு" },
    { value: "desserts", label: "Desserts", tamilLabel: "இனிப்பு" },
  ],
  dinner: [
    { value: "main-course", label: "Main Course", tamilLabel: "முதன்மை உணவு" },
    { value: "sides", label: "Sides", tamilLabel: "பக்க உணவு" },
    { value: "desserts", label: "Desserts", tamilLabel: "இனிப்பு" },
  ],
};

const TYPES = [
  { value: "veg", label: "Vegetarian", tamilLabel: "சைவம்" },
  { value: "non-veg", label: "Non-Vegetarian", tamilLabel: "அசைவம்" },
];

export default function AdminMenuManagement() {
  const { t } = useTranslation();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  // const { language } = useLanguage();
  const [newItem, setNewItem] = useState<Omit<MenuItem, "id">>({ 
    name: "", 
    tamilName: "", 
    category: "", 
    subcategory: "", 
    type: "veg", 
    price: 0, 
    description: "", 
    customizationOptions: [],
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Omit<MenuItem, "id">) => {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error("Failed to create menu item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setShowAddModal(false);
      resetFormState();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Failed to update menu item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setEditingItem(null);
      setShowAddModal(false);
      resetFormState();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/menu/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete menu item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to toggle availability");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
    },
  });



  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      tamilName: item.tamilName,
      category: item.category,
      subcategory: item.subcategory || "",
      type: item.type,
      price: item.price,
      description: item.description || "",
      customizationOptions: item.customizationOptions || [],
      isActive: item.isActive
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          ...editingItem,
          ...newItem,
        });
      } else {
        await createMutation.mutateAsync(newItem);
      }
      setShowAddModal(false);
      resetFormState();
    } catch (error) {
      console.error("Error submitting menu item:", error);
      // Error handling would be improved with proper logging service
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete === null) return;
    
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Filter and prepare menu items for display
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.tamilName && item.tamilName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).map(item => ({
    ...item,
    name: item.name || "(No Name)",
    tamilName: item.tamilName && item.tamilName.trim() !== "" ? item.tamilName : translateToTamil(item.name).tamil
  }));

  // Helper function for translation with fallback
  const getTranslationWithFallback = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  // Form reset helper
  const resetFormState = () => {
    setNewItem({ 
      name: "", 
      tamilName: "", 
      category: "", 
      subcategory: "", 
      type: "veg", 
      price: 0, 
      description: "", 
      customizationOptions: [],
      isActive: true
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in">
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white to-primary-light/10 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white font-bold text-lg">5</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground text-shadow-sm">{t('adminMenu.title')}</h2>
              <h3 className="text-lg text-secondary font-tamil mt-1">{t('adminMenu.subtitle')}</h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-gradient-to-r from-muted/20 to-muted/30 p-6 rounded-xl border border-primary/10 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={getTranslationWithFallback('adminMenu.searchPlaceholder', 'Search menu items...')} 
                    className="pl-10 w-full sm:w-[280px] border-primary/20 focus-visible:ring-primary/30 bg-white/80 backdrop-blur-sm h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-full sm:w-[200px] border-primary/20 bg-white/80 backdrop-blur-sm h-10">
                    <SelectValue placeholder={getTranslationWithFallback('adminMenu.filterByCategory', 'All Categories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{getTranslationWithFallback('adminMenu.allCategories', 'All Categories')}</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="hidden sm:inline mr-1">Total:</span> 
                  <Badge variant="outline" className="text-xs">{filteredMenuItems.length} items</Badge>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button 
                  onClick={() => {
                    setEditingItem(null);
                    resetFormState();
                    setShowAddModal(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 h-10 rounded-md transition-colors duration-200 flex items-center gap-2 font-medium whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  {getTranslationWithFallback('adminMenu.addNewItem', 'Add New Item')}
                </Button>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="border border-primary/10 rounded-lg overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/5 border-b border-primary/10">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.name', 'Name')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.tamilName', 'Tamil Name')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.category', 'Category')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.type', 'Type')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.price', 'Price')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.status', 'Status')}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-primary-dark">{getTranslationWithFallback('adminMenu.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {filteredMenuItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          {isLoading ? (
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                              {t('adminMenu.loadingItems')}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-8">
                              <div className="bg-muted/50 p-4 rounded-full mb-3">
                                <FileX className="h-12 w-12 text-muted-foreground" />
                              </div>
                              <p className="text-lg font-medium">No menu items found</p>
                              {searchTerm && (
                                <p className="text-sm mt-1 text-muted-foreground">Try adjusting your search criteria</p>
                              )}
                              <Button 
                                variant="outline" 
                                className="mt-4 border-primary/20 text-primary"
                                onClick={() => {
                                  setSearchTerm("");
                                  setFilterCategory("all");
                                }}
                              >
                                Clear filters
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredMenuItems.map((item) => (
                        <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-medium">{item.name}</td>
                          <td className="px-4 py-3 font-tamil">{item.tamilName}</td>
                          <td className="px-4 py-3">
                            {CATEGORIES.find(cat => cat.value === item.category)?.label || item.category}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={item.type === 'veg' ? 'secondary' : 'destructive'} className="capitalize">
                              {item.type === 'veg' ? getTranslationWithFallback('adminMenu.veg', 'Veg') : getTranslationWithFallback('adminMenu.nonVeg', 'Non-Veg')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.isActive ? "success" : "outline"} className="capitalize">
                              {item.isActive ? getTranslationWithFallback('adminMenu.active', 'Active') : getTranslationWithFallback('adminMenu.inactive', 'Inactive')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditItem(item)}
                                className="h-8 px-3 flex items-center text-primary hover:text-primary-dark hover:bg-primary-light/20"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                {getTranslationWithFallback('adminMenu.edit', 'Edit')}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setItemToDelete(item.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="h-8 px-3 flex items-center text-destructive hover:text-destructive-foreground hover:bg-destructive/90"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                {getTranslationWithFallback('adminMenu.delete', 'Delete')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAvailabilityMutation.mutate({ id: item.id, isActive: !item.isActive })}
                                className={`h-8 px-3 flex items-center ${item.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                              >
                                {item.isActive ? getTranslationWithFallback('adminMenu.disable', 'Disable') : getTranslationWithFallback('adminMenu.enable', 'Enable')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add/Edit Menu Item Modal */}
          {showAddModal && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={(e) => {
                // Close modal when clicking outside
                if (e.target === e.currentTarget) {
                  setShowAddModal(false);
                  if (!editingItem) {
                    resetFormState();
                  }
                }
              }}
            >
              <div className="bg-background rounded-lg shadow-2xl max-w-2xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)]">
                <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {editingItem ? 'Update the details of your menu item' : 'Create a new menu item for your restaurant'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowAddModal(false);
                      if (!editingItem) {
                        resetFormState();
                      }
                    }} 
                    className="h-10 w-10 p-0 hover:bg-primary/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto min-h-0">
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                          English Name <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="name" 
                          value={newItem.name} 
                          onChange={(e) => {
                            const englishName = e.target.value;
                            setNewItem({ ...newItem, name: englishName });
                            
                            // Auto-translate to Tamil if the field has content
                            if (englishName.trim().length > 0) {
                              const translation = translateToTamil(englishName);
                              if (translation.confidence > 0.5) {
                                setNewItem(prev => ({ 
                                  ...prev, 
                                  name: englishName,
                                  tamilName: translation.tamil 
                                }));
                              }
                            }
                          }} 
                          required 
                          className="h-11"
                          placeholder="Enter item name in English"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="tamilName" className="text-sm font-semibold text-gray-700">Tamil Name</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const translation = translateToTamil(newItem.name);
                              setNewItem(prev => ({ 
                                ...prev, 
                                tamilName: translation.tamil 
                              }));
                            }}
                            className="h-8 px-3 text-xs hover:bg-primary/10"
                          >
                            <Languages className="h-3 w-3 mr-1" />
                            Auto Translate
                          </Button>
                        </div>
                        <Input 
                          id="tamilName" 
                          value={newItem.tamilName} 
                          onChange={(e) => setNewItem({ ...newItem, tamilName: e.target.value })} 
                          className="font-tamil h-11"
                          placeholder="தமிழ் பெயர்"
                        />
                        {newItem.name && !newItem.tamilName && (
                          <p className="text-xs text-muted-foreground">
                            Click &ldquo;Auto Translate&rdquo; or enter Tamil name manually
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Category and Type Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={newItem.category} 
                          onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                        >
                          <SelectTrigger id="category" className="h-11">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subcategory" className="text-sm font-semibold text-gray-700">Subcategory</Label>
                        <Select 
                          value={newItem.subcategory} 
                          onValueChange={(value) => setNewItem({ ...newItem, subcategory: value })}
                          disabled={!newItem.category}
                        >
                          <SelectTrigger id="subcategory" className="h-11">
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {newItem.category && SUBCATEGORIES[newItem.category as keyof typeof SUBCATEGORIES]?.map((sub) => (
                              <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Type and Price Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                          Type <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={newItem.type} 
                          onValueChange={(value) => setNewItem({ ...newItem, type: value })}
                        >
                          <SelectTrigger id="type" className="h-11">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${type.value === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                          Price (per person) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input 
                            id="price" 
                            type="number" 
                            value={newItem.price} 
                            onChange={(e) => {
                              // Handle empty string or valid number including zero
                              const value = e.target.value;
                              const numValue = value === '' ? 0 : parseFloat(value);
                              setNewItem({ ...newItem, price: numValue });
                            }} 
                            min="0" 
                            step="0.01"
                            required 
                            className="pl-8 h-11"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Description Section */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                      <Textarea 
                        id="description" 
                        value={newItem.description} 
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} 
                        rows={4}
                        className="resize-none"
                        placeholder="Enter menu item details (ingredients, preparation method, etc.)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Add details about ingredients, preparation method, or special features
                      </p>
                    </div>
                  </form>
                </div>
                
                <div className="flex-shrink-0 p-6 border-t bg-muted/30 flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddModal(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="default" 
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="px-6 bg-primary hover:bg-primary-dark"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingItem ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        {editingItem ? 'Update Item' : 'Add Item'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-200">
              <div className="bg-background rounded-lg shadow-xl max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-3 text-destructive">
                    <div className="bg-destructive/10 p-2 rounded-full">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">Confirm Deletion</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Are you sure you want to delete this menu item? This action cannot be undone.
                  </p>
                  {itemToDelete && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Item to delete:</p>
                      <p className="text-base font-semibold mt-1">
                        {filteredMenuItems.find(item => item.id === itemToDelete)?.name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t bg-muted/30 flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setItemToDelete(null);
                    }}
                    className="hover:bg-background"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-4"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Item
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
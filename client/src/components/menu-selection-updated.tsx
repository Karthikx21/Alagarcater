import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight, 
  Coffee, 
  Sun, 
  Moon, 
  Plus, 
  Minus, 
  Trash2, 
  PlusCircle
} from "lucide-react";
import { CustomerData, SelectedMenuItem } from "@/types";
import { formatCurrency, calculateOrderSummary, cn } from "@/lib/utils";
import { autoTranslateToTamil } from "@/lib/translationDictionary";

interface MenuSelectionProps {
  customerData: CustomerData;
  onBack: () => void;
  onNext: (selectedItems: SelectedMenuItem[]) => void;
  initialSelectedItems?: SelectedMenuItem[];
}

interface MenuItem {
  id: number;
  name: string;
  tamilName: string;
  category: string;
  subcategory?: string;
  type: string;
  price: string;
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

interface ItemQuantity {
  id: number;
  quantity: number;
}

export default function MenuSelection({ customerData, onBack, onNext, initialSelectedItems = [] }: MenuSelectionProps) {
  const { t } = useTranslation();
  
  // Helper function for translation with fallback
  const getTranslationWithFallback = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  // Initialize with IDs from initialSelectedItems if provided
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(initialSelectedItems.map(item => item.id))
  );
  
  // Store item quantities
  const [itemQuantities, setItemQuantities] = useState<ItemQuantity[]>(
    initialSelectedItems.map(item => ({ id: item.id, quantity: item.quantity || Number(customerData.guestCount) || 1 }))
  );
  
  // Custom items state
  const [customItems, setCustomItems] = useState<SelectedMenuItem[]>([]);
  
  // Add Custom Item modal state and form
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    tamilName: '',
    price: '',
    quantity: '',
    type: 'veg',
    category: 'custom',
    subcategory: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Add Custom Item handler
  const handleAddCustomItem = () => {
    // Generate a unique negative ID for custom items (to avoid conflicts with DB items)
    const customId = -(Date.now());
    
    // Use the provided quantity or default to guest count
    const itemQuantity = customItem.quantity ? parseInt(customItem.quantity) : Number(customerData.guestCount) || 1;
    
    const newCustomItem: SelectedMenuItem = {
      id: customId,
      name: customItem.name,
      tamilName: customItem.tamilName || autoTranslateToTamil(customItem.name),
      category: customItem.category,
      subcategory: customItem.subcategory || undefined,
      type: customItem.type,
      price: parseFloat(customItem.price) || 0,
      quantity: itemQuantity,
      isCustom: true
    };
    
    setCustomItems([...customItems, newCustomItem]);
    setSelectedItems(new Set(Array.from(selectedItems).concat([customId])));
    setItemQuantities([...itemQuantities, { id: customId, quantity: itemQuantity }]);
    
    // Reset form
    setCustomItem({
      name: '',
      tamilName: '',
      price: '',
      quantity: '',
      type: 'veg',
      category: 'custom',
      subcategory: ''
    });
    
    setShowCustomItemModal(false);
  };

  // After fetching menuItems, ensure tamilName is filled using dictionary if missing
  const { data: rawMenuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });
  // Map menuItems to ensure tamilName is always filled
  const menuItems = rawMenuItems.map(item => ({
    ...item,
    tamilName: item.tamilName && item.tamilName.trim() !== "" ? item.tamilName : autoTranslateToTamil(item.name)
  }));

  const handleItemToggle = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      // Remove from quantities when unselected
      setItemQuantities(itemQuantities.filter(item => item.id !== itemId));
    } else {
      newSelected.add(itemId);
      // Add default quantity based on guest count when selected
      const defaultQuantity = Number(customerData.guestCount) || 1;
      setItemQuantities([...itemQuantities, { id: itemId, quantity: defaultQuantity }]);
    }
    setSelectedItems(newSelected);
  };

  // Handle quantity change for an item
  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    // Ensure quantity is at least 1
    const quantity = Math.max(1, newQuantity);
    
    // Update the quantity for the specific item
    setItemQuantities(prevQuantities => {
      const existingItem = prevQuantities.find(item => item.id === itemId);
      
      if (existingItem) {
        // Update existing item
        return prevQuantities.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        );
      } else {
        // Add new item
        return [...prevQuantities, { id: itemId, quantity }];
      }
    });
  };

  // Get quantity for a specific item
  const getItemQuantity = (itemId: number): number => {
    const item = itemQuantities.find(item => item.id === itemId);
    return item ? item.quantity : 1;
  };

  // Remove a custom item
  const handleRemoveCustomItem = (itemId: number) => {
    setCustomItems(customItems.filter(item => item.id !== itemId));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setItemQuantities(itemQuantities.filter(item => item.id !== itemId));
  };

  /**
   * Calculates the order totals with precise calculations
   * @returns Order summary with subtotal, service charge, GST, and total
   */
  const calculateTotals = () => {
    // Get selected menu items with their quantities
    const selectedMenuItems = menuItems.filter(item => selectedItems.has(item.id));
    
    // Calculate subtotal with precise calculations
    const subtotal = selectedMenuItems.reduce((total, item) => {
      // Ensure price is a valid number
      const itemPrice = Number(parseFloat(item.price).toFixed(2));
      // Get quantity for this item
      const quantity = getItemQuantity(item.id);
      // Calculate item total (price * quantity)
      const itemTotal = Number((itemPrice * quantity).toFixed(2));
      // Add to running total
      return Number((total + itemTotal).toFixed(2));
    }, 0);

    // Add custom items to subtotal
    const customItemsTotal = customItems.reduce((total, item) => {
      const itemPrice = Number(item.price.toFixed(2));
      const quantity = getItemQuantity(item.id);
      const itemTotal = Number((itemPrice * quantity).toFixed(2));
      return Number((total + itemTotal).toFixed(2));
    }, 0);

    const finalSubtotal = Number((subtotal + customItemsTotal).toFixed(2));

    // Return order summary
    return calculateOrderSummary(finalSubtotal);
  };

  /**
   * Handles proceeding to the next step with selected menu items
   * Ensures accurate data is passed to the next step
   */
  const handleProceed = () => {
    // Create selected menu items with accurate data
    const selectedMenuItems: SelectedMenuItem[] = menuItems
      .filter(item => selectedItems.has(item.id))
      .map(item => {
        // Ensure price is a valid number
        const itemPrice = Number(parseFloat(item.price).toFixed(2));
        // Get quantity for this item
        const quantity = getItemQuantity(item.id);
        
        return {
          id: item.id,
          name: item.name,
          tamilName: item.tamilName,
          category: item.category,
          type: item.type,
          price: itemPrice,
          quantity: quantity,
        };
      });

    // Add custom items
    const allSelectedItems = [
      ...selectedMenuItems,
      ...customItems.filter(item => selectedItems.has(item.id))
    ];

    // Proceed to next step
    onNext(allSelectedItems);
  };

  // Filtered menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tamilName && item.tamilName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesType = typeFilter ? item.type === typeFilter : true;
    return matchesSearch && matchesCategory && matchesType;
  });

  const groupedItems = filteredMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {};
    }
    if (!acc[item.category][item.subcategory || 'default']) {
      acc[item.category][item.subcategory || 'default'] = { veg: [], 'non-veg': [] };
    }
    acc[item.category][item.subcategory || 'default'][item.type as 'veg' | 'non-veg'].push(item);
    return acc;
  }, {} as Record<string, Record<string, { veg: MenuItem[]; 'non-veg': MenuItem[] }>>);

  const categoryIcons = {
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon,
  };

  const SUBCATEGORIES = {
    breakfast: [
      { value: "tiffin", label: "Tiffin", tamilLabel: "டிஃபின்" },
      { value: "snacks", label: "Snacks", tamilLabel: "சிற்றுண்டி" },
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

  const categoryNames = {
    breakfast: { en: "Breakfast", ta: "காலை உணவு" },
    lunch: { en: "Lunch", ta: "மதிய உணவு" },
    dinner: { en: "Dinner", ta: "இரவு உணவு" },
  };

  // Helper functions for category and subcategory names
  /**
   * Gets the appropriate icon for a category
   * @param category The category name
   * @returns The icon component
   */
  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Coffee;
    return <IconComponent className="h-6 w-6 text-primary" />;
  };

  const getCategoryName = (category: string) => {
    return categoryNames[category as keyof typeof categoryNames]?.en || category;
  };

  const getCategoryTamilName = (category: string) => {
    return categoryNames[category as keyof typeof categoryNames]?.ta || category;
  };

  const getSubcategoryName = (subcategory: string) => {
    if (subcategory === 'default') return '';
    for (const category in SUBCATEGORIES) {
      const found = SUBCATEGORIES[category as keyof typeof SUBCATEGORIES].find(sc => sc.value === subcategory);
      if (found) return found.label;
    }
    return subcategory;
  };

  const getSubcategoryTamilName = (subcategory: string) => {
    if (subcategory === 'default') return '';
    for (const category in SUBCATEGORIES) {
      const found = SUBCATEGORIES[category as keyof typeof SUBCATEGORIES].find(sc => sc.value === subcategory);
      if (found) return found.tamilLabel;
    }
    return subcategory;
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in">
      <Card className="border-2 border-primary/30 shadow-card bg-gradient-to-br from-card to-primary-light/10 overflow-hidden">
        <CardContent className="p-8">
          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3"
            />
            <Select value={categoryFilter || ''} onValueChange={v => setCategoryFilter(v || null)}>
              <SelectTrigger className="w-full md:w-1/4">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{getTranslationWithFallback('menuSelection.allCategories', 'All Categories')}</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter || ''} onValueChange={v => setTypeFilter(v || null)}>
              <SelectTrigger className="w-full md:w-1/4">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{getTranslationWithFallback('menuSelection.allTypes', 'All Types')}</SelectItem>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">{getTranslationWithFallback('menuSelection.title', 'Menu Selection')}</h2>
                <h3 className="text-lg text-muted-foreground font-tamil mt-1">மெனு தேர்வு</h3>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setShowCustomItemModal(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
{getTranslationWithFallback('menuSelection.addCustomItem', 'Add Custom Item')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Menu Categories */}
            <div className="md:w-3/4 space-y-8">
              {/* Custom Items Section */}
              {customItems.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 bg-accent/30 p-3 rounded-lg shadow-sm">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <PlusCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
{getTranslationWithFallback('menuSelection.customItems', 'Custom Items')}
                    </h3>
                  </div>
                  
                  <div className="pl-10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {customItems.map(item => (
                        <div 
                          key={`custom-${item.id}`} 
                          className="relative p-4 rounded-lg border-2 border-primary bg-primary/5 shadow-card"
                        >
                          <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Custom
                          </div>
                          <div className="flex items-start pt-2">
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-foreground">{item.name}</p>
                                  <p className="text-sm font-tamil text-muted-foreground">{item.tamilName}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                                  onClick={() => handleRemoveCustomItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm font-medium text-primary mt-1">
                                {formatCurrency(item.price)}
                              </p>
                              
                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Total Quantity:</span>
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 rounded-full"
                                      onClick={() => handleQuantityChange(item.id, getItemQuantity(item.id) - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{getItemQuantity(item.id)}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 rounded-full"
                                      onClick={() => handleQuantityChange(item.id, getItemQuantity(item.id) + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">Total price:</span>
                                  <span className="text-xs font-medium text-primary">
                                    {formatCurrency(item.price * getItemQuantity(item.id))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Regular Menu Items */}
              {Object.entries(groupedItems).map(([category, subcategories]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center space-x-3 bg-accent/30 p-3 rounded-lg shadow-sm">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {getCategoryIcon(category)}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      {getCategoryName(category)}
                      <span className="text-base font-tamil text-muted-foreground ml-2">
                        {getCategoryTamilName(category)}
                      </span>
                    </h3>
                  </div>
                  
                  {Object.entries(subcategories).map(([subcategory, items]) => (
                    <div key={subcategory} className="pl-10 space-y-4">
                      <h4 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 py-1">
                        {getSubcategoryName(subcategory)}
                        {getSubcategoryTamilName(subcategory) && (
                          <span className="text-base font-tamil text-muted-foreground ml-2">
                            {getSubcategoryTamilName(subcategory)}
                          </span>
                        )}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Render veg items */}
                        {items.veg && items.veg.map(item => (
                          <div 
                            key={`veg-${item.id}`} 
                            className={cn(
                              "relative p-4 rounded-lg border-2 transition-all duration-200",
                              selectedItems.has(item.id) 
                                ? "border-primary bg-primary/5 shadow-card" 
                                : "border-border hover:border-primary/50 hover:shadow-card"
                            )}
                          >
                            <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                              Veg
                            </div>
                            <div className="flex items-start pt-2">
                              <Checkbox 
                                id={`item-${item.id}`} 
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() => handleItemToggle(item.id)}
                                className="mt-1"
                              />
                              <div className="ml-3 flex-1">
                                <label 
                                  htmlFor={`item-${item.id}`} 
                                  className="block font-semibold cursor-pointer text-foreground"
                                >
                                  {item.name}
                                  <span className="block text-sm font-tamil text-muted-foreground">
                                    {item.tamilName}
                                  </span>
                                </label>
                                <p className="text-sm font-medium text-primary mt-1">
                                  {formatCurrency(parseFloat(item.price))}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                {selectedItems.has(item.id) && (
                                  <div className="mt-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Total Quantity:</span>
                                      <div className="flex items-center space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuantityChange(item.id, getItemQuantity(item.id) - 1);
                                          }}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center font-medium">{getItemQuantity(item.id)}</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuantityChange(item.id, getItemQuantity(item.id) + 1);
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-muted-foreground">Total price:</span>
                                      <span className="text-xs font-medium text-primary">
                                        {formatCurrency(parseFloat(item.price) * getItemQuantity(item.id))}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Render non-veg items */}
                        {items['non-veg'] && items['non-veg'].map(item => (
                          <div 
                            key={`non-veg-${item.id}`} 
                            className={cn(
                              "relative p-4 rounded-lg border-2 transition-all duration-200",
                              selectedItems.has(item.id) 
                                ? "border-primary bg-primary/5 shadow-card" 
                                : "border-border hover:border-primary/50 hover:shadow-card"
                            )}
                          >
                            <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                              Non-Veg
                            </div>
                            <div className="flex items-start pt-2">
                              <Checkbox 
                                id={`item-${item.id}`} 
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() => handleItemToggle(item.id)}
                                className="mt-1"
                              />
                              <div className="ml-3 flex-1">
                                <label 
                                  htmlFor={`item-${item.id}`} 
                                  className="block font-semibold cursor-pointer text-foreground"
                                >
                                  {item.name}
                                  <span className="block text-sm font-tamil text-muted-foreground">
                                    {item.tamilName}
                                  </span>
                                </label>
                                <p className="text-sm font-medium text-primary mt-1">
                                  {formatCurrency(parseFloat(item.price))}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                {selectedItems.has(item.id) && (
                                  <div className="mt-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Total Quantity:</span>
                                      <div className="flex items-center space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuantityChange(item.id, getItemQuantity(item.id) - 1);
                                          }}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center font-medium">{getItemQuantity(item.id)}</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-7 w-7 p-0 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuantityChange(item.id, getItemQuantity(item.id) + 1);
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-muted-foreground">Total price:</span>
                                      <span className="text-xs font-medium text-primary">
                                        {formatCurrency(parseFloat(item.price) * getItemQuantity(item.id))}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="md:w-1/4">
              <div className="sticky top-4 bg-card rounded-lg border-2 border-primary/30 p-5 shadow-card">
                <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-border text-primary">
                  {getTranslationWithFallback('orderPreview.orderSummary', 'Order Summary')} <span className="text-sm font-tamil">ஆர்டர் சுருக்கம்</span>
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">
                      {getTranslationWithFallback('menuSelection.selectedItems', 'Selected Items')} <span className="text-xs font-tamil">பொருட்கள்</span>:
                    </span>
                    <span className="font-semibold text-foreground bg-accent/50 px-3 py-1 rounded-md">
                      {selectedItems.size}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">
                      {getTranslationWithFallback('customerForm.guestCount', 'Guest Count')} <span className="text-xs font-tamil">விருந்தினர்</span>:
                    </span>
                    <span className="font-semibold text-foreground bg-accent/50 px-3 py-1 rounded-md">
                      {customerData.guestCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-foreground font-semibold">
                      Subtotal <span className="text-xs font-tamil">கூட்டுத்தொகை</span>:
                    </span>
                    <span className="font-bold text-primary text-lg">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 transition-all duration-300 hover:-translate-x-1" 
                    onClick={onBack}
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back <span className="text-xs font-tamil ml-1">பின்செல்</span>
                  </Button>
                  <Button 
                    variant="default"
                    className="w-full transition-all duration-300 hover:translate-x-1" 
                    onClick={handleProceed}
                    disabled={selectedItems.size === 0}
                  >
                    Proceed <span className="text-xs font-tamil ml-1">தொடரவும்</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Item Modal */}
      <Dialog open={showCustomItemModal} onOpenChange={setShowCustomItemModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={customItem.name}
                onChange={(e) => setCustomItem({...customItem, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tamilName" className="text-right">
                Tamil Name
              </Label>
              <Input
                id="tamilName"
                value={customItem.tamilName}
                onChange={(e) => setCustomItem({...customItem, tamilName: e.target.value})}
                className="col-span-3 font-tamil"
                placeholder="Enter Tamil name (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                value={customItem.price}
                onChange={(e) => setCustomItem({...customItem, price: e.target.value})}
                className="col-span-3"
                placeholder="Enter price"
                type="number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="quantity"
                  value={customItem.quantity}
                  onChange={(e) => setCustomItem({...customItem, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  type="number"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Default is total quantity for all guests
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select 
                value={customItem.category} 
                onValueChange={(value) => setCustomItem({...customItem, category: value, subcategory: ''})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {customItem.category !== 'custom' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategory" className="text-right">
                  Subcategory
                </Label>
                <Select 
                  value={customItem.subcategory} 
                  onValueChange={(value) => setCustomItem({...customItem, subcategory: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {customItem.category === 'breakfast' && (
                      <>
                        <SelectItem value="tiffin">Tiffin</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                      </>
                    )}
                    {(customItem.category === 'lunch' || customItem.category === 'dinner') && (
                      <>
                        <SelectItem value="main-course">Main Course</SelectItem>
                        <SelectItem value="sides">Sides</SelectItem>
                        <SelectItem value="desserts">Desserts</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={customItem.type} 
                onValueChange={(value) => setCustomItem({...customItem, type: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomItem} disabled={!customItem.name || !customItem.price}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
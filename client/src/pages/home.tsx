import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Utensils, ClipboardCheck, ListOrdered, Settings, LogOut } from "lucide-react";
import CustomerForm from "@/components/customer-form";
import MenuSelection from "@/components/menu-selection";
import OrderPreview from "@/components/order-preview";
import OrdersList from "@/components/orders-list";
import AdminMenuManagement from "@/components/admin-menu-management";
import { LanguageToggle } from "@/components/language-toggle";
import { CustomerData, SelectedMenuItem } from "@/types";
import cateringLogo from "@/assets/catering_logo.png";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "react-i18next";

type Section = 'customer-form' | 'menu-selection' | 'order-preview' | 'orders-list' | 'admin-menu';

export default function Home() {
  const { t } = useTranslation();
  const [currentSection, setCurrentSection] = useState<Section>('customer-form');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedMenuItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCustomerNext = (data: CustomerData) => {
    setCustomerData(data);
    setCurrentSection('menu-selection');
  };

  const handleMenuNext = (items: SelectedMenuItem[]) => {
    setSelectedItems(items);
    setCurrentSection('order-preview');
  };

  const handleOrderComplete = () => {
    setCurrentSection('orders-list');
    setCustomerData(null);
    setSelectedItems([]);
  };

  const startNewOrder = () => {
    setCurrentSection('customer-form');
    setCustomerData(null);
    setSelectedItems([]);
  };

  const showOrders = () => {
    setCurrentSection('orders-list');
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'customer-form':
        return <CustomerForm onNext={handleCustomerNext} initialData={customerData} />;
      
      case 'menu-selection':
        return customerData ? (
          <MenuSelection
            customerData={customerData}
            onBack={() => setCurrentSection('customer-form')}
            onNext={handleMenuNext}
            initialSelectedItems={selectedItems}
          />
        ) : null;
      
      case 'order-preview':
        return customerData ? (
          <OrderPreview
            customerData={customerData}
            selectedItems={selectedItems}
            onBack={() => setCurrentSection('menu-selection')}
            onComplete={handleOrderComplete}
          />
        ) : null;
      
      case 'orders-list':
        return <OrdersList />;
      
      case 'admin-menu':
        return <AdminMenuManagement />;
      
      default:
        return <CustomerForm onNext={handleCustomerNext} initialData={customerData} />;
    }
  };

  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Main Navigation (for desktop) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={cateringLogo} alt={t("common.logoAlt")} className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary">{t("common.companyName")}</h1>
              <h2 className="text-sm text-muted-foreground font-tamil">{t("common.companyNameTamil")}</h2>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="md:flex items-center space-x-1">
            <Button
              variant={currentSection === 'customer-form' ? 'default' : 'ghost'}
              size="sm"
              onClick={startNewOrder}
              className="flex items-center gap-1 font-medium"
            >
              <User className="h-4 w-4" />
              <span>{t("nav.customer")}</span>
            </Button>
            <Button
              variant={currentSection === 'menu-selection' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => customerData && setCurrentSection('menu-selection')}
              disabled={!customerData}
              className="flex items-center gap-1 font-medium"
            >
              <Utensils className="h-4 w-4" />
              <span>{t("nav.menu")}</span>
            </Button>
            <Button
              variant={currentSection === 'order-preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => customerData && selectedItems.length > 0 && setCurrentSection('order-preview')}
              disabled={!customerData || selectedItems.length === 0}
              className="flex items-center gap-1 font-medium"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>{t("nav.preview")}</span>
            </Button>
            <Button
              variant={currentSection === 'orders-list' ? 'default' : 'ghost'}
              size="sm"
              onClick={showOrders}
              className="flex items-center gap-1 font-medium"
            >
              <ListOrdered className="h-4 w-4" />
              <span>{t("nav.orders")}</span>
            </Button>
            <Button
              variant={currentSection === 'admin-menu' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentSection('admin-menu')}
              className="flex items-center gap-1 font-medium"
            >
              <Settings className="h-4 w-4" />
              <span>{t("nav.admin")}</span>
            </Button>
            
            {/* User and Logout */}
            <div className="ml-2 pl-2 border-l flex items-center space-x-2">
              <div className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                {user?.name || user?.username}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("nav.logout")}</span>
              </Button>
            </div>
            
            {/* Language Toggle */}
            <div className="ml-2 pl-2 border-l">
              <LanguageToggle variant="compact" />
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b bg-background shadow-md animate-in slide-in-from-top duration-300">
          {/* User info for mobile */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{user?.name || user?.username}</div>
                <div className="text-xs text-muted-foreground">{t("nav.loggedIn")}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logout")}</span>
            </Button>
          </div>
          
          <nav className="px-4 py-3 flex flex-col space-y-2">
            <Button
              variant={currentSection === 'customer-form' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                startNewOrder();
                setIsMobileMenuOpen(false);
              }}
              className="justify-start"
            >
              <User className="h-4 w-4 mr-2" />
              <span>{t("nav.customerDetails")}</span>
            </Button>
            <Button
              variant={currentSection === 'menu-selection' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (customerData) {
                  setCurrentSection('menu-selection');
                  setIsMobileMenuOpen(false);
                }
              }}
              disabled={!customerData}
              className="justify-start"
            >
              <Utensils className="h-4 w-4 mr-2" />
              <span>{t("nav.menuSelection")}</span>
            </Button>
            <Button
              variant={currentSection === 'order-preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (customerData && selectedItems.length > 0) {
                  setCurrentSection('order-preview');
                  setIsMobileMenuOpen(false);
                }
              }}
              disabled={!customerData || selectedItems.length === 0}
              className="justify-start"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              <span>{t("nav.orderPreview")}</span>
            </Button>
            <Button
              variant={currentSection === 'orders-list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                showOrders();
                setIsMobileMenuOpen(false);
              }}
              className="justify-start"
            >
              <ListOrdered className="h-4 w-4 mr-2" />
              <span>{t("nav.ordersList")}</span>
            </Button>
            <Button
              variant={currentSection === 'admin-menu' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentSection('admin-menu');
                setIsMobileMenuOpen(false);
              }}
              className="justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>{t("nav.adminMenu")}</span>
            </Button>
            
            {/* Mobile Language Toggle */}
            <div className="pt-2 mt-2 border-t flex justify-center">
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in-50 duration-300">
        {renderCurrentSection()}
      </main>

      <footer className="border-t py-6 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src={cateringLogo} alt="Alagar Catering Service A to Z Logo" className="h-8 w-8" />
            <div>
              <p className="text-sm font-medium">Alagar Catering Service A to Z</p>
              <p className="text-xs text-muted-foreground font-tamil">அழகர் கேட்டரிங் சர்வீஸ்</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Alagar Catering Service A to Z. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Designed with ❤️ for delicious experiences
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
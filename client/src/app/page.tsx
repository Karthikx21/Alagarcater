import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ArrowRight, ChefHat, ClipboardList, Settings, Users } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light/20 to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          <Image
            src="/catering_logo.png"
            alt="Algar Catering Logo"
            width={150}
            height={150}
            className="mb-6"
          />
          <h1 className="text-4xl font-bold text-primary text-center">Welcome to Algar Catering</h1>
          <p className="text-xl text-muted-foreground mt-2 font-tamil text-center">அல்கர் கேட்டரிங் வரவேற்கிறது</p>
          <p className="mt-4 text-center max-w-2xl">
            Manage your catering business efficiently with our comprehensive system.
            Create orders, manage menus, and track customer information all in one place.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Catering App</CardTitle>
              </div>
              <CardDescription>
                Access the main catering application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create orders, select menu items, and manage your catering operations with our intuitive interface.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/app" className="w-full">
                <Button className="w-full">
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Orders</CardTitle>
              </div>
              <CardDescription>
                View and manage all orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access your order history, check order status, and manage payments in one convenient location.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/app?section=orders-list" className="w-full">
                <Button variant="outline" className="w-full">
                  View Orders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Admin</CardTitle>
              </div>
              <CardDescription>
                Manage menu items and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add or edit menu items, customize pricing, and configure system settings to suit your business needs.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/app?section=admin-menu" className="w-full">
                <Button variant="outline" className="w-full">
                  Admin Panel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
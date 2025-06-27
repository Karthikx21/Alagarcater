import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { CustomerData } from "@/types";
import { validateMobileNumber } from "@/lib/utils";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().refine(validateMobileNumber, "Please enter a valid 10-digit mobile number"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  notes: z.string().optional(),
  guestCount: z.number().min(1, "Guest count must be at least 1"),
  eventDate: z.string().min(1, "Event date is required"),
});

interface CustomerFormProps {
  onNext: (data: CustomerData) => void;
  initialData?: CustomerData | null;
}

export default function CustomerForm({ onNext, initialData }: CustomerFormProps) {
  const form = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: "",
      mobile: "",
      address: "",
      notes: "",
      guestCount: undefined, // no default, user must enter
      eventDate: "",
    },
  });

  const onSubmit = (data: CustomerData) => {
    onNext(data);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in">
      <Card className="border-2 border-primary/30 shadow-card bg-gradient-to-br from-card to-primary-light/10 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Customer Details</h2>
              <p className="text-muted-foreground mt-1">Please fill in the customer information</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Customer Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter customer name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-base">Mobile Number</Label>
                <Input
                  id="mobile"
                  {...form.register("mobile")}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  onKeyPress={(e) => {
                    const isNumber = /[0-9]/.test(e.key);
                    if (!isNumber) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    e.target.value = value;
                    form.setValue("mobile", value);
                  }}
                />
                {form.formState.errors.mobile && (
                  <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.mobile.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-base">Address</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  placeholder="Enter complete address"
                  rows={3}
                  className="resize-none"
                />
                {form.formState.errors.address && (
                  <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Special requirements, allergies, preferences..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="guestCount" className="text-base">Guest Count</Label>
                <Input
                  id="guestCount"
                  type="number"
                  {...form.register("guestCount", { valueAsNumber: true })}
                  placeholder="Number of guests"
                  min="1"
                />
                {form.formState.errors.guestCount && (
                  <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.guestCount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-base">Event Date & Time</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  {...form.register("eventDate")}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {form.formState.errors.eventDate && (
                  <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.eventDate.message}</p>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" size="lg">
                  Continue to Menu Selection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

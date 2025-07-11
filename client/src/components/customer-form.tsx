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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
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
              <h2 className="text-3xl font-bold text-foreground">{t('customerForm.title')}</h2>
              <p className="text-muted-foreground mt-1">{t('customerForm.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">{t('customerForm.customerName')}</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder={t('customerForm.customerNamePlaceholder')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm font-medium text-destructive mt-1">{t('customerForm.validation.nameRequired')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-base">{t('customerForm.mobileNumber')}</Label>
                <Input
                  id="mobile"
                  {...form.register("mobile")}
                  placeholder={t('customerForm.mobileNumberPlaceholder')}
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
                  <p className="text-sm font-medium text-destructive mt-1">{t('customerForm.validation.mobileInvalid')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-base">{t('customerForm.address')}</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  placeholder={t('customerForm.addressPlaceholder')}
                  className="min-h-[120px] resize-none"
                />
                {form.formState.errors.address && (
                  <p className="text-sm font-medium text-destructive mt-1">{t('customerForm.validation.addressMinLength')}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="guestCount" className="text-base">{t('customerForm.guestCount')}</Label>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  {...form.register("guestCount", { valueAsNumber: true })}
                  placeholder={t('customerForm.guestCountPlaceholder')}
                />
                {form.formState.errors.guestCount && (
                  <p className="text-sm font-medium text-destructive mt-1">{t('customerForm.validation.guestCountMin')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-base">{t('customerForm.eventDate')}</Label>
                <Input
                  id="eventDate"
                  type="date"
                  {...form.register("eventDate")}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.eventDate && (
                  <p className="text-sm font-medium text-destructive mt-1">{t('customerForm.validation.eventDateRequired')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base">{t('customerForm.notes')} <span className="text-xs text-muted-foreground">({t('common.optional')})</span></Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder={t('customerForm.notesPlaceholder')}
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end pt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
              >
                {t('customerForm.nextToMenu')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
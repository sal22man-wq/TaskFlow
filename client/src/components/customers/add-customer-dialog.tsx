import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertCustomer } from "@shared/schema";
import { Plus } from "lucide-react";

interface AddCustomerDialogProps {
  onCustomerAdded?: (customer: { name: string; phone?: string; email?: string }) => void;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "تم إضافة العميل بنجاح",
        description: `تم إضافة ${customer.name} إلى قائمة العملاء.`,
      });
      
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setOpen(false);
      
      // Notify parent component
      if (onCustomerAdded) {
        onCustomerAdded({ 
          name: customer.name, 
          phone: customer.phone,
          email: customer.email
        });
      }
    },
    onError: () => {
      toast({
        title: "خطأ في إضافة العميل",
        description: "حدثت مشكلة في إضافة العميل. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "الاسم مطلوب",
        description: "يرجى إدخال اسم العميل.",
        variant: "destructive",
      });
      return;
    }

    const customer: InsertCustomer = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    };

    createCustomerMutation.mutate(customer);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          data-testid="button-add-customer"
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          إضافة عميل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="modal-add-customer-title">إضافة عميل جديد</DialogTitle>
          <DialogDescription>
            أدخل معلومات العميل الجديد
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="customer-name">اسم العميل *</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم العميل"
              data-testid="input-customer-name-new"
              required
            />
          </div>

          <div>
            <Label htmlFor="customer-phone">رقم الهاتف</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              data-testid="input-customer-phone-new"
            />
          </div>

          <div>
            <Label htmlFor="customer-email">البريد الإلكتروني</Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              data-testid="input-customer-email-new"
            />
          </div>

          <div>
            <Label htmlFor="customer-address">العنوان</Label>
            <Textarea
              id="customer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل عنوان العميل"
              rows={2}
              data-testid="textarea-customer-address-new"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              data-testid="button-cancel-customer"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={createCustomerMutation.isPending}
              data-testid="button-save-customer"
            >
              {createCustomerMutation.isPending ? "جاري الإضافة..." : "إضافة العميل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
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
import { Plus, MapPin, Navigation } from "lucide-react";

interface AddCustomerDialogProps {
  onCustomerAdded?: (customer: { name: string; phone?: string; email?: string; address?: string }) => void;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gpsLatitude, setGpsLatitude] = useState("");
  const [gpsLongitude, setGpsLongitude] = useState("");
  const [gpsAddress, setGpsAddress] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: 'خطأ',
        description: 'المتصفح لا يدعم خدمة الموقع',
        variant: 'destructive',
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        
        setGpsLatitude(lat);
        setGpsLongitude(lng);
        
        // محاولة الحصول على العنوان من الإحداثيات
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
          headers: {
            'User-Agent': 'TaskFlow App (task@example.com)'
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('فشل في الحصول على العنوان');
            }
            return response.json();
          })
          .then(data => {
            if (data && data.display_name) {
              setGpsAddress(data.display_name);
            }
          })
          .catch((error) => {
            console.log('فشل في الحصول على العنوان:', error);
            // فشل في الحصول على العنوان، لكن الإحداثيات محفوظة
          });

        setIsGettingLocation(false);
        toast({
          title: 'تم الحصول على الموقع',
          description: `تم حفظ الإحداثيات: ${lat.substring(0, 8)}, ${lng.substring(0, 8)}`,
        });
      },
      (error) => {
        console.error('خطأ في الموقع:', error);
        setIsGettingLocation(false);
        
        let errorMessage = 'لم نتمكن من الحصول على موقعك';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض الإذن للوصول للموقع. يرجى السماح بالوصول في إعدادات المتصفح';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متاحة';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة البحث عن الموقع';
            break;
          default:
            errorMessage = 'حدث خطأ غير معروف في تحديد الموقع';
            break;
        }
        
        toast({
          title: 'خطأ في الموقع',
          description: errorMessage,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const openInMaps = (lat: string, lng: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

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
      setGpsLatitude("");
      setGpsLongitude("");
      setGpsAddress("");
      setOpen(false);
      
      // Notify parent component
      if (onCustomerAdded) {
        onCustomerAdded({ 
          name: customer.name, 
          phone: customer.phone,
          email: customer.email,
          address: customer.address
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
      phone: phone.trim() || "",
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      gpsLatitude: gpsLatitude || undefined,
      gpsLongitude: gpsLongitude || undefined,
      gpsAddress: gpsAddress || undefined,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">الموقع الجغرافي (GPS)</Label>
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                size="sm"
                variant="outline"
                className="text-xs"
                data-testid="button-get-location"
              >
                <Navigation className="h-3 w-3 mr-1" />
                {isGettingLocation ? 'جاري التحديد...' : 'تحديد الموقع'}
              </Button>
            </div>

            <div className="space-y-3">
              {gpsLatitude && gpsLongitude && (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <div 
                    className="relative h-32 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (gpsLatitude && gpsLongitude) openInMaps(gpsLatitude, gpsLongitude);
                    }}
                    data-testid="map-preview"
                  >
                    <iframe
                      src={`https://maps.google.com/maps?q=${gpsLatitude},${gpsLongitude}&t=m&z=15&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, pointerEvents: 'none' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="معاينة الموقع"
                    />
                    <div className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="bg-white/90 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm opacity-0 hover:opacity-100 transition-opacity">
                        انقر لفتح في خرائط جوجل
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-background">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="font-medium">تم تحديد الموقع</span>
                    </div>
                    {gpsAddress && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {gpsAddress}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!gpsLatitude && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">اضغط "تحديد الموقع" لإضافة موقع العميل</p>
                </div>
              )}
            </div>
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
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Phone, MapPin, Plus, Edit, Trash2, Navigation, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { CustomerMap } from '@/components/customers/customer-map';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';

// نموذج التحقق للعميل
const customerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  phone: z.string()
    .min(11, 'رقم الهاتف يجب أن يكون على الأقل 11 رقم')
    .regex(/^\+964\d{10,11}$/, 'رقم الهاتف يجب أن يبدأ بـ +964 ويتكون من 13-14 رقم'),
  address: z.string().optional(),
  gpsLatitude: z.string().optional(),
  gpsLongitude: z.string().optional(),
  gpsAddress: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema> & {
  whatsappNumber?: string; // للتوافق مع النموذج الحالي
};

export default function Customers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '+964',
      address: '',
      gpsLatitude: '',
      gpsLongitude: '',
      gpsAddress: '',
    },
  });

  // إضافة أو تحديث عميل
  const customerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // إضافة whatsappNumber نفس phone للتوافق مع قاعدة البيانات
      const customerData = {
        ...data,
        whatsappNumber: data.phone
      };
      
      if (editingCustomer) {
        const response = await apiRequest('PUT', `/api/customers/${editingCustomer.id}`, customerData);
        return await response.json();
      } else {
        const response = await apiRequest('POST', '/api/customers', customerData);
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
      toast({
        title: 'تم بنجاح',
        description: editingCustomer ? 'تم تحديث العميل' : 'تم إضافة العميل',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "يتطلب تسجيل الدخول",
          description: "جاري إعادة توجيهك لتسجيل الدخول...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في العملية',
        variant: 'destructive',
      });
    },
  });

  // حذف عميل
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest('DELETE', `/api/customers/${customerId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العميل بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف العميل',
        variant: 'destructive',
      });
    },
  });

  // الحصول على الموقع الحالي
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
        
        form.setValue('gpsLatitude', lat);
        form.setValue('gpsLongitude', lng);
        
        // محاولة الحصول على العنوان من الإحداثيات مع User-Agent
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
              form.setValue('gpsAddress', data.display_name);
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

  const onSubmit = (data: CustomerFormData) => {
    customerMutation.mutate(data);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setValue('name', customer.name);
    // تأكد من أن رقم الهاتف يبدأ بـ +964
    const phoneNumber = customer.phone.startsWith('+964') ? customer.phone : `+964${customer.phone}`;
    form.setValue('phone', phoneNumber);
    form.setValue('address', customer.address || '');
    form.setValue('gpsLatitude', customer.gpsLatitude || '');
    form.setValue('gpsLongitude', customer.gpsLongitude || '');
    form.setValue('gpsAddress', customer.gpsAddress || '');
    setIsDialogOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteMutation.mutate(customerId);
    }
  };

  const openInMaps = (lat: string, lng: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // التحقق من المصادقة
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">تسجيل الدخول مطلوب</h2>
          <p className="text-muted-foreground mb-4">يجب تسجيل الدخول للوصول إلى قائمة العملاء</p>
          <Button onClick={() => window.location.href = '/api/login'}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">قائمة العملاء</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={showMap ? "default" : "outline"} 
            onClick={() => setShowMap(!showMap)} 
            data-testid="button-toggle-map"
          >
            <Map className="h-4 w-4 mr-2" />
            {showMap ? "إخفاء الخريطة" : "عرض الخريطة"}
          </Button>
        </div>
      </div>

      {showMap && customers && (
        <CustomerMap customers={customers} />
      )}

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingCustomer(null);
                form.reset();
              }}
              data-testid="button-add-customer"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة عميل
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العميل *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="اسم العميل" data-testid="input-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف والواتساب *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            placeholder="+9647xxxxxxxxxx" 
                            data-testid="input-customer-phone"
                            onChange={(e) => {
                              let value = e.target.value;
                              // تأكد من أن القيمة تبدأ بـ +964
                              if (!value.startsWith('+964')) {
                                value = '+964' + value.replace(/^\+964/, '').replace(/[^\d]/g, '');
                              }
                              // اقتطع النص إذا كان أطول من اللازم
                              if (value.length > 14) {
                                value = value.substring(0, 14);
                              }
                              field.onChange(value);
                            }}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                            هاتف + واتساب
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        سيتم استخدام نفس الرقم للهاتف والواتساب
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="عنوان العميل" rows={2} data-testid="input-customer-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">موقع GPS</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      data-testid="button-get-location"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {isGettingLocation ? 'جاري التحديد...' : 'تحديد الموقع'}
                    </Button>
                  </div>

                  {/* Hidden GPS fields */}
                  <div className="hidden">
                    <FormField
                      control={form.control}
                      name="gpsLatitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} data-testid="input-gps-lat" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gpsLongitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} data-testid="input-gps-lng" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gpsAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} data-testid="input-gps-address" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Map preview */}
                  {form.watch('gpsLatitude') && form.watch('gpsLongitude') && (
                    <div className="border rounded-lg overflow-hidden bg-muted">
                      <div 
                        className="relative h-32 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          const lat = form.watch('gpsLatitude');
                          const lng = form.watch('gpsLongitude');
                          if (lat && lng) openInMaps(lat, lng);
                        }}
                        data-testid="map-preview"
                      >
                        <iframe
                          src={`https://maps.google.com/maps?q=${form.watch('gpsLatitude')},${form.watch('gpsLongitude')}&t=m&z=15&output=embed`}
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
                        {form.watch('gpsAddress') && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {form.watch('gpsAddress')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!form.watch('gpsLatitude') && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">اضغط "تحديد الموقع" لإضافة موقع العميل</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-customer"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={customerMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-customer"
                  >
                    {customerMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>جاري التحميل...</p>
        </div>
      ) : !customers || customers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد عملاء مضافين بعد</p>
              <p className="text-sm">ابدأ بإضافة عميل جديد</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg" data-testid={`text-customer-name-${customer.id}`}>
                        {customer.name}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-customer-phone-${customer.id}`}>{customer.phone}</span>
                        <Badge variant="secondary" className="text-xs">
                          هاتف + واتساب
                        </Badge>
                      </div>

                      {customer.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground" data-testid={`text-customer-address-${customer.id}`}>
                            {customer.address}
                          </span>
                        </div>
                      )}

                      {customer.gpsLatitude && customer.gpsLongitude && (
                        <div className="mt-3">
                          <div 
                            className="relative h-24 rounded-lg overflow-hidden cursor-pointer border hover:opacity-90 transition-opacity"
                            onClick={() => openInMaps(customer.gpsLatitude!, customer.gpsLongitude!)}
                            data-testid={`map-preview-${customer.id}`}
                          >
                            <iframe
                              src={`https://maps.google.com/maps?q=${customer.gpsLatitude},${customer.gpsLongitude}&t=m&z=15&output=embed`}
                              width="100%"
                              height="100%"
                              style={{ border: 0, pointerEvents: 'none' }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title={`موقع ${customer.name}`}
                            />
                            <div className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors flex items-center justify-center">
                              <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium shadow-sm opacity-0 hover:opacity-100 transition-opacity">
                                <Map className="h-3 w-3 inline mr-1" />
                                فتح في خرائط جوجل
                              </div>
                            </div>
                          </div>
                          {customer.gpsAddress && (
                            <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {customer.gpsAddress}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(customer)}
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-customer-${customer.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
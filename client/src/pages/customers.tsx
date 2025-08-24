import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Phone, Plus, Edit, Trash2, Search, X, Calendar, FileText, Eye, Mail, MapPin, Navigation, Map, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Customer, Task } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';

// نموذج التحقق للعميل
const customerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  address: z.string().optional(),
  gpsLatitude: z.string().optional(),
  gpsLongitude: z.string().optional(),
  gpsAddress: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// Map Component for displaying customers on a map
const CustomersMap = ({ customers, onCustomerSelect }: { customers: Customer[], onCustomerSelect: (customer: Customer) => void }) => {
  const customersWithGPS = customers.filter(c => c.gpsLatitude && c.gpsLongitude);
  
  if (customersWithGPS.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مواقع GPS</h3>
        <p className="text-gray-500">لا يحتوي أي من العملاء المعروضين على إحداثيات GPS صحيحة</p>
        <p className="text-sm text-gray-400 mt-2">يرجى إضافة إحداثيات GPS للعملاء لعرضهم على الخريطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-blue-900">عملاء مع مواقع GPS</h3>
        </div>
        <p className="text-blue-700 mb-4">
          يتم عرض {customersWithGPS.length} من العملاء الذين لديهم إحداثيات GPS صحيحة
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {customersWithGPS.map((customer) => {
            // Generate unique colors for each customer card
            const getCustomerBorderColor = (customerId: string) => {
              const colors = [
                'border-l-emerald-500 bg-emerald-50/40',
                'border-l-blue-500 bg-blue-50/40', 
                'border-l-violet-500 bg-violet-50/40',
                'border-l-amber-500 bg-amber-50/40',
                'border-l-pink-500 bg-pink-50/40',
                'border-l-cyan-500 bg-cyan-50/40',
                'border-l-rose-500 bg-rose-50/40',
                'border-l-teal-500 bg-teal-50/40'
              ];
              const hash = customerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
              return colors[hash % colors.length];
            };

            return (
              <Card key={customer.id} className={`border-l-4 ${getCustomerBorderColor(customer.id)} hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-white/90 backdrop-blur-sm`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">{customer.name}</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-start">
                            <span className="mr-1 text-xs">📍</span>
                            <span className="text-xs leading-tight line-clamp-2">{customer.address}</span>
                          </div>
                        )}
                        {customer.gpsAddress && (
                          <div className="flex items-start">
                            <Navigation className="h-3 w-3 mr-1 text-green-600 mt-0.5" />
                            <span className="text-xs leading-tight text-green-700 line-clamp-1">{customer.gpsAddress}</span>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
                
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        GPS: {parseFloat(customer.gpsLatitude!).toFixed(4)}, {parseFloat(customer.gpsLongitude!).toFixed(4)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${customer.gpsLatitude},${customer.gpsLongitude}`;
                            window.open(url, '_blank');
                          }}
                          className="px-2 py-1 h-6 text-xs"
                          data-testid={`button-open-maps-${customer.id}`}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          <span className="text-xs">خرائط</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCustomerSelect(customer)}
                          className="px-2 py-1 h-6 text-xs"
                          data-testid={`button-details-${customer.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-xs">تفاصيل</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {customersWithGPS.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-800">
                يمكنك النقر على "خرائط" لفتح الموقع في تطبيق الخرائط، أو "تفاصيل" لعرض معلومات العميل
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Customers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // البحث عن المهام المرتبطة بعميل معين
  const { data: customerTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', 'customer', selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
  });

  // تصفية العملاء حسب البحث
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      gpsLatitude: '',
      gpsLongitude: '',
      gpsAddress: '',
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
        gpsLatitude: data.gpsLatitude || undefined,
        gpsLongitude: data.gpsLongitude || undefined,
        gpsAddress: data.gpsAddress || undefined,
      };
      const response = await apiRequest('POST', '/api/customers', customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'تم إضافة العميل بنجاح',
        description: 'تم حفظ معلومات العميل في النظام.',
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مخول",
          description: "انت غير مسجل الدخول. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'خطأ في إضافة العميل',
        description: 'حدث خطأ أثناء إضافة العميل. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData & { id: string }) => {
      const customerData = {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
        gpsLatitude: data.gpsLatitude || undefined,
        gpsLongitude: data.gpsLongitude || undefined,
        gpsAddress: data.gpsAddress || undefined,
      };
      const response = await apiRequest('PUT', `/api/customers/${data.id}`, customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'تم تحديث العميل بنجاح',
        description: 'تم حفظ التغييرات في النظام.',
      });
      form.reset();
      setEditingCustomer(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مخول",
          description: "انت غير مسجل الدخول. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'خطأ في تحديث العميل',
        description: 'حدث خطأ أثناء تحديث معلومات العميل.',
        variant: 'destructive',
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'تم حذف العميل بنجاح',
        description: 'تم حذف العميل من النظام.',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مخول",
          description: "انت غير مسجل الدخول. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'خطأ في حذف العميل',
        description: 'حدث خطأ أثناء حذف العميل.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      gpsLatitude: customer.gpsLatitude || '',
      gpsLongitude: customer.gpsLongitude || '',
      gpsAddress: customer.gpsAddress || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    form.reset();
    setIsDialogOpen(true);
  };

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
              form.setValue('gpsAddress', data.display_name);
            }
          })
          .catch((error) => {
            console.log('فشل في الحصول على العنوان:', error);
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

  const showCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل قائمة العملاء...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <CardTitle className="text-xl">إدارة العملاء</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {/* View Toggle Buttons */}
              <div className="flex border rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  data-testid="button-list-view"
                >
                  <List className="h-4 w-4 mr-1" />
                  قائمة
                </Button>
                <Button
                  onClick={() => setViewMode('map')}
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  data-testid="button-map-view"
                >
                  <Map className="h-4 w-4 mr-1" />
                  خريطة
                </Button>
              </div>
              
              <Button
                onClick={handleAddNew}
                className="flex items-center space-x-2"
                data-testid="button-add-customer-main"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة عميل جديد</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* شريط البحث */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في العملاء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-customers"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSearchTerm('')}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* عرض القائمة أو الخريطة */}
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء حتى الآن'}
                  </p>
                </div>
              ) : (
              filteredCustomers.map((customer) => {
                // تحديد لون الحد للعميل بناءً على ID
                const getCustomerBorderColor = (customerId: string) => {
                  const colors = [
                    'border-l-blue-500 bg-blue-50/20',
                    'border-l-green-500 bg-green-50/20',
                    'border-l-purple-500 bg-purple-50/20',
                    'border-l-orange-500 bg-orange-50/20',
                    'border-l-pink-500 bg-pink-50/20',
                    'border-l-indigo-500 bg-indigo-50/20',
                    'border-l-teal-500 bg-teal-50/20',
                    'border-l-rose-500 bg-rose-50/20'
                  ];
                  const hash = customerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                  return colors[hash % colors.length];
                };

                return (
                  <Card key={customer.id} className={`border-l-4 ${getCustomerBorderColor(customer.id)} hover:shadow-md transition-shadow`}>
                    <CardContent className="p-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold mb-1 text-gray-900 truncate">{customer.name}</h3>
                          <div className="space-y-0.5">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                            {customer.email && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-start text-xs text-muted-foreground">
                                <span className="mr-1.5 flex-shrink-0 mt-0.5">📍</span>
                                <span className="line-clamp-1">{customer.address}</span>
                              </div>
                            )}
                            {customer.gpsLatitude && customer.gpsLongitude && (
                              <div className="flex items-center text-xs">
                                <MapPin className="h-3 w-3 mr-1.5 text-green-600 flex-shrink-0" />
                                <button
                                  onClick={() => openInMaps(customer.gpsLatitude!, customer.gpsLongitude!)}
                                  className="text-blue-600 hover:text-blue-700 underline text-xs truncate"
                                >
                                  عرض على الخريطة
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showCustomerDetails(customer)}
                            className="p-1.5 h-7 w-7"
                            data-testid={`button-view-customer-${customer.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            className="p-1.5 h-7 w-7"
                            data-testid={`button-edit-customer-${customer.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(customer)}
                            className="p-1.5 h-7 w-7 text-red-600 hover:text-red-700"
                            data-testid={`button-delete-customer-${customer.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
              )}
            </div>
          ) : (
            /* Map View */
            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء لعرضهم على الخريطة'}
                  </p>
                </div>
              ) : (
                <CustomersMap customers={filteredCustomers} onCustomerSelect={showCustomerDetails} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إضافة/تعديل العميل */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
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
                      <Input
                        placeholder="أدخل اسم العميل"
                        {...field}
                        data-testid="input-customer-name"
                      />
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
                    <FormLabel>رقم الهاتف *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="مثال: +9647812345678"
                        {...field}
                        data-testid="input-customer-phone"
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1">
                      يرجى إدخال رقم الهاتف مع مفتاح الدولة (مثال: +964 للعراق)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        {...field}
                        data-testid="input-customer-email"
                      />
                    </FormControl>
                    <FormMessage />
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
                      <Textarea
                        placeholder="أدخل عنوان العميل"
                        rows={2}
                        {...field}
                        data-testid="textarea-customer-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* قسم الموقع الجغرافي */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">الموقع الجغرافي (GPS)</label>
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
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">اضغط "تحديد الموقع" لإضافة موقع العميل</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-customer"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {createCustomerMutation.isPending || updateCustomerMutation.isPending
                    ? 'جاري الحفظ...'
                    : editingCustomer
                    ? 'تحديث العميل'
                    : 'إضافة العميل'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* نافذة تفاصيل العميل */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل العميل</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{selectedCustomer.phone}</span>
                </div>

                {selectedCustomer.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}

                {selectedCustomer.address && (
                  <div className="flex items-start">
                    <span className="mr-2 mt-0.5 text-muted-foreground">📍</span>
                    <span>{selectedCustomer.address}</span>
                  </div>
                )}

                {selectedCustomer.createdAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>تم الإضافة: {new Date(selectedCustomer.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>

              {/* المهام المرتبطة */}
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  المهام المرتبطة
                </h4>
                {tasksLoading ? (
                  <p className="text-sm text-muted-foreground">جاري تحميل المهام...</p>
                ) : customerTasks && customerTasks.length > 0 ? (
                  <div className="space-y-2">
                    {customerTasks.map((task) => (
                      <div key={task.id} className="text-sm p-2 bg-muted rounded">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-muted-foreground">
                          {task.taskNumber} - {task.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد مهام مرتبطة بهذا العميل</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
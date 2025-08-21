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
import { Users, Phone, Plus, Edit, Trash2, Search, X, Calendar, FileText, Eye, Mail } from 'lucide-react';
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
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function Customers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
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

          {/* قائمة العملاء */}
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء حتى الآن'}
                </p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{customer.name}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="h-4 w-4 mr-2" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span className="mr-2">📍</span>
                              <span>{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showCustomerDetails(customer)}
                          data-testid={`button-view-customer-${customer.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          data-testid={`button-edit-customer-${customer.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-customer-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* نافذة إضافة/تعديل العميل */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
                        placeholder="أدخل رقم الهاتف"
                        {...field}
                        data-testid="input-customer-phone"
                      />
                    </FormControl>
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
                    <span>تم الإضافة: {new Date(selectedCustomer.createdAt).toLocaleDateString('ar-SA')}</span>
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
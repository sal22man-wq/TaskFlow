import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Star, MessageSquare, Phone, Calendar, User } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";

interface CustomerRating {
  id: string;
  taskId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  rating: string;
  ratingText: string;
  messageSent: string;
  responseReceived: string;
  createdAt: string;
}

export default function CustomerRatingsPage() {
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: ratings = [], isLoading } = useQuery<CustomerRating[]>({
    queryKey: ["/api/customer-ratings"],
  });

  const sortedRatings = [...ratings].sort((a: CustomerRating, b: CustomerRating) => {
    const aValue = a[sortBy as keyof CustomerRating];
    const bValue = b[sortBy as keyof CustomerRating];
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === "asc" ? -1 : 1;
    if (bValue == null) return sortOrder === "asc" ? 1 : -1;
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'angry': return '😠';
      case 'satisfied': return '😊';
      case 'very_satisfied': return '😍';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'angry': return 'destructive';
      case 'satisfied': return 'secondary';
      case 'very_satisfied': return 'default';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل التقييمات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">تقييمات العملاء</h1>
              <p className="text-muted-foreground mt-2">
                عرض وإدارة تقييمات رضا العملاء المرسلة عند إكمال المهام
              </p>
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">التاريخ</SelectItem>
                  <SelectItem value="customerName">اسم العميل</SelectItem>
                  <SelectItem value="rating">التقييم</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                data-testid="button-toggle-sort"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Star className="h-8 w-8 text-yellow-500 ml-4" />
                <div>
                  <p className="text-2xl font-bold">{ratings.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي التقييمات</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="text-2xl ml-4">😍</div>
                <div>
                  <p className="text-2xl font-bold">
                    {ratings.filter((r: CustomerRating) => r.rating === 'very_satisfied').length}
                  </p>
                  <p className="text-sm text-muted-foreground">راضي جداً</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="text-2xl ml-4">😊</div>
                <div>
                  <p className="text-2xl font-bold">
                    {ratings.filter((r: CustomerRating) => r.rating === 'satisfied').length}
                  </p>
                  <p className="text-sm text-muted-foreground">راضي</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="text-2xl ml-4">😠</div>
                <div>
                  <p className="text-2xl font-bold">
                    {ratings.filter((r: CustomerRating) => r.rating === 'angry').length}
                  </p>
                  <p className="text-sm text-muted-foreground">غاضب</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ratings List */}
          <div className="space-y-4">
            {sortedRatings.length > 0 ? (
              sortedRatings.map((rating: CustomerRating) => (
                <Card key={rating.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getRatingEmoji(rating.rating)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{rating.customerName}</CardTitle>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {rating.customerPhone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(rating.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Badge variant={getRatingColor(rating.rating) as any}>
                        {rating.ratingText}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">حالة الطلب:</span>
                          <Badge variant={rating.messageSent === 'true' ? 'default' : 'secondary'}>
                            {rating.messageSent === 'true' ? 'تم الطلب' : 'لم يتم الطلب'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span className="font-medium">حالة الرد:</span>
                          <Badge variant={rating.responseReceived === 'true' ? 'default' : 'outline'}>
                            {rating.responseReceived === 'true' ? 'تم الرد' : 'في انتظار الرد'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-muted-foreground">معرف المهمة:</span>
                          <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                            {rating.taskId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد تقييمات بعد</h3>
                  <p className="text-muted-foreground text-center">
                    سيتم عرض تقييمات العملاء هنا بمجرد إكمال المهام وطلب التقييمات
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Award, TrendingUp, Users, ArrowRight, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface TeamPointsStats {
  // للمستخدمين العاديين
  userPoints?: number;
  userTotalEarned?: number;
  userRank?: number;
  
  // للمديرين والمشرفين
  totalMembers: number;
  totalPoints?: number;
  averagePoints?: number;
  topScorer?: {
    name: string;
    points: number;
    role: string;
  };
  topPerformers?: Array<{
    name: string;
    points: number;
    role: string;
  }>;
  canViewAll: boolean;
}

export function TeamPointsWidget() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: pointsStats, isLoading } = useQuery<TeamPointsStats>({
    queryKey: ['/api/team-points/stats'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            نقاط الفريق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pointsStats) {
    return null;
  }

  // عرض مبسط للجميع (تم تعديله لإظهار المعلومات لجميع المستخدمين)
  // جميع المستخدمين يمكنهم رؤية النقاط الآن
  if (false) { // تم إلغاء هذا الشرط
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            نقاطي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {pointsStats.userPoints || 0}
            </div>
            <div className="text-sm text-muted-foreground">نقطة حالية</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {pointsStats.userTotalEarned || 0}
              </div>
              <div className="text-xs text-muted-foreground">إجمالي النقاط</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-purple-600">
                #{pointsStats.userRank || '-'}
              </div>
              <div className="text-xs text-muted-foreground">ترتيبي</div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setLocation('/admin/team-points')}
            >
              <Trophy className="h-4 w-4 mr-2" />
              عرض جميع النقاط
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // عرض للمديرين والمشرفين
  return (
    <div className="space-y-4">
      {/* إحصائيات عامة */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            إحصائيات النقاط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pointsStats.totalMembers}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                أعضاء الفريق
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pointsStats.totalPoints || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-4 w-4" />
                إجمالي النقاط
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {pointsStats.averagePoints || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                متوسط النقاط
              </div>
            </div>
            
            <div className="text-center">
              {pointsStats.topScorer ? (
                <>
                  <div className="text-lg font-bold text-yellow-600">
                    {pointsStats.topScorer.points}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    أعلى نقاط
                  </div>
                  <div className="text-xs font-medium truncate">
                    {pointsStats.topScorer.name}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">لا يوجد نقاط</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نقاط المستخدم الحالي */}
      {pointsStats.userPoints !== undefined && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              نقاطي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {pointsStats.userPoints}
                </div>
                <div className="text-sm text-muted-foreground">نقطة حالية</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {pointsStats.userTotalEarned || 0}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي النقاط</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  #{pointsStats.userRank || '-'}
                </div>
                <div className="text-sm text-muted-foreground">ترتيبي</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أفضل الأداء */}
      {pointsStats.topPerformers && pointsStats.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              أفضل أداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pointsStats.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{performer.name}</div>
                      <div className="text-sm text-muted-foreground">{performer.role}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {performer.points} نقطة
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation('/admin/team-points')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                إدارة النقاط
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              {(user as any)?.role === 'admin' && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => setLocation('/admin/team-points')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة نقاط
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
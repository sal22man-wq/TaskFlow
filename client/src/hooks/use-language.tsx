import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.tasks': 'Tasks',
    'nav.myTasks': 'My Tasks',
    'nav.team': 'Team',
    'nav.customers': 'Customers',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to TaskFlow',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.createTask': 'Create Task',
    'dashboard.addMember': 'Add Member',
    'dashboard.weeklySchedule': 'Weekly Schedule',
    'dashboard.upcomingSchedule': 'Upcoming Schedule',
    'dashboard.recentTasks': 'Recent Tasks',

    // Tasks
    'task.title': 'Title',
    'task.description': 'Description',
    'task.customer': 'Customer',
    'task.phone': 'Phone',
    'task.address': 'Address',
    'task.time': 'Time',
    'task.notes': 'Notes',
    'task.priority': 'Priority',
    'task.status': 'Status',
    'task.assignees': 'Assignees',
    'task.dueDate': 'Due Date',
    'task.progress': 'Progress',

    // Status
    'status.pending': 'Pending',
    'status.start': 'Started',
    'status.complete': 'Complete',

    // Priority
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',

    // Actions
    'action.create': 'Create',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.submit': 'Submit',
    'action.startTask': 'Start Task',
    'action.completeTask': 'Complete Task',
    'action.resetTask': 'Reset to Pending',

    // Messages
    'msg.noTasks': 'No tasks found',
    'msg.taskCreated': 'Task created successfully',
    'msg.taskUpdated': 'Task updated successfully',
    'msg.loading': 'Loading...',
    'msg.saving': 'Saving...',
    'msg.updating': 'Updating...',

    // My Tasks
    'myTasks.title': 'My Tasks',
    'myTasks.subtitle': 'Personal task overview with priorities and reminders',
    'myTasks.highPriority': 'High Priority Tasks',
    'myTasks.overdue': 'Overdue Tasks',
    'myTasks.upcoming': 'Upcoming This Week',
    'myTasks.withComments': 'Tasks with Comments',

    // Admin
    'admin.logs': 'System Logs',
    'admin.access': 'Administrator Access',
    'admin.password': 'Enter admin password',
    'admin.login': 'Access Admin Panel',

    // Language
    'lang.english': 'English',
    'lang.arabic': 'العربية',
    'lang.switch': 'Switch Language',

    // Chat
    'chat.title': 'Team Chat',
    'chat.taskChat': 'Task Chat',
    'chat.typeMessage': 'Type a message...',
    'chat.send': 'Send',
    'chat.close': 'Close',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.tasks': 'المهام',
    'nav.myTasks': 'مهامي',
    'nav.team': 'الفريق',
    'nav.customers': 'العملاء',
    'nav.profile': 'الملف الشخصي',
    'nav.admin': 'المدير',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'أهلاً بك في تدفق المهام',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.createTask': 'إنشاء مهمة',
    'dashboard.addMember': 'إضافة عضو',
    'dashboard.weeklySchedule': 'الجدول الأسبوعي',
    'dashboard.upcomingSchedule': 'الجدول القادم',
    'dashboard.recentTasks': 'المهام الحديثة',

    // Tasks
    'task.title': 'العنوان',
    'task.description': 'الوصف',
    'task.customer': 'العميل',
    'task.phone': 'الهاتف',
    'task.address': 'العنوان',
    'task.time': 'الوقت',
    'task.notes': 'ملاحظات',
    'task.priority': 'الأولوية',
    'task.status': 'الحالة',
    'task.assignees': 'المكلفون',
    'task.dueDate': 'تاريخ الاستحقاق',
    'task.progress': 'التقدم',

    // Status
    'status.pending': 'في الانتظار',
    'status.start': 'بدأ',
    'status.complete': 'مكتمل',

    // Priority
    'priority.low': 'منخفض',
    'priority.medium': 'متوسط',
    'priority.high': 'عالي',

    // Actions
    'action.create': 'إنشاء',
    'action.edit': 'تحرير',
    'action.delete': 'حذف',
    'action.save': 'حفظ',
    'action.cancel': 'إلغاء',
    'action.close': 'إغلاق',
    'action.submit': 'إرسال',
    'action.startTask': 'بدء المهمة',
    'action.completeTask': 'إكمال المهمة',
    'action.resetTask': 'إعادة تعيين للانتظار',

    // Messages
    'msg.noTasks': 'لا توجد مهام',
    'msg.taskCreated': 'تم إنشاء المهمة بنجاح',
    'msg.taskUpdated': 'تم تحديث المهمة بنجاح',
    'msg.loading': 'جاري التحميل...',
    'msg.saving': 'جاري الحفظ...',
    'msg.updating': 'جاري التحديث...',

    // My Tasks
    'myTasks.title': 'مهامي',
    'myTasks.subtitle': 'نظرة عامة على المهام الشخصية مع الأولويات والتذكيرات',
    'myTasks.highPriority': 'المهام عالية الأولوية',
    'myTasks.overdue': 'المهام المتأخرة',
    'myTasks.upcoming': 'القادمة هذا الأسبوع',
    'myTasks.withComments': 'المهام مع التعليقات',

    // Admin
    'admin.logs': 'سجلات النظام',
    'admin.access': 'وصول المدير',
    'admin.password': 'أدخل كلمة مرور المدير',
    'admin.login': 'الوصول إلى لوحة المدير',

    // Language
    'lang.english': 'English',
    'lang.arabic': 'العربية',
    'lang.switch': 'تبديل اللغة',

    // Chat
    'chat.title': 'دردشة الفريق',
    'chat.taskChat': 'دردشة المهمة',
    'chat.typeMessage': 'اكتب رسالة...',
    'chat.send': 'إرسال',
    'chat.close': 'إغلاق',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar' | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
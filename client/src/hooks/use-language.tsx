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
    'dashboard.admin': 'Admin',
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

    // Common
    'common.viewAll': 'View All',

    // Messages
    'msg.noTasks': 'No tasks found',
    'msg.noTeamMembers': 'No team members found',
    'msg.noUpcomingTasks': 'No upcoming tasks in the next 7 days',
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

    // Error Messages
    'error.generic': 'An error occurred. Please try again.',
    'error.network': 'Network connection error. Please check your internet connection.',
    'error.unauthorized': 'You are not authorized to access this resource.',
    'error.forbidden': 'Access denied. Insufficient permissions.',
    'error.notFound': 'The requested resource was not found.',
    'error.validation': 'Please check your input and try again.',
    'error.server': 'Server error. Please try again later.',
    'error.timeout': 'Request timed out. Please try again.',
    'error.database': 'Database error. Please contact support.',
    'error.session': 'Your session has expired. Please log in again.',
    'error.fileUpload': 'File upload failed. Please check file size and format.',
    'error.invalidFormat': 'Invalid format. Please check your input.',
    'error.tooManyRequests': 'Too many requests. Please wait before trying again.',

    // Form Validation Errors
    'validation.required': 'This field is required',
    'validation.email': 'Please enter a valid email address',
    'validation.phone': 'Please enter a valid phone number',
    'validation.minLength': 'Minimum {min} characters required',
    'validation.maxLength': 'Maximum {max} characters allowed',
    'validation.password': 'Password must be at least 6 characters',
    'validation.passwordMatch': 'Passwords do not match',
    'validation.future': 'Date must be in the future',
    'validation.past': 'Date must be in the past',

    // User Guidance
    'guidance.loading': 'Loading data, please wait...',
    'guidance.saving': 'Saving your changes...',
    'guidance.deleting': 'Deleting item...',
    'guidance.uploading': 'Uploading file...',
    'guidance.connecting': 'Establishing connection...',
    'guidance.processing': 'Processing your request...',
    'guidance.retry': 'Click to retry',
    'guidance.refresh': 'Refresh the page',
    'guidance.contactSupport': 'Contact support if the problem persists',

    // WhatsApp Messages
    'whatsapp.connecting': 'Connecting to WhatsApp...',
    'whatsapp.connected': 'WhatsApp connected successfully',
    'whatsapp.disconnected': 'WhatsApp disconnected',
    'whatsapp.qrCode': 'Scan QR code with WhatsApp',
    'whatsapp.reconnecting': 'Reconnecting to WhatsApp...',
    'whatsapp.messageSent': 'Message sent successfully',
    'whatsapp.messageFailed': 'Failed to send message',
    'whatsapp.settingsUpdated': 'WhatsApp settings updated',

    // Success Messages
    'success.taskCreated': 'Task created successfully',
    'success.taskUpdated': 'Task updated successfully',
    'success.taskDeleted': 'Task deleted successfully',
    'success.userCreated': 'User created successfully',
    'success.userUpdated': 'User updated successfully',
    'success.profileUpdated': 'Profile updated successfully',
    'success.passwordChanged': 'Password changed successfully',
    'success.settingsSaved': 'Settings saved successfully',
    'admin.password': 'Enter admin password',
    'admin.login': 'Access Admin Panel',
    'admin.userManagement': 'User Management',
    'admin.addUser': 'Add User',
    'admin.approveUsers': 'Approve Users',

    // Team
    'team.title': 'Team',
    'team.addMember': 'Add Member',
    'team.memberName': 'Member Name',
    'team.memberRole': 'Member Role',
    'team.memberEmail': 'Member Email',
    'team.memberStatus': 'Member Status',
    'team.available': 'Available',
    'team.busy': 'Busy',
    'team.offline': 'Offline',

    // Users
    'user.username': 'Username',
    'user.password': 'Password',
    'user.role': 'Role',
    'user.admin': 'Administrator',
    'user.regular': 'Regular User',
    'user.approve': 'Approve',
    'user.reject': 'Reject',
    'user.pending': 'Pending',
    'user.approved': 'Approved',
    'user.rejected': 'Rejected',

    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.loginBtn': 'Login',
    'auth.logoutConfirm': 'Are you sure you want to logout?',

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

    // Profile
    'profile.title': 'Profile',
    'profile.settings': 'Settings',
    'profile.helpSupport': 'Help & Support',
    'profile.adminOptions': 'Admin Options',

    // Statistics
    'stats.activeTasks': 'Active Tasks',
    'stats.completed': 'Completed',
    'stats.overdue': 'Overdue',
    'stats.total': 'Total',
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
    'dashboard.welcome': 'أهلاً بك في نظام إدارة المهام',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.createTask': 'إنشاء مهمة',
    'dashboard.addMember': 'إضافة عضو',
    'dashboard.admin': 'المدير',
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
    'status.todo': 'في الانتظار',
    'status.start': 'بدأ',
    'status.complete': 'مكتمل',

    // Priority
    'priority.low': 'منخفض',
    'priority.medium': 'متوسط',
    'priority.متوسطة': 'متوسط',
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

    // Common
    'common.viewAll': 'عرض الكل',

    // Messages
    'msg.noTasks': 'لا توجد مهام',
    'msg.noTeamMembers': 'لا يوجد أعضاء في الفريق',
    'msg.noUpcomingTasks': 'لا توجد مهام قادمة في الأيام السبعة القادمة',
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
    'admin.userManagement': 'إدارة المستخدمين',
    'admin.addUser': 'إضافة مستخدم',
    'admin.approveUsers': 'موافقة المستخدمين',

    // Team
    'team.title': 'الفريق',
    'team.addMember': 'إضافة عضو',
    'team.memberName': 'اسم العضو',
    'team.memberRole': 'دور العضو',
    'team.memberEmail': 'بريد العضو الإلكتروني',
    'team.memberStatus': 'حالة العضو',
    'team.available': 'متوفر',
    'team.busy': 'مشغول',
    'team.offline': 'غير متصل',

    // Users
    'user.username': 'اسم المستخدم',
    'user.password': 'كلمة المرور',
    'user.role': 'الدور',
    'user.admin': 'مدير',
    'user.regular': 'مستخدم عادي',
    'user.approve': 'موافقة',
    'user.reject': 'رفض',
    'user.pending': 'في الانتظار',
    'user.approved': 'مقبول',
    'user.rejected': 'مرفوض',

    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.username': 'اسم المستخدم',
    'auth.password': 'كلمة المرور',
    'auth.loginBtn': 'دخول',
    'auth.logoutConfirm': 'هل أنت متأكد من تسجيل الخروج؟',

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

    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.settings': 'الإعدادات',
    'profile.helpSupport': 'المساعدة والدعم',
    'profile.adminOptions': 'خيارات المدير',

    // Statistics
    'stats.activeTasks': 'المهام الفعالة',
    'stats.completed': 'المهام المكتملة',
    'stats.overdue': 'في الانتظار',
    'stats.total': 'الإجمالي',

    // Error Messages
    'error.generic': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'error.network': 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
    'error.unauthorized': 'غير مصرح لك بالوصول لهذا المورد.',
    'error.forbidden': 'تم رفض الوصول. صلاحيات غير كافية.',
    'error.notFound': 'المورد المطلوب غير موجود.',
    'error.validation': 'يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.',
    'error.server': 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
    'error.timeout': 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
    'error.database': 'خطأ في قاعدة البيانات. يرجى التواصل مع الدعم الفني.',
    'error.session': 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
    'error.fileUpload': 'فشل في رفع الملف. يرجى التحقق من حجم ونوع الملف.',
    'error.invalidFormat': 'تنسيق غير صحيح. يرجى التحقق من البيانات المدخلة.',
    'error.tooManyRequests': 'طلبات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.',

    // Form Validation Errors
    'validation.required': 'هذا الحقل مطلوب',
    'validation.email': 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    'validation.phone': 'يرجى إدخال رقم هاتف صحيح',
    'validation.minLength': 'يجب أن يكون {min} أحرف على الأقل',
    'validation.maxLength': 'الحد الأقصى {max} حرف',
    'validation.password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'validation.passwordMatch': 'كلمات المرور غير متطابقة',
    'validation.future': 'التاريخ يجب أن يكون في المستقبل',
    'validation.past': 'التاريخ يجب أن يكون في الماضي',

    // User Guidance
    'guidance.loading': 'جاري تحميل البيانات، يرجى الانتظار...',
    'guidance.saving': 'جاري حفظ التغييرات...',
    'guidance.deleting': 'جاري حذف العنصر...',
    'guidance.uploading': 'جاري رفع الملف...',
    'guidance.connecting': 'جاري تأسيس الاتصال...',
    'guidance.processing': 'جاري معالجة طلبك...',
    'guidance.retry': 'اضغط للمحاولة مرة أخرى',
    'guidance.refresh': 'أعد تحميل الصفحة',
    'guidance.contactSupport': 'تواصل مع الدعم الفني إذا استمرت المشكلة',

    // WhatsApp Messages
    'whatsapp.connecting': 'جاري الاتصال بالواتساب...',
    'whatsapp.connected': 'تم الاتصال بالواتساب بنجاح',
    'whatsapp.disconnected': 'تم قطع الاتصال مع الواتساب',
    'whatsapp.qrCode': 'امسح رمز QR بالواتساب',
    'whatsapp.reconnecting': 'جاري إعادة الاتصال بالواتساب...',
    'whatsapp.messageSent': 'تم إرسال الرسالة بنجاح',
    'whatsapp.messageFailed': 'فشل في إرسال الرسالة',
    'whatsapp.settingsUpdated': 'تم تحديث إعدادات الواتساب',

    // Success Messages
    'success.taskCreated': 'تم إنشاء المهمة بنجاح',
    'success.taskUpdated': 'تم تحديث المهمة بنجاح',
    'success.taskDeleted': 'تم حذف المهمة بنجاح',
    'success.userCreated': 'تم إنشاء المستخدم بنجاح',
    'success.userUpdated': 'تم تحديث المستخدم بنجاح',
    'success.profileUpdated': 'تم تحديث الملف الشخصي بنجاح',
    'success.passwordChanged': 'تم تغيير كلمة المرور بنجاح',
    'success.settingsSaved': 'تم حفظ الإعدادات بنجاح',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'ar'>('ar');

  useEffect(() => {
    // Force Arabic language by default and override any saved language
    setLanguageState('ar');
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: 'en' | 'ar') => {
    console.log('Setting language to:', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['en']];
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`);
      return key;
    }
    return translation;
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
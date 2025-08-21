import { storage } from './storage';

export class WhatsAppService {
  private isReady = false;

  constructor() {
    // Simulate WhatsApp service ready state
    this.isReady = true;
  }

  async initialize() {
    try {
      console.log('🚀 تم بدء نظام تقييم العملاء...');
      this.isReady = true;
    } catch (error) {
      console.error('❌ خطأ في تشغيل نظام تقييم العملاء:', error);
    }
  }

  // إرسال طلب تقييم العميل (محاكاة إرسال رسالة)
  async sendCustomerRatingRequest(
    phoneNumber: string, 
    customerName: string,
    taskTitle: string,
    taskId: string
  ): Promise<boolean> {
    if (!this.isReady) {
      console.log('❌ نظام تقييم العملاء غير جاهز');
      return false;
    }

    try {
      // تسجيل طلب التقييم في قاعدة البيانات (محاكاة إرسال رسالة)
      await storage.createCustomerRating({
        taskId,
        customerId: null,
        customerName,
        customerPhone: phoneNumber,
        rating: 'pending',
        ratingText: 'في انتظار الرد',
        messageSent: 'true',
        responseReceived: 'false'
      });

      console.log(`✅ تم تسجيل طلب تقييم للعميل: ${customerName} - ${phoneNumber}`);
      console.log(`📝 المهمة: ${taskTitle}`);
      console.log(`📱 في التطبيق الحقيقي سيتم إرسال رسالة واتساب للعميل`);
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في تسجيل طلب التقييم:', error);
      return false;
    }
  }

  // إضافة تقييم عميل يدوياً (للمحاكاة والاختبار)
  async addCustomerRating(
    taskId: string,
    phoneNumber: string,
    rating: 'angry' | 'satisfied' | 'very_satisfied'
  ): Promise<boolean> {
    try {
      const ratingMap = {
        'angry': 'غاضب',
        'satisfied': 'راضي',
        'very_satisfied': 'راضي جداً'
      };

      // البحث عن تقييم معلق للمهمة
      const existingRating = await storage.getPendingCustomerRating(phoneNumber);
      
      if (existingRating && existingRating.taskId === taskId) {
        // تحديث التقييم
        await storage.updateCustomerRating(existingRating.id, {
          rating,
          ratingText: ratingMap[rating],
          responseReceived: 'true'
        });

        console.log(`✅ تم تسجيل تقييم العميل: ${existingRating.customerName} - التقييم: ${ratingMap[rating]}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ خطأ في تسجيل تقييم العميل:', error);
      return false;
    }
  }

  // التحقق من حالة الخدمة
  isServiceReady(): boolean {
    return this.isReady;
  }
}

// إنشاء مثيل واحد من الخدمة
export const whatsappService = new WhatsAppService();
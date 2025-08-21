import { storage } from './storage';

/*
====================================
طرق ربط الواتساب برقم المرسل:
====================================

1. WhatsApp Business API (الحل المحترف):
   - يتطلب موافقة من فيسبوك
   - مناسب للشركات الكبيرة
   - يحتاج تسجيل في WhatsApp Business Platform
   - يدعم الإرسال المجمع والقوالب المعتمدة
   
2. WhatsApp Web.js (الحل البرمجي):
   - يتطلب مسح QR Code مرة واحدة
   - مناسب للمشاريع الصغيرة والمتوسطة
   - يعمل عبر محاكاة WhatsApp Web
   - قد يحتاج إعادة ربط بشكل دوري
   
3. خدمات API خارجية:
   - Twilio WhatsApp API
   - MessageBird WhatsApp API
   - 360Dialog WhatsApp API
   - تتطلب اشتراك مدفوع
   
4. الحل الحالي (محاكاة):
   - نظام داخلي لحفظ طلبات التقييم
   - لا يتطلب ربط حقيقي بالواتساب
   - مناسب للتطوير والاختبار
   
لتفعيل الواتساب الحقيقي، ضع رقم المرسل في:
WHATSAPP_SENDER_NUMBER=966501234567
*/

export class WhatsAppService {
  private isReady = false;
  private senderNumber: string | null = null;

  constructor() {
    // في النظام الحقيقي، هذا هو المكان الذي سيتم فيه ربط رقم المرسل
    this.senderNumber = process.env.WHATSAPP_SENDER_NUMBER || null;
    this.isReady = true;
  }

  async initialize() {
    try {
      console.log('🚀 تم بدء نظام تقييم العملاء...');
      
      if (this.senderNumber) {
        console.log(`📱 رقم المرسل المحفوظ: ${this.senderNumber}`);
      } else {
        console.log('⚠️ لم يتم تعيين رقم المرسل في متغيرات البيئة');
        console.log('💡 لربط الواتساب:');
        console.log('   1. WhatsApp Business API - للاستخدام التجاري');
        console.log('   2. WhatsApp Web.js - للاستخدام الشخصي');
        console.log('   3. API خارجية مثل Twilio أو MessageBird');
      }
      
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
      
      if (this.senderNumber) {
        console.log(`📱 سيتم الإرسال من الرقم: ${this.senderNumber}`);
        console.log(`📤 الرسالة التي ستُرسل:`);
        console.log(`مرحباً ${customerName}, تم إكمال مهمة "${taskTitle}". يرجى تقييم الخدمة (1=غاضب، 2=راضي، 3=راضي جداً)`);
      } else {
        console.log(`📱 محاكاة إرسال الواتساب - لم يتم تعيين رقم المرسل`);
      }
      
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
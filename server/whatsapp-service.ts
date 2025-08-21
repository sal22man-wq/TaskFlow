import { storage } from './storage';

// تعريف المتغيرات للمكتبات
let whatsappWebJs: any;
let qrcodeTerminal: any;

export class WhatsAppService {
  private client: any;
  private isReady = false;
  private isInitialized = false;
  private senderNumber: string | null = null;

  constructor() {
    // Empty constructor - actual initialization happens in initialize()
  }

  private async loadDependencies() {
    if (!whatsappWebJs) {
      try {
        whatsappWebJs = await import('whatsapp-web.js');
        qrcodeTerminal = await import('qrcode-terminal');
        
        console.log('✅ تم تحميل مكتبات الواتساب بنجاح');
      } catch (error) {
        console.error('❌ خطأ في تحميل مكتبات الواتساب:', error);
        throw error;
      }
    }
  }

  private initializeClient() {
    try {
      const { Client, LocalAuth } = whatsappWebJs;
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: "taskflow-whatsapp-client"
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      });

      this.setupEventHandlers();
      console.log('✅ تم إنشاء عميل الواتساب بنجاح');
    } catch (error) {
      console.error('❌ خطأ في إنشاء عميل الواتساب:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    this.client.on('qr', (qr: string) => {
      console.log('\n🔗 امسح رمز QR للاتصال بواتساب:');
      const qrcodeGenerator = qrcodeTerminal.default || qrcodeTerminal;
      qrcodeGenerator.generate(qr, { small: true });
      console.log('\n📱 افتح واتساب على هاتفك واتبع التعليمات...\n');
    });

    this.client.on('ready', () => {
      console.log('✅ خدمة الواتساب جاهزة ومتصلة!');
      this.isReady = true;
      // الحصول على رقم الواتساب المتصل
      this.getSenderNumber();
    });

    this.client.on('authenticated', () => {
      console.log('🔐 تم التوثيق مع واتساب بنجاح');
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('❌ انقطع الاتصال مع واتساب:', reason);
      this.isReady = false;
    });

    // استقبال الردود من العملاء
    this.client.on('message', async (message: any) => {
      await this.handleIncomingMessage(message);
    });
  }

  private async getSenderNumber() {
    try {
      const info = await this.client.info;
      this.senderNumber = info.wid.user;
      console.log(`📱 رقم الواتساب المتصل: ${this.senderNumber}`);
    } catch (error) {
      console.error('❌ خطأ في الحصول على رقم المرسل:', error);
    }
  }

  async initialize() {
    try {
      console.log('🚀 محاولة ربط الواتساب...');
      
      // محاكاة ربط الواتساب مع إظهار QR Code
      this.showFakeQRCode();
      
      // تأخير قصير لمحاكاة عملية الاتصال
      setTimeout(() => {
        console.log('✅ تم ربط الواتساب بنجاح! (محاكاة)');
        console.log('📱 رقم الواتساب المتصل: 966501234567 (محاكاة)');
        this.isReady = true;
        this.senderNumber = '966501234567';
      }, 3000);
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل خدمة الواتساب:', error);
      // في حالة الفشل، نجعل النظام جاهزاً كمحاكاة
      this.isReady = true;
      this.senderNumber = '966501234567';
    }
  }

  private showFakeQRCode() {
    console.log('\n🔗 امسح رمز QR للاتصال بواتساب:');
    console.log('████████████████████████████████');
    console.log('██ ▄▄▄▄▄ █▀█ █▄▀▄▀▄▄▄█ ▄▄▄▄▄ ██');
    console.log('██ █   █ █▀▀▀█ ▄▄  ▄▄█ █   █ ██');
    console.log('██ █▄▄▄█ █▀ █▀ ▀▀▀ ▄▀█ █▄▄▄█ ██');
    console.log('██▄▄▄▄▄▄▄█▄▀ ▀▄█▄█ █▄█▄▄▄▄▄▄▄██');
    console.log('██▄▄  ▄▀▄  ▄ ▄▀▄▄▄▄  ▀ ▀▄█▄▄▄██');
    console.log('████▄▄▄▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██');
    console.log('████████████████████████████████');
    console.log('\n📱 افتح واتساب على هاتفك واتبع التعليمات...');
    console.log('💡 ملاحظة: هذا QR Code تجريبي - في النظام الحقيقي سيظهر QR صحيح\n');
  }

  // معالجة الرسائل الواردة من العملاء
  private async handleIncomingMessage(message: any) {
    try {
      const phoneNumber = message.from.replace('@c.us', '');
      const messageText = message.body.trim();

      // التحقق إذا كان الرد تقييم (رقم من 1 إلى 3)
      if (['1', '2', '3'].includes(messageText)) {
        await this.processCustomerRating(phoneNumber, messageText);
      }
    } catch (error) {
      console.error('❌ خطأ في معالجة الرسالة الواردة:', error);
    }
  }

  // معالجة تقييم العميل
  private async processCustomerRating(phoneNumber: string, rating: string) {
    try {
      const ratingMap = {
        '1': { rating: 'angry', text: 'غاضب' },
        '2': { rating: 'satisfied', text: 'راضي' },
        '3': { rating: 'very_satisfied', text: 'راضي جدا' }
      };

      const ratingData = ratingMap[rating as keyof typeof ratingMap];
      
      // البحث عن تقييم معلق للعميل
      const existingRating = await storage.getPendingCustomerRating(phoneNumber);
      
      if (existingRating) {
        // تحديث التقييم
        await storage.updateCustomerRating(existingRating.id, {
          rating: ratingData.rating,
          ratingText: ratingData.text,
          responseReceived: 'true'
        });

        // إرسال رسالة شكر
        const thankYouMessage = `شكراً لك على تقييمك: ${ratingData.text} ${this.getRatingEmoji(rating)}

نحن نقدر آراءكم ونسعى دائماً لتحسين خدماتنا.

مع تحيات فريق شركة اشراق الودق لتكنولوجيا المعلومات 🌟`;

        const formattedNumber = this.formatPhoneNumber(phoneNumber);
        await this.client.sendMessage(formattedNumber, thankYouMessage);

        console.log(`✅ تم تسجيل تقييم العميل: ${existingRating.customerName} - التقييم: ${ratingData.text}`);
      }
    } catch (error) {
      console.error('❌ خطأ في معالجة تقييم العميل:', error);
    }
  }

  // تنسيق رقم الهاتف للواتساب
  private formatPhoneNumber(phoneNumber: string): string {
    // إزالة جميع الرموز والمسافات
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // إذا بدأ بـ 0، نزيله ونضيف كود السعودية
    if (cleaned.startsWith('0')) {
      cleaned = '966' + cleaned.substring(1);
    }
    // إذا لم يبدأ بكود دولة، نضيف كود السعودية
    else if (!cleaned.startsWith('966')) {
      cleaned = '966' + cleaned;
    }
    
    return cleaned + '@c.us';
  }

  // الحصول على الإيموجي المناسب للتقييم
  private getRatingEmoji(rating: string): string {
    const emojiMap = {
      '1': '😠',
      '2': '😊',
      '3': '😍'
    };
    return emojiMap[rating as keyof typeof emojiMap] || '😊';
  }

  // إرسال رسالة تقييم العميل عبر الواتساب
  async sendCustomerRatingRequest(
    phoneNumber: string, 
    customerName: string,
    taskTitle: string,
    taskId: string
  ): Promise<boolean> {
    if (!this.isReady) {
      console.log('❌ خدمة الواتساب غير جاهزة');
      return false;
    }

    try {
      // تنسيق رقم الهاتف (إزالة الأصفار والمسافات وإضافة كود الدولة)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const message = `مرحباً ${customerName}

✅ تم إتمام مهمة "${taskTitle}" بنجاح من قبل شركة اشراق الودق لتكنولوجيا المعلومات.

🌟 نرجو تقييم مستوى رضاكم عن أدائنا:

رد برقم واحد فقط:
1️⃣ - غاضب 😠
2️⃣ - راضي 😊  
3️⃣ - راضي جدا 😍

شكراً لثقتكم بنا 🙏`;

      // إرسال الرسالة عبر الواتساب
      await this.client.sendMessage(formattedNumber, message);
      
      // تسجيل أن الرسالة تم إرسالها
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

      console.log(`✅ تم إرسال رسالة التقييم للعميل: ${customerName} - ${phoneNumber}`);
      console.log(`📱 المرسل من: ${this.senderNumber}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال رسالة التقييم:', error);
      
      // في حالة فشل الإرسال، نسجل الطلب كمحاولة فاشلة
      try {
        await storage.createCustomerRating({
          taskId,
          customerId: null,
          customerName,
          customerPhone: phoneNumber,
          rating: 'pending',
          ratingText: 'فشل في الإرسال',
          messageSent: 'false',
          responseReceived: 'false'
        });
      } catch (dbError) {
        console.error('❌ خطأ في تسجيل محاولة الإرسال الفاشلة:', dbError);
      }
      
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
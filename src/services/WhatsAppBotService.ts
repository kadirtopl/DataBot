import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { Customer } from '../types/Customer';
import { ExcelService } from './ExcelService';
import { WhatsAppBot } from './WhatsAppBot';
import { DataService } from './DataService';
import * as path from 'path';
import * as process from 'process';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

export class WhatsAppBotService {
    private client: Client;
    private bot: WhatsAppBot;
    private excelService: ExcelService;
    private readonly EXCEL_PATH = path.join(__dirname, '../../tugce.xlsx');
    private lastSentIndex: number = 0;
    private customers: Customer[] = [];
    private isFirstMessage: boolean = true;
    private autoSendInterval: NodeJS.Timeout | null = null;
    private readonly AUTO_SEND_INTERVAL = 4 * 60 * 1000; // 4 dakika
    private totalSentCount: number = 0;
    private dailySentCount: number = 0;
    private readonly MAX_DAILY_MESSAGES = 40;
    private lastSentDate: Date = new Date();
    private isAutoSendActive: boolean = false;
    private lastAutoSendTime: number = 0;
    private readonly WORK_START_HOUR = 10; // 10:00
    private readonly WORK_END_HOUR = 19; // 19:00

    constructor() {
        this.bot = new WhatsAppBot();
        this.excelService = new ExcelService();
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox']
            }
        });

        DataService.loadSentCustomers();
        this.setupEventHandlers();
        this.findLastSentIndex();
        this.resetDailyCountIfNeeded();
    }

    private isWithinWorkingHours(): boolean {
        const now = new Date();
        const currentHour = now.getHours();
        return currentHour >= this.WORK_START_HOUR && currentHour < this.WORK_END_HOUR;
    }

    private getNextWorkingTime(): Date {
        const now = new Date();
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(this.WORK_START_HOUR, 0, 0, 0);
        return nextDay;
    }

    private setupEventHandlers() {
        // QR kod oluşturma
        this.client.on('qr', (qr) => {
            console.clear();
            console.log('\n📱 WhatsApp Web QR Kodu:');
            console.log('==========================================');
            qrcode.generate(qr, { small: true });
            console.log('==========================================');
            console.log('\n📱 Telefonunuzdan WhatsApp Web\'i açın ve QR kodu okutun.');
        });

        // Bağlantı hazır olduğunda
        this.client.on('ready', async () => {
            console.clear();
            console.log('\n==========================================');
            console.log('✅ WhatsApp Bot başarıyla bağlandı!');
            console.log('==========================================\n');

            try {
                this.customers = await ExcelService.readCustomersFromExcel(this.EXCEL_PATH);
                
                if (this.customers.length > 0) {
                    console.log('📋 Müşteri Listesi Yüklendi');
                    console.log('==========================================');
                    console.log(`📊 Toplam Müşteri: ${this.customers.length}`);
                    console.log(`📍 Kaldığımız Yer: ${this.lastSentIndex + 1}. müşteri`);
                    console.log('==========================================\n');

                    console.log('⌨️ Kontroller:');
                    console.log('==========================================');
                    console.log('• ENTER: Bir sonraki müşteriye mesaj gönder');
                    console.log('• CTRL+C: Programı sonlandır');
                    console.log('==========================================\n');

                    console.log('⚙️ Ayarlar:');
                    console.log('==========================================');
                    console.log('• Otomatik Gönderim: Her 4 dakikada bir');
                    console.log('• Çalışma Saatleri: 10:00 - 19:00');
                    console.log('• Günlük Limit: 40 mesaj');
                    console.log('==========================================\n');

                    console.log('▶️ Başlamak için ENTER tuşuna basın...\n');
                } else {
                    console.log('\n❌ Mesaj gönderilecek müşteri bulunamadı!');
                    process.exit(1);
                }

                // stdin'i raw moda al
                process.stdin.setRawMode(true);
                process.stdin.resume();

                // Her ENTER tuşuna basıldığında çalışacak
                process.stdin.on('data', async (key) => {
                    if (key[0] === 13) { // ENTER tuşu
                        await this.sendSingleMessage();
                    } else if (key[0] === 3) { // CTRL+C
                        console.log('\n==========================================');
                        console.log('❌ Program sonlandırılıyor...');
                        console.log('==========================================');
                        process.exit(0);
                    }
                });

            } catch (error) {
                console.error('❌ Excel okuma veya mesaj gönderme hatası:', error);
            }
        });

        // Mesaj alma
        this.client.on('message', async (message) => {
            const response = this.bot.processMessage(message.body);
            if (response) {
                await message.reply(response);
            }
        });

        // Bağlantı durumunu izle
        this.client.on('authenticated', () => {
            console.log('WhatsApp hesabı doğrulandı!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('Bağlantı hatası:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('Bağlantı kesildi:', reason);
        });
    }

    private resetDailyCountIfNeeded() {
        const now = new Date();
        const lastSentDay = this.lastSentDate.getDate();
        const currentDay = now.getDate();

        if (lastSentDay !== currentDay) {
            console.log('\nYeni gün başladı, günlük sayaç sıfırlanıyor...');
            this.dailySentCount = 0;
            this.lastSentDate = now;
        }
    }

    private async sendSingleMessage() {
        try {
            // Çalışma saatleri kontrolü
            if (!this.isWithinWorkingHours()) {
                const nextTime = this.getNextWorkingTime();
                console.log('\n==========================================');
                console.log('⚠️ Çalışma Saatleri Dışı');
                console.log('==========================================');
                console.log('• Şu an mesaj gönderilemiyor');
                console.log(`• Bir sonraki çalışma zamanı: ${nextTime.toLocaleString()}`);
                console.log('==========================================\n');
                return;
            }

            // Son işlem zamanını kontrol et
            const now = Date.now();
            if (this.isAutoSendActive && now - this.lastAutoSendTime < 30000) {
                console.log('\n==========================================');
                console.log('⚠️ Çok Hızlı İşlem');
                console.log('==========================================');
                console.log('• 30 saniye bekleniyor...');
                console.log('==========================================\n');
                return;
            }
            this.lastAutoSendTime = now;

            // Günlük limit kontrolü
            this.resetDailyCountIfNeeded();
            
            if (this.dailySentCount >= this.MAX_DAILY_MESSAGES) {
                console.log('\n==========================================');
                console.log('⚠️ Günlük Limit Doldu');
                console.log('==========================================');
                console.log('• Günlük mesaj limiti (40) doldu');
                console.log('• Yarın otomatik olarak devam edilecek');
                console.log('==========================================\n');
                return;
            }

            if (this.lastSentIndex >= this.customers.length - 1) {
                console.log('\n==========================================');
                console.log('✅ İşlem Tamamlandı');
                console.log('==========================================');
                console.log('• Tüm müşterilere mesaj gönderildi');
                console.log('==========================================\n');
                this.stopAutoSend();
                process.exit(0);
                return;
            }

            this.lastSentIndex++;
            const customer = this.customers[this.lastSentIndex];
            
            // Gürkan'ı atla
            if (customer.name.includes('Gürkan')) {
                console.log('\n==========================================');
                console.log('⏭️ Müşteri Atlanıyor');
                console.log('==========================================');
                console.log(`• İsim: ${customer.name}`);
                console.log(`• Sıra: ${this.lastSentIndex + 1}. müşteri`);
                console.log('==========================================\n');
                await this.sendSingleMessage();
                return;
            }

            // Daha önce gönderilmiş mi kontrol et
            if (DataService.isCustomerSent(customer)) {
                console.log('\n==========================================');
                console.log('⏭️ Daha Önce Gönderilmiş');
                console.log('==========================================');
                console.log(`• İsim: ${customer.name}`);
                console.log('• Bu müşteriye daha önce mesaj gönderilmiş');
                console.log('==========================================\n');
                await this.sendSingleMessage();
                return;
            }

            if (customer && customer.phone && customer.phone.length >= 10) {
                console.log('\n==========================================');
                console.log('📱 Mesaj Gönderiliyor');
                console.log('==========================================');
                console.log(`• Sıra: ${this.lastSentIndex + 1}/${this.customers.length}`);
                console.log(`• İsim: ${customer.name}`);
                console.log(`• Telefon: ${customer.phone}`);
                console.log(`• Tarih: ${customer.assignedAt}`);
                console.log('==========================================');

                const message = this.getCustomerMessage(customer);
                await this.sendMessage(customer.phone, message);
                
                // İndeksi güncelle ve kaydet
                DataService.updateLastSentIndex(this.lastSentIndex);
                DataService.markCustomerAsSent(customer);
                
                console.log('\n✅ Mesaj Gönderildi');
                console.log('==========================================');
                this.totalSentCount++;
                this.dailySentCount++;
                this.lastSentDate = new Date();
                
                console.log(`📊 İstatistikler:`);
                console.log(`• Bugün: ${this.dailySentCount}/${this.MAX_DAILY_MESSAGES}`);
                console.log(`• Toplam: ${this.totalSentCount}`);
                console.log('==========================================');
                
                if (this.dailySentCount >= this.MAX_DAILY_MESSAGES) {
                    console.log('\n⚠️ Günlük limit doldu! Yarın devam edilecek.');
                    return;
                }
                
                // Sonraki müşteri bilgilerini göster
                if (this.lastSentIndex + 1 < this.customers.length) {
                    const nextCustomer = this.customers[this.lastSentIndex + 1];
                    console.log('\n📋 Sıradaki Müşteri:');
                    console.log('==========================================');
                    console.log(`• İsim: ${nextCustomer.name}`);
                    console.log(`• Telefon: ${nextCustomer.phone}`);
                    console.log(`• Tarih: ${nextCustomer.assignedAt}`);
                    console.log('==========================================\n');
                }
                
                console.log('⌨️ ENTER: Sonraki mesaj | ⏱️ 4dk: Otomatik gönderim\n');

                // Otomatik gönderimi başlat
                if (!this.isAutoSendActive) {
                    console.log('🔄 Otomatik gönderim başlıyor (4dk)...\n');
                    this.startAutoSend();
                }
            }
        } catch (error) {
            console.error('\n==========================================');
            console.error('❌ Hata Oluştu');
            console.error('==========================================');
            console.error('• Mesaj gönderilemedi');
            console.error('• 30 saniye sonra tekrar denenecek');
            console.error('==========================================\n');
            setTimeout(() => this.sendSingleMessage(), 30000);
        }
    }

    private getCustomerMessage(customer: Customer): string {
        // İsim kontrolü
        const greeting = customer.name === 'İsim Bilinmiyor' ? 'Merhaba' : `Merhaba ${customer.name}`;

        return `${greeting} 👋

${customer.assignedAt} tarihli görüşmemizde, yeni projeleriniz için emlak danışmanlığı hizmetimizden faydalanmak istediğinizi belirtmiştiniz.

Size özel hazırladığımız fırsatları paylaşmak için buradayız. Nasıl yardımcı olabiliriz?

1️⃣ Yeni bir yer bakıyorum
2️⃣ Mülk satmak istiyorum
3️⃣ Uzmanımızla hemen görüşmek istiyorum
4️⃣ İstek, öneri veya şikayetim var

Çıkış yapmak için 'Çıkış' yazabilirsiniz.
Fikriniz değiştiğinde sadece 'Merhaba' diyerek tekrar başlayabilirsiniz!

💡 Geçtiğimiz ay 2000'den fazla müşterimize dokunduk, pek çok güzel sonuç aldık. Sizi de bu fırsatlarla buluşturmak için buradayız!`;
    }

    private async sendMessage(phone: string, message: string): Promise<void> {
        try {
            // Telefon numarasını temizle ve Türkiye formatına uygun hale getir
            let formattedPhone = phone.replace(/\D/g, ''); // Sadece rakamları al
            if (formattedPhone.startsWith('90')) {
                formattedPhone = formattedPhone.substring(2); // 90 önekini kaldır
            }
            if (formattedPhone.startsWith('0')) {
                formattedPhone = formattedPhone.substring(1); // Başındaki 0'ı kaldır
            }
            formattedPhone = `90${formattedPhone}`; // 90 önekini ekle
            
            const chatId = `${formattedPhone}@c.us`;
            await this.client.sendMessage(chatId, message);
            console.log(`${formattedPhone} numarasına mesaj gönderildi.`);
        } catch (error) {
            console.error(`Mesaj gönderme hatası (${phone}):`, error);
        }
    }

    public start() {
        console.log('WhatsApp Bot başlatılıyor...\n');
        this.client.initialize();
    }

    private findLastSentIndex(): void {
        try {
            // DataService'den son gönderilen indeksi al
            this.lastSentIndex = DataService.getLastSentIndex();
            console.log(`\n📊 Son kaldığı indeks: ${this.lastSentIndex}`);
        } catch (error) {
            console.error('Son indeks yüklenirken hata:', error);
            this.lastSentIndex = 0;
        }
    }

    private startAutoSend() {
        if (this.isAutoSendActive) return;
        
        this.isAutoSendActive = true;
        this.autoSendInterval = setInterval(async () => {
            if (this.isWithinWorkingHours()) {
                await this.sendSingleMessage();
            } else {
                console.log('\n==========================================');
                console.log('⏰ Çalışma Saatleri Dışı');
                console.log('==========================================');
                console.log('• Mesaj gönderimi durduruldu');
                console.log('• Çalışma saatleri başladığında devam edecek');
                console.log('==========================================\n');
                this.stopAutoSend();
            }
        }, this.AUTO_SEND_INTERVAL);
    }

    private stopAutoSend() {
        if (this.autoSendInterval) {
            clearInterval(this.autoSendInterval);
            this.autoSendInterval = null;
        }
        this.isAutoSendActive = false;
    }
} 
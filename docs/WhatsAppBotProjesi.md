# WhatsApp Bot Projesi - Detaylı Dokümantasyon

## İçindekiler
1. [Proje Hakkında](#proje-hakkında)
2. [Teknolojiler ve Gereksinimler](#teknolojiler-ve-gereksinimler)
3. [Proje Yapısı](#proje-yapısı)
4. [Kod Analizi](#kod-analizi)
5. [SOLID Prensipleri](#solid-prensipleri)
6. [Güvenlik ve Performans](#güvenlik-ve-performans)
7. [Geliştirme Önerileri](#geliştirme-önerileri)
8. [Örnek Kullanım](#örnek-kullanım)
9. [Hata Çözümleri](#hata-çözümleri)
10. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Proje Hakkında

Bu proje, Excel dosyasından müşteri verilerini okuyup, WhatsApp üzerinden otomatik mesaj gönderen bir bot uygulamasıdır. Projenin temel özellikleri:

- Excel'den müşteri verilerini okuma
- WhatsApp üzerinden otomatik mesaj gönderme
- Gönderilen mesajları takip etme
- Belirli aralıklarla toplu mesaj gönderme
- Önceki müşterilere tekrar mesaj göndermeme

### Kullanım Senaryoları

1. **Müşteri Takibi:**
   - Excel'deki müşteri listesini otomatik okuma
   - Her müşteriye kişiselleştirilmiş mesaj gönderme
   - Gönderilen mesajları kaydetme

2. **Toplu Mesaj Gönderme:**
   - İlk mesajı manuel gönderme
   - Sonrasında her saat başı 10'ar mesaj gönderme
   - Toplam 50 mesaj gönderildiğinde durma

3. **Veri Yönetimi:**
   - Gönderilen müşterileri JSON dosyasında saklama
   - Tekrar gönderimleri engelleme
   - Hata durumlarını loglama

## Teknolojiler ve Gereksinimler

### Kullanılan Teknolojiler

1. **TypeScript**
   - Versiyon: 4.x
   - Özellikler:
     - Tip güvenliği
     - Nesne yönelimli programlama
     - Modern JavaScript özellikleri

2. **Node.js**
   - Versiyon: 14.x veya üzeri
   - Özellikler:
     - Asenkron programlama
     - Event-driven mimari
     - NPM paket yönetimi

3. **whatsapp-web.js**
   - Versiyon: 1.x
   - Özellikler:
     - WhatsApp Web API entegrasyonu
     - QR kod ile otomatik bağlantı
     - Mesaj gönderme/alma

4. **xlsx**
   - Versiyon: 0.18.x
   - Özellikler:
     - Excel dosya okuma/yazma
     - JSON dönüşümü
     - Hücre formatlaması

### Gereksinimler

1. **Sistem Gereksinimleri:**
   ```bash
   - Node.js 14.x veya üzeri
   - NPM 6.x veya üzeri
   - TypeScript 4.x
   - Windows/Linux/MacOS
   ```

2. **Bağımlılıklar:**
   ```json
   {
     "dependencies": {
       "whatsapp-web.js": "^1.0.0",
       "xlsx": "^0.18.0",
       "qrcode-terminal": "^0.12.0"
     },
     "devDependencies": {
       "typescript": "^4.0.0",
       "ts-node": "^10.0.0"
     }
   }
   ```

## Proje Yapısı

```
📁 WhatsApp Bot Projesi
├── 📁 src/
│   ├── 📁 services/
│   │   ├── WhatsAppBotService.ts    # Ana bot servisi
│   │   ├── ExcelService.ts          # Excel işlemleri
│   │   └── DataService.ts           # Veri saklama
│   ├── 📁 types/
│   │   └── Customer.ts              # Müşteri tipi
│   └── index.ts                     # Giriş noktası
├── package.json                     # Bağımlılıklar
├── tsconfig.json                    # TypeScript ayarları
└── tugce.xlsx                       # Müşteri verileri
```

### Dosya Açıklamaları

1. **src/index.ts**
   ```typescript
   import { WhatsAppBotService } from './services/WhatsAppBotService';

   async function main() {
       try {
           console.log('WhatsApp Bot başlatılıyor...');
           const whatsappService = new WhatsAppBotService();
           await whatsappService.start();
       } catch (error) {
           console.error('Hata:', error);
       }
   }

   main();
   ```

2. **src/types/Customer.ts**
   ```typescript
   export interface Customer {
       name: string;
       phone: string;
       assignedAt: string;
   }
   ```

3. **src/services/ExcelService.ts**
   ```typescript
   export class ExcelService {
       public static async readCustomersFromExcel(filePath: string): Promise<Customer[]> {
           // Excel okuma işlemleri
       }
   }
   ```

4. **src/services/DataService.ts**
   ```typescript
   export class DataService {
       private static readonly SENT_CUSTOMERS_FILE = 'sent_customers.json';
       
       public static markCustomerAsSent(customer: Customer): void {
           // Müşteri kaydetme işlemleri
       }
   }
   ```

5. **src/services/WhatsAppBotService.ts**
   ```typescript
   export class WhatsAppBotService {
       private client: Client;
       private bot: WhatsAppBot;
       
       constructor() {
           // Servis başlatma
       }
       
       public start(): void {
           // Bot başlatma
       }
   }
   ```

## Kod Analizi

### 1. WhatsApp Bot Servisi

```typescript
export class WhatsAppBotService {
    private client: Client;
    private bot: WhatsAppBot;
    private excelService: ExcelService;
    private readonly EXCEL_PATH: string;
    private lastSentIndex: number = -1;
    private customers: Customer[] = [];
    private isFirstMessage: boolean = true;
    private autoSendInterval: NodeJS.Timeout | null = null;
    private readonly AUTO_SEND_INTERVAL = 60 * 60 * 1000; // 1 saat
    private totalSentCount: number = 0;
    private readonly MAX_TOTAL_MESSAGES = 50;

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
    }
}
```

### 2. Excel Servisi

```typescript
export class ExcelService {
    public static async readCustomersFromExcel(filePath: string): Promise<Customer[]> {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
            const customers: Customer[] = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i] as any;
                if (!row) continue;
                
                let phone = row['F'] || '';
                phone = phone.toString().replace(/\D/g, '');
                
                const name = row['E'] || '';
                let date = row['A'] || '';
                
                if (phone && phone.length >= 10) {
                    customers.push({
                        name: name,
                        phone: phone,
                        assignedAt: date || 'Tarih belirtilmemiş'
                    });
                }
            }
            
            return customers;
        } catch (error) {
            console.error('Excel okuma hatası:', error);
            return [];
        }
    }
}
```

### 3. Veri Servisi

```typescript
export class DataService {
    private static readonly SENT_CUSTOMERS_FILE = 'sent_customers.json';
    private static sentCustomers: Set<string> = new Set();

    public static loadSentCustomers(): void {
        try {
            if (fs.existsSync(this.SENT_CUSTOMERS_FILE)) {
                const data = fs.readFileSync(this.SENT_CUSTOMERS_FILE, 'utf8');
                const customers = JSON.parse(data);
                this.sentCustomers = new Set(customers);
            }
        } catch (error) {
            console.error('Gönderilen müşteriler yüklenirken hata:', error);
        }
    }

    public static markCustomerAsSent(customer: Customer): void {
        try {
            this.sentCustomers.add(customer.phone);
            const customersArray = Array.from(this.sentCustomers);
            fs.writeFileSync(this.SENT_CUSTOMERS_FILE, JSON.stringify(customersArray, null, 2));
        } catch (error) {
            console.error('Müşteri kaydedilirken hata:', error);
        }
    }
}
```

## SOLID Prensipleri

### 1. Single Responsibility Principle (SRP)

Her sınıf tek bir sorumluluğa sahiptir:

```typescript
// WhatsAppBotService - Sadece WhatsApp işlemleri
export class WhatsAppBotService {
    private client: Client;
    // ...
}

// ExcelService - Sadece Excel işlemleri
export class ExcelService {
    public static async readCustomersFromExcel(filePath: string): Promise<Customer[]> {
        // ...
    }
}

// DataService - Sadece veri saklama işlemleri
export class DataService {
    public static markCustomerAsSent(customer: Customer): void {
        // ...
    }
}
```

### 2. Open/Closed Principle (OCP)

Kod genişletilebilir ama değiştirilemez:

```typescript
// Mesaj formatı değiştirilebilir ama mevcut kod değişmez
private getCustomerMessage(customer: Customer): string {
    return `Merhaba ${customer.name} 👋
    // ...
    `;
}
```

### 3. Interface Segregation Principle (ISP)

Müşteri tipi sadece gerekli özellikleri içerir:

```typescript
export interface Customer {
    name: string;
    phone: string;
    assignedAt: string;
}
```

### 4. Dependency Inversion Principle (DIP)

Servisler birbirine gevşek bağlı:

```typescript
export class WhatsAppBotService {
    private excelService: ExcelService;
    private dataService: DataService;

    constructor() {
        this.excelService = new ExcelService();
        this.dataService = new DataService();
    }
}
```

## Güvenlik ve Performans

### 1. Telefon Numarası Formatlama

```typescript
private async sendMessage(phone: string, message: string): Promise<void> {
    try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('90')) {
            formattedPhone = formattedPhone.substring(2);
        }
        if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
        }
        formattedPhone = `90${formattedPhone}`;
        
        const chatId = `${formattedPhone}@c.us`;
        await this.client.sendMessage(chatId, message);
    } catch (error) {
        console.error(`Mesaj gönderme hatası (${phone}):`, error);
    }
}
```

### 2. Hata Yönetimi

```typescript
try {
    // İşlemler
} catch (error) {
    console.error('Hata:', error);
    // Hata durumunda yapılacaklar
}
```

### 3. Performans Optimizasyonları

1. **Veri Önbellekleme:**
   ```typescript
   private customers: Customer[] = [];
   
   public async loadCustomers(): Promise<void> {
       if (this.customers.length === 0) {
           this.customers = await ExcelService.readCustomersFromExcel(this.EXCEL_PATH);
       }
   }
   ```

2. **Batch İşlemler:**
   ```typescript
   private async sendBatchMessages() {
       const BATCH_SIZE = 10;
       let sentCount = 0;
       
       while (sentCount < BATCH_SIZE) {
           // Mesaj gönderme işlemleri
       }
   }
   ```

## Geliştirme Önerileri

### 1. Özellik Ekleme

```typescript
// Mesaj şablonları yönetimi
interface MessageTemplate {
    id: string;
    content: string;
    variables: string[];
}

class MessageTemplateService {
    private templates: MessageTemplate[] = [];
    
    public addTemplate(template: MessageTemplate): void {
        this.templates.push(template);
    }
    
    public getTemplate(id: string): MessageTemplate | undefined {
        return this.templates.find(t => t.id === id);
    }
}
```

### 2. Raporlama Sistemi

```typescript
interface Report {
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
    startTime: Date;
    endTime: Date;
}

class ReportingService {
    public generateReport(): Report {
        // Rapor oluşturma
    }
}
```

### 3. Web Arayüzü

```typescript
// Express.js ile web arayüzü
import express from 'express';

const app = express();
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        messagesSent: totalSentCount,
        nextBatch: nextBatchTime
    });
});
```

## Örnek Kullanım

### 1. Projeyi Başlatma

```bash
# Bağımlılıkları yükle
npm install

# Projeyi derle
npm run build

# Projeyi başlat
npm start
```

### 2. Excel Dosyası Formatı

```
A sütunu: Tarih
E sütunu: İsim
F sütunu: Telefon
```

### 3. Mesaj Gönderme Akışı

1. Bot başlatılır
2. QR kod okutulur
3. İlk mesaj gönderilir
4. Her saat başı 10'ar mesaj gönderilir
5. Toplam 50 mesaj gönderildiğinde durur

## Hata Çözümleri

### 1. WhatsApp Bağlantı Sorunları

```typescript
// Bağlantı durumunu kontrol et
this.client.on('auth_failure', (msg) => {
    console.error('Bağlantı hatası:', msg);
    // Yeniden bağlanmayı dene
    this.client.initialize();
});
```

### 2. Excel Okuma Hataları

```typescript
try {
    const workbook = XLSX.readFile(filePath);
} catch (error) {
    console.error('Excel dosyası okunamadı:', error);
    // Alternatif dosya yolu dene
    const altPath = path.join(__dirname, '../backup.xlsx');
}
```

### 3. Mesaj Gönderme Hataları

```typescript
try {
    await this.sendMessage(phone, message);
} catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    // Hatalı mesajı logla
    this.logFailedMessage(phone, error);
}
```

## Sık Sorulan Sorular

### 1. WhatsApp bağlantısı nasıl kurulur?
- Bot başlatıldığında QR kod oluşturulur
- WhatsApp Web'de QR kodu okutun
- Otomatik bağlantı kurulur

### 2. Excel dosyası nasıl hazırlanmalı?
- A sütunu: Tarih
- E sütunu: İsim
- F sütunu: Telefon
- İlk satır başlık olmalı

### 3. Mesaj gönderme sıklığı nasıl ayarlanır?
```typescript
private readonly AUTO_SEND_INTERVAL = 60 * 60 * 1000; // 1 saat
private readonly MAX_TOTAL_MESSAGES = 50; // Toplam mesaj
```

### 4. Hatalı mesajlar nasıl takip edilir?
- Hatalar console'a yazdırılır
- JSON dosyasında kaydedilir
- Tekrar deneme mekanizması vardır

### 5. Proje nasıl genişletilebilir?
- Yeni mesaj şablonları eklenebilir
- Farklı veri kaynakları entegre edilebilir
- Web arayüzü eklenebilir
- Raporlama sistemi geliştirilebilir 
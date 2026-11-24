import * as fs from 'fs';
import * as path from 'path';
import { Customer } from '../types/Customer';

export class DataService {
    private static readonly SENT_CUSTOMERS_FILE = path.join(__dirname, '../../sent_customers.json');
    private static sentCustomers: Set<string> = new Set();
    private static lastSentIndex: number = 0;

    // Gönderilen müşterileri yükle
    public static loadSentCustomers(): void {
        try {
            if (fs.existsSync(this.SENT_CUSTOMERS_FILE)) {
                const data = fs.readFileSync(this.SENT_CUSTOMERS_FILE, 'utf8');
                const jsonData = JSON.parse(data);
                this.sentCustomers = new Set(jsonData.sentCustomers || []);
                this.lastSentIndex = jsonData.lastSentIndex || 0;
                console.log(`Daha önce gönderilen ${this.sentCustomers.size} müşteri yüklendi.`);
            }
        } catch (error) {
            console.error('Gönderilen müşteriler yüklenirken hata:', error);
            // Hata durumunda varsayılan değerleri kullan
            this.sentCustomers = new Set();
            this.lastSentIndex = 0;
        }
    }

    // Son gönderilen indeksi al
    public static getLastSentIndex(): number {
        return this.lastSentIndex;
    }

    // Müşteri gönderildi olarak işaretle
    public static markCustomerAsSent(customer: Customer): void {
        try {
            this.sentCustomers.add(customer.phone);
            const data = {
                sentCustomers: Array.from(this.sentCustomers),
                lastSentIndex: this.lastSentIndex
            };
            fs.writeFileSync(this.SENT_CUSTOMERS_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Müşteri kaydedilirken hata:', error);
        }
    }

    // Müşteri daha önce gönderilmiş mi kontrol et
    public static isCustomerSent(customer: Customer): boolean {
        return this.sentCustomers.has(customer.phone);
    }

    // Son gönderilen indeksi güncelle
    public static updateLastSentIndex(index: number): void {
        this.lastSentIndex = index;
        this.saveData();
    }

    // Verileri kaydet
    private static saveData(): void {
        try {
            const data = {
                sentCustomers: Array.from(this.sentCustomers),
                lastSentIndex: this.lastSentIndex
            };
            fs.writeFileSync(this.SENT_CUSTOMERS_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Veriler kaydedilirken hata:', error);
        }
    }
} 
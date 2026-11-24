import * as XLSX from 'xlsx';
import { Customer } from '../types/Customer';

export class ExcelService {
    // Excel dosyasından müşteri verilerini okur
    public static async readCustomersFromExcel(filePath: string): Promise<Customer[]> {
        try {
            console.log('Excel dosyası okunuyor:', filePath);
            
            // Excel dosyasını okur
            const workbook = XLSX.readFile(filePath);
            
            // "Ocak-2025" sayfasını bul
            const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('mart-2025(1-25)')) || workbook.SheetNames[0];
            console.log('Seçilen sayfa:', sheetName);
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Excel verilerini JSON'a dönüştürür
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
            
            // Müşteri listesini oluşturur
            const customers: Customer[] = [];
            
            // Her satırı işle
            for (let i = 1; i < data.length; i++) {
                const row = data[i] as any;
                if (!row) continue;
                
                // Tarih kontrolü (A sütunu)
                let excelDate = row['A'];
                let formattedDate = 'Tarih belirtilmemiş';

                if (excelDate && typeof excelDate === 'number') {
                    // Excel'in başlangıç tarihi (1899-12-30)
                    const baseDate = new Date(1899, 11, 30);
                    const jsDate = new Date(baseDate.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
                    formattedDate = jsDate.toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }

                // İletişim ismi kontrolü (E sütunu)
                let name = row['E'] || '';
                name = name.toString().trim();
                
                if (!name || name.toLowerCase() === 'null' || name.toLowerCase() === 'undefined' || name === '-') {
                    name = 'İsim Bilinmiyor';
                }

                // Telefon numarası kontrolü (F sütunu)
                let phone = row['F'] || '';
                phone = phone.toString().replace(/\D/g, ''); // Sadece rakamları al
                
                // Telefon numarası formatını düzelt
                if (phone.startsWith('90')) {
                    phone = phone.substring(2);
                }
                if (phone.startsWith('0')) {
                    phone = phone.substring(1);
                }
                if (phone.length >= 10) {
                    phone = `90${phone}`;
                    
                    // Müşteriyi listeye ekle
                    customers.push({
                        name: name,
                        phone: phone,
                        assignedAt: formattedDate
                    });
                }
            }
            
            console.log(`\n📊 Ocak 2025 müşteri sayısı: ${customers.length}`);
            return customers;
            
        } catch (error) {
            console.error('Excel okuma hatası:', error);
            return [];
        }
    }

    // Müşteri durumunu günceller
    public static async updateCustomerStatus(filePath: string, phone: string, newStatus: string): Promise<void> {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Excel verilerini JSON'a dönüştürür
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
            
            // Müşteriyi bul ve durumunu güncelle
            for (let i = 1; i < data.length; i++) {
                const row = data[i] as any;
                if (!row) continue;
                
                const rowPhone = (row['F'] || '').toString().replace(/\D/g, '');
                if (rowPhone === phone) {
                    row['G'] = newStatus; // G sütununa durumu yaz
                    break;
                }
            }
            
            // Yeni bir çalışma sayfası oluştur
            const newWorksheet = XLSX.utils.json_to_sheet(data);
            
            // Excel dosyasını güncelle
            workbook.Sheets[sheetName] = newWorksheet;
            XLSX.writeFile(workbook, filePath);
            
            console.log(`${phone} numaralı müşterinin durumu güncellendi: ${newStatus}`);
        } catch (error) {
            console.error('Excel güncelleme hatası:', error);
        }
    }
} 
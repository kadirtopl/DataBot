import { WhatsAppBotService } from './services/WhatsAppBotService';

// Terminal boyutunu ayarla
process.stdout.write('\x1B[8;50;120t');

// Uygulamayı başlat
async function main() {
	try {
		console.clear();
		console.log('WhatsApp Bot başlatılıyor...');
		
		// WhatsApp Bot servisini başlat
		const whatsappService = new WhatsAppBotService();
		await whatsappService.start();

	} catch (error) {
		console.error('Hata:', error);
	}
}

main();
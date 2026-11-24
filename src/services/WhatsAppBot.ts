export class WhatsAppBot {
    private tarih: string;
    private oncekiTalep: string;
    private random: any;
    private currentFlow: string | null;
    private userInputs: { [key: string]: string };

    constructor() {
        this.tarih = new Date().toLocaleDateString('tr-TR');
        this.oncekiTalep = '';
        this.random = Math.random();
        this.currentFlow = null;
        this.userInputs = {};
    }

    public processMessage(userInput: string): string {
        userInput = userInput.toLowerCase();

        // Belirli kelimeleri algıla
        if (userInput.includes('merhaba') || userInput.includes('selam') || userInput.includes('merhabalar') || userInput.includes('selamlar')) {
            this.currentFlow = null;
            this.userInputs = {};
            return this.HandleInitialMessage();
        }

        // Müşteri seçim yaptıysa ilgili akışa yönlendir
        if (userInput === '1' || userInput === '2' || userInput === '3' || userInput === '4') {
            this.currentFlow = userInput;
            this.userInputs = {}; // Yeni akış için girdileri temizle
            switch (userInput) {
                case '1':
                    return this.handleBuyingFlow();
                case '2':
                    return this.handleSellingFlow();
                case '3':
                    return this.handleExpertRequest();
                case '4':
                    return this.handleFeedbackFlow();
            }
        }

        // Eğer bir akış içindeysek ve müşteri yanıt verdiysse
        if (this.currentFlow) {
            // Kullanıcı girdilerini kaydet
            if (!this.userInputs['bölge']) {
                this.userInputs['bölge'] = userInput;
                if (this.currentFlow === '1') {
                    return this.handleBudgetInquiry();
                } else if (this.currentFlow === '2') {
                    return this.handleSellingResponse();
                } else if (this.currentFlow === '3') {
                    return this.handleExpertResponse();
                } else if (this.currentFlow === '4') {
                    return this.handleFeedbackResponse(userInput);
                }
            } else if (!this.userInputs['bütçe'] && this.currentFlow === '1') {
                this.userInputs['bütçe'] = userInput;
                return this.handleBuyingResponse();
            }
        }

        if (userInput.includes('canlı') || userInput.includes('destek') || userInput.includes('uzman'))
            return this.handleLiveSupportResponse();

        if (userInput.includes('çık') || userInput.includes('çıkış') || userInput.includes('çıkıyorum') || userInput.includes('iptal') || userInput.includes('bitir') || userInput.includes('tamam'))
            return this.handleExitResponse();

        // Diğer durumlarda sessiz kal
        return '';
    }

    public HandleInitialMessage(): string {
        return `Merhaba Değerli Müşterimiz 👋
Türkiye'nin en profesyonel emlak firması olarak, 100'den fazla uzman danışmanımız ve 600'den fazla güncel ilanımızla sizlere hizmet vermekten mutluluk duyuyoruz.

Nasıl yardımcı olabileceğimizi belirtir misiniz?

1️⃣ Yeni bir yer bakıyorum
2️⃣ Mülk satmak istiyorum
3️⃣ Uzmanımızla hemen görüşmek istiyorum
4️⃣ İstek, öneri veya şikayetim var

Çıkış yapmak için 'Çıkış' yazabilirsiniz.
Fikriniz değiştiğinde sadece 'Merhaba' diyerek tekrar başlayabilirsiniz!

💡 Geçtiğimiz ay 2000'den fazla müşterimize dokunduk, pek çok güzel sonuç aldık. Sizi de bu fırsatlarla buluşturmak için buradayız!`;
    }

    private handleBuyingFlow(): string {
        return `Harika bir karar verdiniz! 🏡
Doğru yerdesiniz. Remax Dream olarak teknolojik altyapımız ve uzman saha ekibimizle sizin için en uygun fırsatları hızla buluyoruz.

📍 Hangi bölgelere bakıyorsunuz?

💡 Çıkış yapmak için 'Çıkış' yazabilirsiniz.`;
    }

    private handleSellingFlow(): string {
        return `Çok doğru bir adım attınız! 👏
Remax Dream olarak sıradan bir ilan vermekten çok daha fazlasını yapıyoruz.

🛰️ Drone çekimleri
📸 Profesyonel fotoğraf & video
📲 Facebook, Instagram, Sahibinden gibi platformlarda reklam

Mülkünüz binlerce potansiyel alıcıya ulaşıyor!

📍 Mülkünüz hangi bölgede?

💡 Çıkış yapmak için 'Çıkış' yazabilirsiniz.`;
    }

    private handleExpertRequest(): string {
        return `Harika! ☎️ Sizi hemen en profesyonel danışmanımıza yönlendiriyoruz.

Sorularınızı yanıtlamak ve süreci hızlandırmak için buradayız!

Unutmayın: Remax'ta işler hızlı işler! 🚀

💡 Çıkış yapmak için 'Çıkış' yazabilirsiniz.`;
    }

    private handleFeedbackFlow(): string {
        return `Sizi dikkatle dinliyoruz! 🙌
Lütfen önerinizi, isteğinizi veya şikayetinizi yazın. Not edeceğiz ve gereken işlemleri başlatacağız.

💡 Çıkış yapmak için 'Çıkış' yazabilirsiniz.`;
    }

    private handleBuyingResponse(): string {
        this.currentFlow = null;
        return `✅ Not aldım! 🙌

Bilgileriniz için teşekkür ederiz. Uzman ekibimiz en kısa sürede size uygun seçeneklerle iletişime geçecek.

📍 Bölge: ${this.userInputs['bölge']}
💰 Bütçe: ${this.userInputs['bütçe']}

Remax Dream hız timi! 🚀

İyi günler dileriz! 😊

💡 İstediğiniz zaman 'Merhaba' diyerek yeniden başlayabilirsiniz!`;
    }

    private handleSellingResponse(): string {
        this.currentFlow = null;
        return `✅ Not aldım! 🙌

Bilgileriniz için teşekkür ederiz. Uzman ekibimiz en kısa sürede mülkünüzü değerlendirip size dönüş yapacak.

📍 Bölge: ${this.userInputs['bölge']}

Remax Dream hız timi! 🚀

İyi günler dileriz! 😊

💡 İstediğiniz zaman 'Merhaba' diyerek yeniden başlayabilirsiniz!`;
    }

    private handleExpertResponse(): string {
        this.currentFlow = null;
        return `✅ Not aldım! 🙌

Uzman ekibimiz en kısa sürede sizinle iletişime geçecek.

Remax Dream hız timi! 🚀

İyi günler dileriz! 😊

💡 İstediğiniz zaman 'Merhaba' diyerek yeniden başlayabilirsiniz!`;
    }

    private handleFeedbackResponse(input: string): string {
        this.currentFlow = null;
        return `✅ Not aldım! 🙌

Geri bildiriminiz için teşekkür ederiz. Uzman ekibimiz en kısa sürede değerlendirip size dönüş yapacak.

Remax Dream hız timi! 🚀

İyi günler dileriz! 😊

💡 İstediğiniz zaman 'Merhaba' diyerek yeniden başlayabilirsiniz!`;
    }

    private handleBudgetInquiry(): string {
        return `💰 Yaklaşık bütçeniz nedir?

💡 Çıkış yapmak için 'Çıkış' yazabilirsiniz.`;
    }

    private handleLocationInquiry(): string {
        return `📍 Hangi bölgelere bakıyorsunuz?

💡 Çıkış yapmak için 'Çıkış' yazabilirsiniz.`;
    }

    private handleLiveSupportResponse(): string {
        return `✅ Şu anda sizi canlı destek hattımıza yönlendiriyoruz!

Remax Dream hız timi burada! 🚀 Anında yanıt almak için harika bir adım attınız.

Uzman ekibimiz birazdan sizinle bire bir ilgilenecek. 🙌`;
    }

    private handleExitResponse(): string {
        return `Teşekkür ederiz! 😊
İstediğiniz zaman 'Merhaba' yazarak yeniden başlayabilirsiniz.

Remax'ta işler hızlı işler! 🚀`;
    }
} 
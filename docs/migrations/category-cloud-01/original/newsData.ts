import { NewsDetail, NewsItem, NewsType } from "@/types/newsTypes";

export const generateMockNews = (): NewsType[] => {
  const today = new Date();

  return [
    {
      id: "1",
      title: "Türkiye'nin Yeşil Şehir Dönüşümü: 2025 Hedefleri Açıklandı",
      excerpt: "Çevre ve Şehircilik Bakanlığı, 2025 yılına kadar 10 büyükşehirde yeşil alan oranını %40'a çıkarmayı hedefleyen kapsamlı planını açıkladı. Yeni düzenleme ile kentsel dönüşüm projelerinde yeşil alan zorunluluğu getiriliyor.",
      category: "Sürdürülebilirlik",
      author: "Ayşe Yılmaz",
      date: new Date(today.getTime() - 0 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 8,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200",
      featured: true,
      views: 2453
    },
    {
      id: "2",
      title: "Akıllı Şehir Teknolojileri Konferansı Başarıyla Tamamlandı",
      excerpt: "İstanbul'da düzenlenen konferans, 50'den fazla ülkeden 2000'i aşkın katılımcıyı bir araya getirdi. Yapay zeka destekli trafik yönetimi ve enerji optimizasyonu öne çıkan konular arasında yer aldı.",
      category: "Etkinlik",
      author: "Mehmet Kaya",
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 5,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      views: 1876
    },
    {
      id: "3",
      title: "Deprem Dirençli Yapı Standartları Güncellendi",
      excerpt: "Yeni yönetmelik ile tüm yeni yapılarda zorunlu deprem yalıtım sistemi şartı getirildi. Mevcut binalar için güçlendirme teşvikleri de açıklandı.",
      category: "Kentsel Dönüşüm",
      author: "Prof. Dr. Ali Demir",
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 12,
      image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800",
      views: 3421
    },
    {
      id: "4",
      title: "Elektrikli Toplu Taşıma Filosu Genişliyor",
      excerpt: "2025 sonuna kadar tüm büyükşehir belediyelerinde elektrikli otobüs oranı %60'a yükselecek. Yeni şarj istasyonları için altyapı yatırımları hız kazandı.",
      category: "Teknoloji",
      author: "Zeynep Öztürk",
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 6,
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800",
      views: 987
    },
    {
      id: "5",
      title: "Kentsel Dönüşüm Başvuru Süreci Dijitalleşiyor",
      excerpt: "E-devlet üzerinden başlatılacak yeni sistem ile kentsel dönüşüm başvuruları 3 günde sonuçlanacak. Pilot uygulama İstanbul'da başladı.",
      category: "Duyuru",
      author: "Burak Şahin",
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 4,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      views: 2134
    },
    {
      id: "6",
      title: "Uluslararası Şehir Planlama Ödülü Türkiye'ye",
      excerpt: "Ankara Büyükşehir Belediyesi'nin 'Yeşil Koridor' projesi, Avrupa Şehir Planlama Ödülü'nü kazandı. Proje, 50 km'lik kesintisiz yeşil alan oluşturuyor.",
      category: "Araştırma",
      author: "Dr. Selin Arslan",
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 7,
      image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
      views: 1543
    },
    {
      id: "7",
      title: "Yeni Nesil Akıllı Binalar: Enerji Tüketimi %70 Düşüyor",
      excerpt: "IoT sensörleri ve yapay zeka algoritmaları kullanan yeni nesil akıllı bina sistemleri, enerji maliyetlerini radikal şekilde azaltıyor.",
      category: "Teknoloji",
      author: "Can Yıldırım",
      date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 9,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      views: 2876
    },
    {
      id: "8",
      title: "Tarihi Yapıların Restorasyonunda Yeni Dönem",
      excerpt: "Kültür Bakanlığı, tarihi yapıların restorasyonunda 3D tarama ve dijital ikiz teknolojilerinin kullanımını zorunlu kıldı.",
      category: "Kentsel Dönüşüm",
      author: "Elif Demirbaş",
      date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 6,
      image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800",
      views: 1234
    },
    {
      id: "9",
      title: "Sürdürülebilir Ulaşım Zirvesi 2025 Tarihleri Belli Oldu",
      excerpt: "Mart ayında İzmir'de gerçekleşecek zirve, dünya genelinden 100'den fazla konuşmacıyı ağırlayacak.",
      category: "Etkinlik",
      author: "Deniz Aydın",
      date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 3,
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
      views: 876
    },
    {
      id: "10",
      title: "Kentsel Isı Adası Etkisine Karşı Yeni Stratejiler",
      excerpt: "Araştırmacılar, büyükşehirlerdeki sıcaklık artışını önlemek için yeşil çatı ve soğutucu kaplama çözümlerini test ediyor.",
      category: "Araştırma",
      author: "Prof. Dr. Hakan Öz",
      date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 11,
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800",
      views: 1654
    },
    {
      id: "11",
      title: "Yürünebilir Şehirler İçin Yeni Kılavuz Yayınlandı",
      excerpt: "Derneğimiz, belediyeler için hazırladığı kapsamlı yaya dostu şehir tasarım kılavuzunu kamuoyuyla paylaştı.",
      category: "Duyuru",
      author: "TKB Editör",
      date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 5,
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800",
      views: 2345
    },
    {
      id: "12",
      title: "Bisiklet Altyapısı Yatırımları Hız Kazanıyor",
      excerpt: "81 ilde toplam 5.000 km bisiklet yolu hedefiyle başlatılan proje kapsamında ilk etap tamamlandı.",
      category: "Sürdürülebilirlik",
      author: "Murat Çelik",
      date: new Date(today.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: 4,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      views: 1123
    }
  ];
};



export const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Türkiye'nin Yeşil Şehir Dönüşümü: 2025 Hedefleri",
    category: "Sürdürülebilirlik",
    date: new Date().toISOString(),
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
  },
  {
    id: "2",
    title: "Akıllı Şehir Teknolojileri Konferansı Tamamlandı",
    category: "Etkinlik",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
  },
  {
    id: "3",
    title: "Deprem Dirençli Yapı Standartları Güncellendi",
    category: "Kentsel Dönüşüm",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400",
  },
];

export const categories = ["Tümü", "Kentsel Dönüşüm", "Sürdürülebilirlik", "Teknoloji", "Etkinlik", "Duyuru", "Araştırma"];



export const mockNewsDetails: Record<string, NewsDetail> = {
  "1": {
    id: "1",
    title: "Türkiye'nin Yeşil Şehir Dönüşümü: 2025 Hedefleri Açıklandı",
    excerpt: "Çevre ve Şehircilik Bakanlığı, 2025 yılına kadar 10 büyükşehirde yeşil alan oranını %40'a çıkarmayı hedefleyen kapsamlı planını açıkladı.",
    content: `
## Yeşil Şehir Vizyonu

Çevre ve Şehircilik Bakanlığı, Türkiye'nin en kapsamlı yeşil şehir dönüşüm programını başlattı. Program kapsamında 2025 yılına kadar 10 büyükşehirde yeşil alan oranının %40'a çıkarılması hedefleniyor.

### Programın Ana Başlıkları

**1. Kentsel Yeşil Alan Artışı**
Tüm yeni yapı projelerinde minimum %30 yeşil alan zorunluluğu getirildi. Mevcut yapılarda ise çatı bahçesi ve dikey bahçe teşvikleri uygulanacak.

**2. Karbon Nötr Mahalleler**
İstanbul, Ankara ve İzmir'de pilot "sıfır karbon mahalle" projeleri başlatılacak. Bu mahalleler yenilenebilir enerji, sürdürülebilir ulaşım ve yeşil altyapı ile donatılacak.

**3. Kentsel Orman Koridorları**
Şehir içi ulaşımı yeşil koridorlarla bağlayan "Urban Forest Network" projesi hayata geçirilecek. Bu koridor sistemleri hem biyoçeşitliliği destekleyecek hem de şehirlerin ısı adası etkisini azaltacak.

### Finansman ve Teşvikler

Program için toplam 50 milyar TL'lik bütçe ayrıldı. Özel sektör yatırımları için çeşitli vergi indirimleri ve düşük faizli kredi imkanları sunulacak.

> "Bu program, Türkiye'nin sürdürülebilir şehircilik alanında dünya liderleri arasına girmesini sağlayacak." - Çevre ve Şehircilik Bakanı

### Uygulama Takvimi

- **2024 Q1:** Pilot projelerin başlatılması
- **2024 Q3:** İlk yeşil koridor açılışları
- **2025 Q2:** 10 büyükşehirde tam uygulama
- **2026:** Program değerlendirmesi ve ikinci faz planlaması

Bu tarihi adım, Türkiye'nin Paris İklim Anlaşması taahhütlerini yerine getirmesinde önemli bir rol oynayacak.
    `,
    category: "Sürdürülebilirlik",
    author: "Ayşe Yılmaz",
    date: new Date().toISOString(),
    readTime: 8,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200",
    featured: true,
    views: 2453,
    tags: ["Yeşil Şehir", "Sürdürülebilirlik", "Çevre", "2025 Hedefleri"]
  }
};

// Related news
export const relatedNews: NewsType[] = [
  {
    id: "6",
    title: "Uluslararası Şehir Planlama Ödülü Türkiye'ye",
    excerpt: "Ankara Büyükşehir Belediyesi'nin 'Yeşil Koridor' projesi ödül kazandı.",
    category: "Araştırma",
    author: "Dr. Selin Arslan",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 7,
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800"
  },
  {
    id: "12",
    title: "Bisiklet Altyapısı Yatırımları Hız Kazanıyor",
    excerpt: "81 ilde toplam 5.000 km bisiklet yolu hedefi.",
    category: "Sürdürülebilirlik",
    author: "Murat Çelik",
    date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
  },
  {
    id: "10",
    title: "Kentsel Isı Adası Etkisine Karşı Yeni Stratejiler",
    excerpt: "Yeşil çatı ve soğutucu kaplama çözümleri test ediliyor.",
    category: "Araştırma",
    author: "Prof. Dr. Hakan Öz",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 11,
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800"
  }
];

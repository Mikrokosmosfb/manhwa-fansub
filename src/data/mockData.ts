import { Series, Announcement, AppNotification } from '../types';

export const INITIAL_ANNOUNCEMENT: Announcement = {
  id: 'ann-1',
  title: 'DUYURU',
  text: 'Sunucumuzda bakım çalışması tamamlanmıştır. Tüm görsel ve roman bölümleri kesintisiz olarak yayındadır. Keyifli okumalar dileriz!',
  type: 'announcement',
  active: true
};

export const INITIAL_SERIES: Series[] = [
  {
    id: 's-plum',
    title: 'Don\'t Press The Plum',
    slug: 'dont-press-the-plum',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 9.7,
    ageRating: 'Genel',
    isNew: true,
    isGuncel: true,
    isColored: true,
    releaseDay: 'Pazartesi',
    releaseTime: '18:00',
    notice: 'Yeni sezon bölümleri her Pazartesi saat 18:00\'de kesintisiz yayında!',
    synopsis: 'Büyüleyici bir fantastik kurgu romanı dünyasında tutkulu ve gizemli bir serüven. Kahramanın kendi kaderini baştan yazma mücadelesi.',
    author: 'Mikrokosmos Fansub',
    artist: 'Plum Studio',
    translator: 'Mikrokosmos Fansub',
    genres: ['Romantik', 'Fantastik', 'Aksiyon', 'Drama'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-plum-5',
        number: 5,
        title: 'Bölüm 5',
        publishedDate: '1 gün önce',
        isNew: true,
        specialTag: 'Sezon Finali',
        images: [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-plum-4',
        number: 4,
        title: 'Bölüm 4',
        publishedDate: '5 gün önce',
        specialTag: 'Yan Bölüm',
        images: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-plum-3',
        number: 3,
        title: 'Bölüm 3',
        publishedDate: '21 gün önce',
        images: [
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-plum-2',
        number: 2,
        title: 'Bölüm 2',
        publishedDate: '28 gün önce',
        images: [
          'https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 's-blessing',
    title: 'Heaven Official\'s Blessing',
    slug: 'heaven-officials-blessing',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    type: 'Manhua',
    status: 'Devam Ediyor',
    rating: 9.9,
    ageRating: 'Genel',
    isHot: true,
    isColored: true,
    synopsis: 'Sekiz yüz yıl önce Xie Lian, Xianle Krallığı\'nın Veliaht Prensi idi. Cennete yükseldi ancak hızla dünyaya sürgün edildi. Sekiz yüz yıl sonra Xie Lian üçüncü kez Cennete yükselir.',
    author: 'Mo Xiang Tong Xiu',
    artist: 'STARember',
    translator: 'Mikrokosmos Fansub',
    genres: ['Tarihi', 'Fantastik', 'Gizem', 'BL', 'Manhua'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-hob-5',
        number: 5,
        title: 'Bölüm 5',
        publishedDate: '2 gün önce',
        isNew: true,
        specialTag: 'Final',
        images: [
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-hob-4',
        number: 4,
        title: 'Bölüm 4',
        publishedDate: '2 gün önce',
        specialTag: 'Ekstra',
        images: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-hob-3',
        number: 3,
        title: 'Bölüm 3',
        publishedDate: '2 gün önce',
        images: [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-hob-2',
        number: 2,
        title: 'Bölüm 2',
        publishedDate: '3 gün önce',
        images: [
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 's-nightsong',
    title: 'Night Song',
    slug: 'night-song',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 9.6,
    ageRating: 'Genel',
    isNew: false,
    isHot: true,
    isColored: true,
    synopsis: 'Gece çöktüğünde başkentte antik melodi yükselir. Krallığın gölgeleri arasında saklanan efsanevi suikastçının ve saray entrikalarının büyüleyici hikayesi.',
    author: 'Moonlight Studio',
    artist: 'Night Artist',
    translator: 'Mikrokosmos Fansub',
    genres: ['Aksiyon', 'Dram', 'Romantik', 'Tarihi'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-ns-38',
        number: 38,
        title: 'Bölüm 38',
        publishedDate: '2 gün önce',
        isNew: true,
        images: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-ns-37',
        number: 37,
        title: 'Bölüm 37',
        publishedDate: '2 gün önce',
        images: [
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-ns-36',
        number: 36,
        title: 'Bölüm 36',
        publishedDate: '2 gün önce',
        images: [
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-ns-35',
        number: 35,
        title: '2.Sezon Bölüm 35',
        publishedDate: '2 gün önce',
        images: [
          'https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 's-lotm',
    title: 'Lord of the Mysteries (Gizemler Lordu)',
    slug: 'lord-of-the-mysteries',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    type: 'Web Novel',
    status: 'Devam Ediyor',
    rating: 9.9,
    ageRating: 'Genel',
    isHot: true,
    synopsis: 'Zhou Mingrui kendisini Viktorya dönemi alternatif bir dünyada Klein Moretti olarak uyanmış bulur. Sihirli iksirler, tarot kulüpleri ve gizemli varlıklarla dolu bir dünyada Tanrı yolunda ilerler.',
    author: 'Cuttlefish That Loves Diving',
    translator: 'Mikrokosmos Fansub',
    genres: ['Steampunk', 'Gizem', 'Web Novel', 'Büyü', 'Dark Fantasy'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-lotm-1',
        number: 1,
        title: 'Bölüm 1: Kızıl Ay',
        publishedDate: '3 saat önce',
        isNew: true,
        content: `Masanın üzerindeki gaz lambası titrek bir ışık saçıyordu.
Klein başındaki ağrıyla gözlerini açtı. Şakağındaki kurumuş kan izi, az önce ne yaşandığının kanıtıydı.
Zhou Mingrui olarak Çin'de geçirdiği gecenin ardından, nasıl olmuştu da bu Viktorya dönemi odasında uyanmıştı?`
      },
      {
        id: 'c-lotm-2',
        number: 2,
        title: 'Bölüm 2: Tarot Kulübü',
        publishedDate: '1 gün önce',
        content: `Kızıl sisin üstünde beliren antik sarayda, Klein tahtında oturdu.
"Bana... Aptal diyebilirsiniz."`
      }
    ]
  },
  {
    id: 's-shadowslave',
    title: 'Shadow Slave (Gölge Köle)',
    slug: 'shadow-slave',
    coverImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80',
    type: 'Web Novel',
    status: 'Devam Ediyor',
    rating: 9.8,
    ageRating: 'Genel',
    isNew: true,
    synopsis: 'Karakabus Kabusu enfeksiyonuna yakalanan yetim Sunny, Kabus Dünyası\'na çekilir. Büyülü yetenekleri ve kurnazlığıyla hayatta kalma savaşı verir.',
    author: 'Guiltythree',
    translator: 'Mikrokosmos Fansub',
    genres: ['Aksiyon', 'Web Novel', 'Sistem', 'Dark Fantasy', 'Macera'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-ss-1',
        number: 1,
        title: 'Bölüm 1: Şanssız Yetim Sunny',
        publishedDate: '5 saat önce',
        isNew: true,
        content: `Kabus Büyüsü insanlığı yutuyordu. Sunny, varoşların soğuk sokaklarında ilk kabusuna çağrıldı.`
      }
    ]
  },
  {
    id: 's-1',
    title: 'Omniscient Reader\'s Viewpoint (Tüm Bilen Okuyucunun Bakış Açısı)',
    slug: 'omniscient-readers-viewpoint',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 9.8,
    ageRating: 'Genel',
    isHot: true,
    isColored: true,
    synopsis: 'Dokja, tek bir okuyucusu olan "Kıyamette Hayatta Kalmanın Üç Yolu" adlı web romanını 10 yıl boyunca okuyan sıradan bir şirket çalışanıdır. Romanın son bölümü yayınlandığı gün, roman gerçeğe dönüşür ve dünya kıyamet senaryolarının sahnesi haline gelir. Gelecekte ne olacağını bilen tek kişi olan Dokja, hayatta kalmak için bildiklerini kullanmak zorundadır.',
    author: 'sing N song',
    artist: 'Sleepy-C',
    translator: 'Mikrokosmos Fansub',
    genres: ['Aksiyon', 'Fantastik', 'Isekai', 'Macera', 'Sistem', 'Doğaüstü'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-orv-1',
        number: 1,
        title: 'Bölüm 1: Biten Roman ve Başlayan Kıyamet',
        publishedDate: '2026-07-18',
        isNew: false,
        images: [
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-orv-2',
        number: 2,
        title: 'Bölüm 2: İlk Senaryo',
        publishedDate: '2026-07-19',
        isNew: false,
        images: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-orv-3',
        number: 3,
        title: 'Bölüm 3: Dokkaebi ve Seçenekler',
        publishedDate: '2026-07-21',
        isNew: true,
        images: [
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 's-2',
    title: 'Trash of the Count\'s Family (Kont Ailesinin Enkazı)',
    slug: 'trash-of-the-counts-family',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    type: 'Web Novel',
    status: 'Devam Ediyor',
    rating: 9.7,
    ageRating: 'Genel',
    isHot: true,
    synopsis: 'Gözlerimi açtığımda kendimi bir romanın içinde buldum. Üstelik romanın ana karakteri tarafından dayak yiyen sarhoş ve yaramaz soylu Cale Henituse olarak! Tek istediğim sakin ve zengin bir tembel hayatı yaşamak. Ancak ana karakterle çatışmaktan kaçınmaya çalışırken etrafımdaki Ejderhalar, Kahramanlar ve Kadim Güçler beni kendi planlarına dahil etmeye devam ediyor.',
    author: 'Yoo Ryeo Han (유려한)',
    translator: 'Mikrokosmos Fansub',
    genres: ['Reenkarnasyon', 'Fantastik', 'Komedi', 'Macera', 'Web Novel', 'Tarihi'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-tcf-1',
        number: 1,
        title: 'Bölüm 1: Kontun Evindeki Tembel (1)',
        publishedDate: '2026-07-15',
        isNew: false,
        content: `Gözlerimi açtığımda tavanın üzerindeki oymalar yabancıydı.
Yumuşak kuş tüyü yatak ve üzerimdeki ipek yorgan, kaldığım ucuz kiralık odaya hiç benzemiyordu.

"Efendim Cale, uyandınız mı?"

Kibar, yaşlı bir ses yan tarafımdan duyuldu. Başımı çevirdiğimde, gümüş saçlı ve oldukça şık giyimli yaşlı bir adam bana bakıyordu.

Anılar zihnime hücum etti. Cale Henituse. Henituse Kontluğu'nun en büyük oğlu. Kasabanın ünlü sarhoşu ve işe yaramazı.
En önemlisi de, dün gece okuduğum "Bir Kahramanın Doğuşu" romanının ilk cildinde, kasabaya gelen ana karakter Choi Han tarafından feci şekilde dövülecek karakterdi!

'Aman Tanrım...'

Cale derin bir nefes aldı. Dayak yemek istemiyordu. Ağrılardan nefret ederdi.

"Ron," dedi Cale sesi pürüzsüz ve sakince tutarak.

"Buyurun efendim."

"Bana harçlığımı getir. Ve bugün dışarı çıkmayacağım."

Tembel bir zengin hayatı yaşamak istiyorsam, ana karakterden uzak durmalı ve paramı huzur içinde harcamalıyım. Planım buydu!`
      },
      {
        id: 'c-tcf-2',
        number: 2,
        title: 'Bölüm 2: Kontun Evindeki Tembel (2)',
        publishedDate: '2026-07-17',
        isNew: false,
        content: `Yemek masasında Kont Deruth bana baktı. Bakışlarında suçluluk ve şefkat vardı.

"Cale, bugün nasılsın? Bir şeye ihtiyacın var mı?"

"Abide daha fazla altın lazım baba."

Deruth bir an duraksadı, ardından sıcak bir şekilde gülümsedi.

"Hahaha! Elbette, Ron'a söyle sana istediğin kadar altın versin."

İşte bu! Zengin bir ailenin işe yaramaz oğlu olmanın en iyi yanı buydu. Kimse benden krallığı kurtarmamı beklemiyordu. Sadece altın harcayıp iyi yemekler yemem yeterliydi.

Ancak Ron'un bana çay sunarken yüzünde beliren gizemli gülümseme tüylerimi ürpertiyordu. Bu uşak sıradan biri değildi. O ve oğlu, suikastçı klanının üyeleriydi.

'İyi geçinmeliyim... kesinlikle iyi geçinmeliyim.'`
      },
      {
        id: 'c-tcf-3',
        number: 3,
        title: 'Bölüm 3: Kadim Gücün Peşinde',
        publishedDate: '2026-07-21',
        isNew: true,
        content: `Cale kasabanın kenarındaki fırına doğru yürüdü.
Romana göre, bu kasabada saklı duran savunma amaçlı bir "Kadim Güç" vardı. 'Indestructible Shield' (Yıkılmaz Kalkan).

Eğer dünyada savaş çıkarsa ve ben tembelce yaşamak istiyorsam, önce kendimi koruyacak yıkılmaz bir kalkana ihtiyacım vardı.

Fırıncı kızın yanına yaklaştım ve cebimdeki altın gümüş paraları çıkardım.

"Bana buradaki tüm ekmekleri ver."

Kız şaşkınlıkla gözlerini açtı.

"H-hepsini mi efendim?"

"Evet. Ve fakir çocuklara dağıtmam için yardım et."

Böylece, kalkanın sahibini ikna etme planım başladı. İyi adam gibi görünmek istemiyordum ama kalkanı almak için bu şarttı.`
      }
    ]
  },
  {
    id: 's-3',
    title: 'The Beginning After the End (En Başından Sonraki Başlangıç)',
    slug: 'the-beginning-after-the-end',
    coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 9.6,
    ageRating: 'Genel',
    isHot: true,
    isColored: true,
    synopsis: 'Kral Grey, dövüş yetenekleriyle rakipsiz bir güce ve şana sahipti. Ancak yalnızlık ve boşluk içinde öldükten sonra, sihir ve ejderhaların hüküm sürdüğü yeni bir dünyada Arthur Leywin adında bir bebek olarak yeniden doğar. Geçmiş yaşamının bilgeliğini koruyan Arthur, sevdiklerini korumak için yeni dünyada yeniden zirveye tırmanır.',
    author: 'TurtleMe',
    artist: 'Fuyuki23',
    translator: 'Mikrokosmos Fansub',
    genres: ['Reenkarnasyon', 'Fantastik', 'Aksiyon', 'Büyü', 'Macera', 'Manga'],
    updatedAt: '2026-07-20',
    chapters: [
      {
        id: 'c-tbate-1',
        number: 1,
        title: 'Bölüm 1: Kralın Doğuşu',
        publishedDate: '2026-07-10',
        isNew: false,
        images: [
          'https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-tbate-2',
        number: 2,
        title: 'Bölüm 2: Mana Çekirdeği',
        publishedDate: '2026-07-14',
        isNew: false,
        images: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 's-4',
    title: 'Eleceed (Süper Hızlı Kedi ve Çocuk)',
    slug: 'eleceed',
    coverImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&auto=format&fit=crop&q=80',
    type: 'Webtoon',
    status: 'Devam Ediyor',
    rating: 9.9,
    ageRating: 'Genel',
    isHot: true,
    isColored: true,
    synopsis: 'Jiwoo, süper hızlı reflekslere sahip altın kalpli bir lise öğrencisidir. Bir gün sokakta yaralı şişko bir kedi bulur ve onu eve götürür. Ancak bu kedi aslında dünyayı sarsan en güçlü gizli uyanmış savaşçı Kayden\'dan başkası değildir! Kayden yaralarını sarmak için bir tombul kedinin bedenine sığınmıştır.',
    author: 'Son Jeaho',
    artist: 'ZHENA',
    translator: 'Mikrokosmos Fansub',
    genres: ['Aksiyon', 'Komedi', 'Süper Güç', 'Webtoon', 'Okul Hayatı'],
    updatedAt: '2026-07-21',
    chapters: [
      {
        id: 'c-eleceed-1',
        number: 1,
        title: 'Bölüm 1: Şişman Kedi',
        publishedDate: '2026-07-19',
        isNew: false,
        images: [
          'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=900&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 'c-eleceed-2',
        number: 2,
        title: 'Bölüm 2: Gizli Güçler',
        publishedDate: '2026-07-21',
        isNew: true,
        images: [
          'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=900&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 's-5',
    title: 'A Stepfather\'s Karma (Üvey Babanın Karması)',
    slug: 'a-stepfathers-karma',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
    type: 'Web Novel',
    status: 'Tamamlandı',
    rating: 9.3,
    ageRating: '18+',
    isHot: false,
    synopsis: 'Eski hayatında yaptığı hataların bedelini ödemek için fantastik bir krallıkta üvey baba olarak uyanan karanlık bir büyücünün duygusal ve gerilim dolu hikayesi. Çocuklarını krallığın tehditlerinden korumak için karanlık geçmişini gizlemek zorundadır.',
    author: 'Mikrokosmos Studio',
    translator: 'Mikrokosmos Fansub',
    genres: ['Drama', 'Dark Fantasy', 'Web Novel', '18+', 'Psikolojik', 'Trajedi'],
    updatedAt: '2026-07-15',
    chapters: [
      {
        id: 'c-sfk-1',
        number: 1,
        title: 'Bölüm 1: Günahların Gölgesi',
        publishedDate: '2026-07-01',
        isNew: false,
        content: `Karanlık ormanın derinliklerindeki eski kulübede mum ışığı titriyordu.
Çocukların nefes alışverişleri düzenliydi ama dışarıdaki kurt ulumaları gecenin sessizliğini bozuyordu.

Eski bir necromancer olarak, bu ellerle yüzlerce can almıştım. Şimdi ise bu iki yetimi korumak için gece boyunca nöbet tutuyordum.

Karma... Sonunda beni bulmuştu.`
      }
    ]
  },
  {
    id: 's-missing-love',
    title: 'Missing Love/ A Married Man',
    slug: 'missing-love-a-married-man',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Tamamlandı',
    rating: 9.7,
    ageRating: '18+',
    is18Plus: true,
    isHot: true,
    synopsis: 'Evlilik ve geçmişin sırlarıyla dolu sürükleyici ve tutkulu bir romantik manhua/manhwa hikayesi.',
    author: 'Mikrokosmos Fansub',
    genres: ['BL', 'Romantik', '18+', 'Drama'],
    updatedAt: '2026-08-10',
    chapters: [
      { id: 'c-ml-1', number: 1, title: 'Bölüm 1', publishedDate: '1 gün önce', images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80'] }
    ]
  },
  {
    id: 's-our-omega',
    title: 'Our Omega Leadernim',
    slug: 'our-omega-leadernim',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 8.25,
    isHot: true,
    synopsis: 'Omegaverse dünyasında lider bir klan yöneticisinin beklenmedik aşk ve iktidar mücadelesi.',
    author: 'Studio Omega',
    genres: ['BL', 'Romantik', 'Fantastik'],
    updatedAt: '2026-08-11',
    chapters: [
      { id: 'c-ool-1', number: 1, title: 'Bölüm 1', publishedDate: '2 gün önce', images: ['https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80'] }
    ]
  },
  {
    id: 's-saturday-master',
    title: 'Saturday\'s Master',
    slug: 'saturdays-master',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 9.8,
    ageRating: '21+',
    is18Plus: true,
    isHot: true,
    synopsis: 'Cumartesi günleri buluşan iki gizemli adamın arasındaki büyüleyici ve tutkulu bağ.',
    author: 'Saturday Studio',
    genres: ['BL', '18+', '21+', 'Drama'],
    updatedAt: '2026-08-12',
    chapters: [
      { id: 'c-sm-1', number: 1, title: 'Bölüm 1', publishedDate: '1 gün önce', images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80'] }
    ]
  },
  {
    id: 's-bye-bye',
    title: 'Bye Bye (Beklemede)',
    slug: 'bye-bye',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 8.3,
    isHot: true,
    synopsis: 'Ayrılıkların ardından yeniden keşfedilen derin duygular ve geçmişin izleri.',
    author: 'Bye Studio',
    genres: ['BL', 'Drama', 'Romantik'],
    updatedAt: '2026-08-09',
    chapters: [
      { id: 'c-bb-1', number: 1, title: 'Bölüm 1', publishedDate: '3 gün önce', images: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop&q=80'] }
    ]
  },
  {
    id: 's-turning-novel',
    title: 'Turning [NOVEL]',
    slug: 'turning-novel',
    coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    type: 'Web Novel',
    status: 'Devam Ediyor',
    rating: 9.4,
    isHot: true,
    synopsis: 'Zamanı geriye saran şövalyenin felaketi önlemek için komutanıyla kurduğu kader birliği.',
    author: 'Turning Author',
    genres: ['Web Novel', 'BL', 'Fantastik', 'Isekai'],
    updatedAt: '2026-08-11',
    chapters: [
      { id: 'c-tn-1', number: 1, title: 'Bölüm 1', publishedDate: '1 gün önce', content: 'Turning Roman Bölüm 1 içeriği...' }
    ]
  },
  {
    id: 's-sunny-days',
    title: 'Our Sunny Days',
    slug: 'our-sunny-days',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    type: 'Manhwa',
    status: 'Devam Ediyor',
    rating: 7.2,
    isHot: true,
    synopsis: 'Güneşli ve sıcak kasaba günlerinde filizlenen tatlı ve samimi bir aşk hikayesi.',
    author: 'Sunny Author',
    genres: ['BL', 'Romantik', 'Yaşamdan'],
    updatedAt: '2026-08-08',
    chapters: [
      { id: 'c-sd-1', number: 1, title: 'Bölüm 1', publishedDate: '4 gün önce', images: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80'] }
    ]
  }
];

export const GENRE_LIST = [
   'Aksiyon', 'Macera', 'Komedi', 'Drama', 'Fantastik', 'Tarihi',
   'Korku', 'Isekai', 'Büyü', 'Gizem', 'Psikolojik', 'Romantik',
   'Bilimkurgu', 'Yaşamdan', 'Spor', 'Gerilim', 'Trajedi', 'Yaoi',
   'Yuri', 'BL', 'GL', 'Reenkarnasyon', 'Okul Hayatı', 'Doğaüstü',
   'Sistem', '18+', '21+', 'Dark Fantasy', 'Webtoon', 'Web Novel'
 ];
 
 export const INITIAL_NOTIFICATIONS: AppNotification[] = [];


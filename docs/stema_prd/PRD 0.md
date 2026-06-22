# AI Destekli Mühendislik/STEM Öğrenme Platformu — PRD v1
**Hazırlanma tarihi:** 19 Haziran 2026
**Kapsam:** Mühendislik (tüm dallar) + CS/algoritma ağırlıklı, Matematik/Fizik çekirdek, Coğrafya/Tarih (mindmap odaklı) destekli, çoklu-model (DeepSeek + Gemini + OCR zorunlu) orkestrasyonlu, ~2 ay geliştirme süreli uzun vadeli platform.

---

## 0. Önceki Çıktının (Perplexity) Eksik Analizi

Yüklediğin dokümanda doğru bir iskelet var ama 7 kritik boşluk mevcut:

1. **Model seti güncel değil.** o3-mini, GPT-4o-mini, Claude 3.5 Sonnet (2024 nesli) referans alınmış. Haziran 2026 itibarıyla aktif nesil: GPT-5.4/5.5, Claude Opus 4.6 / Sonnet 4.6 / Haiku 4.5, Gemini 3.1 Pro / Flash / Flash-Lite, DeepSeek V4 / V3.2.
2. **DeepSeek ve Gemini orkestrasyonu yok.** Senin zorunlu kıldığın iki model dokümana hiç girmemiş.
3. **Kapsam dar.** Sadece matematik/STEM var; mühendislik (tüm dallar), CS/algoritma sandbox, coğrafya/tarih + mindmap kapsam dışı bırakılmış.
4. **Spaced repetition algoritması eski.** Ease-factor (SM-2 tarzı) kullanılmış; 2022 sonrası endüstri standardı FSRS, aynı retention için %20-30 daha az tekrar gerektiriyor ve Anki 2023'ten beri varsayılan olarak FSRS kullanıyor.
5. **OCR motoru seçimi gerekçesiz.** Mathpix varsayılmış; 2026 benchmarklarına göre Gemini Flash matematik OCR'da hem ~6 kat ucuz hem daha doğru çıkıyor.
6. **Mindmap/görsel kavram haritası özelliği yok.** Senin coğrafya/tarih için özellikle istediğin özellik tamamen eksik.
7. **Mühendislik-spesifik modül yok.** Devre analizi, birim doğrulama, sembolik hesap kontrolü gibi mühendisliğe özgü doğrulama katmanları işlenmemiş.

Bu doküman yukarıdaki yedi boşluğu kapatacak şekilde yeniden kuruldu.

---

## 1. Pazar ve Rakip Analizi

### 1.1 Astra AI (referans ürün)
Web ve mobil tabanlı, matematik/fizik/kimya ağırlıklı 14 derslik bir AI öğretmen. Temel mekanizmalar:
- **Snap and Solve:** Fotoğraftan soru OCR'lama, anında adım adım çözüm.
- **Solver Mode / Exam Prep / Socratic Mode:** Üç ayrı etkileşim modu — direkt çözüm, sınava özel plan, derinlemesine kavramsal keşif.
- **Magic Notebook:** Doğrudan cevap vermek yerine bağımsız problem çözmeyi teşvik eden arka uç mantığı.
- **Müfredat uyumu:** İçerik, ülkenin resmi müfredatına göre uyarlanıyor.
- **Görsel ilerleme takibi + not artışı garantisi** (pazarlama unsuru, ürün güveni için).

Astra'nın asıl gücü: giriş sürtünmesini sıfıra indirmek (fotoğraf çek → çöz) ve bunu kavramsal rehberlikle dengelemek.

### 1.2 Khanmigo (Khan Academy, OpenAI destekli)
- Tasarım felsefesi: öğrenciye asla direkt cevap vermemek. "Bu konuda ne biliyorsun?" tarzı sokratik soru zinciri.
- Khan Academy içerik kütüphanesine sıkı bağlılık — yanıtlar her zaman platformun ders içeriğine demirleniyor.
- Öğretmen tarafı ayrı: ders planı, rubrik, farklılaştırılmış pratik üretimi.
- Bağımsız testlerde 8 haftalık kullanım sonrası matematikte %23, fende %18 kavram kalıcılığı artışı raporlanmış (küçük örneklem, pazarlama amaçlı test).
- Zayıf yön: yazı/beşeri bilimler desteği matematik/fen kadar güçlü değil, sesli etkileşim yok.

### 1.3 Synthesis Tutor
- Hedef kitle K-5 (5-11 yaş), SpaceX'in iç eğitim programından doğmuş.
- Konuşma tabanlı adaptif tutor: öğrenciye düşünce sürecini anlattırıyor, sadece doğru/yanlış kontrolü yapmıyor.
- Mastery gating: kavram oturmadan ileri konuya geçilmiyor; çok-duyulu (multi-sensory) görselleştirme kullanıyor.
- Senin hedef kitlen (üniversite/mühendislik) için doğrudan model değil ama **mastery gating** ve **adaptif zorluk** mekanizması doğrudan uyarlanabilir.

### 1.4 Gauth AI (ByteDance, eski adıyla Gauthmath)
- 2026 itibarıyla K-12 + alt-lisans seviyesinde en yaygın "Study Toolbox": matematik, fizik, kimya, biyoloji, ekonomi.
- **Enhanced OCR + DeepThinking modu:** sadece sonuç değil, yöntemi öğreten pedagojik açıklama.
- **Hibrit model:** AI yetersiz kaldığında canlı insan tutor'a (Emma 2.0) devrediyor — saf AI'nin sınırını insan destekle kapatıyor.
- Zayıf yönler: uzun paragraf tarzı sözel problemlerde bağlam kaybı, kötü ışıkta OCR hatası, ileri seviye ispat/kalkülüste tavan.
- Riskli yön: "Instant Solver" modu akademik dürüstlük ihlali olarak işaretleniyor — bizim üründe bu riski **Sokratik-varsayılan, direkt-cevap opsiyonel** tasarımla yönetmek gerekir.

### 1.5 Mindmap araçları (Mapify, CogniGuide, Mind Map Wizard)
Senin coğrafya/tarih talebine doğrudan referans:
- **Mapify:** PDF/YouTube/web sayfası/sohbet geçmişini otomatik hiyerarşik mindmap'e çeviriyor; Claude, ChatGPT ve Gemini'yi birlikte kullanıyor; düzenlenebilir node yapısı, görsel/PNG/PDF/Markdown export.
- **CogniGuide:** Notion/DOCX/PDF girdisinden semantik ilişkileri analiz edip hiyerarşik dal yapısı kuruyor; müfredat planlama ve sistem mimarisi görselleştirmede de kullanılıyor.
- Çıkarım: mindmap özelliği bizim platformda **tek bir "diyagram modu" değil, ayrı bir öğrenme yolu (humanities/kavramsal mod)** olarak konumlanmalı — tarih/coğrafya gibi ilişkisel-hiyerarşik bilgi için birincil arayüz, STEM'de ise ikincil (destekleyici) görselleştirme katmanı.

### 1.6 Diğer referanslar (kısa)
- **Photomath:** Sadece matematik, çok rijit, kimya/fizik desteklemiyor — devre dışı bırakacağımız dar kapsam örneği.
- **Wolfram Alpha:** Sembolik hesap motoru olarak doğrulama katmanında (verifier) kullanılabilir; pedagojik tutor değil.
- **Julius AI:** Pedagojik tutor değil ama context memory + veri/grafik analizi yaklaşımı, mühendislik veri/deney analizi modülü için referans.

### 1.7 Özellik Matrisi

| Ürün | Birincil güç | Tutoring yaklaşımı | OCR/Görsel | Hafıza/İlerleme | İçerik kapsamı |
|---|---|---|---|---|---|
| Astra AI | Giriş sürtünmesi düşük, müfredat uyumlu | Solver + Sokratik + Sınav planı | Fotoğraftan OCR, grafik çizici | İlerleme takibi, eksik tespiti | 14 ders (math/fizik/kimya/dil ağırlıklı) |
| Khanmigo | İçerik demirleme, öğretmen araçları | Saf Sokratik, asla direkt cevap yok | Yok (metin tabanlı) | Öğrenci/öğretmen log | Khan Academy müfredatı |
| Synthesis | Mastery gating, çok-duyulu | Konuşma tabanlı adaptif | Oyunlaştırılmış görsel | Veli/öğretmen dashboard | K-5 matematik |
| Gauth AI | OCR + hibrit insan destek | DeepThinking + canlı tutor devri | En güçlü OCR, çoklu konu | Çalışma araç kutusu | 30+ ders, K-12+alt lisans |
| Mapify/CogniGuide | Görsel bilgi yapılandırma | Yok (tutor değil) | PDF/video → mindmap | Yok | Genel (her konu) |
| **Bizim platform** | OCR + Sokratik + mindmap + sandbox tek çatıda | Adaptif: STEM'de Sokratik+doğrulama, beşeride mindmap+Feynman | Çoklu model OCR (Gemini öncelikli) | FSRS + mastery graph + mistake log | Mühendislik (tüm dal) + CS/algoritma + Matematik/Fizik + Coğrafya/Tarih |

### 1.8 Genel LLM'lerin STEM'deki Zayıflıkları ve Bu Platformun Kapatacağı Boşluk

Genel amaçlı bir LLM'e (ChatGPT/Claude/Gemini çıplak hâliyle) doğrudan soru sorulduğunda üç yapısal sorun çıkar:

1. **Matematiksel halüsinasyon:** Çok adımlı hesaplarda ara adım hatası, sembol/birim tutarsızlığı; model kendinden emin görünür ama hatalıdır.
2. **Duvar metin sorunu:** Tek seferde uzun, yapılandırılmamış açıklama — öğrenci hangi adımda takıldığını işaretleyemez.
3. **Oturumlar arası hafıza yokluğu:** Her sohbet sıfırdan başlar; öğrencinin hangi konularda zayıf olduğu, hangi hata türünü tekrarladığı hiç kayıt altına alınmaz.

Rakiplerin çözümleri: Astra/Gauth adım adımlaştırma + OCR ile sürtünmeyi azaltıyor; Khanmigo içerik demirleme + Sokratik akış ile halüsinasyonu sınırlıyor; Synthesis mastery gating ile yanlış ilerlemeyi engelliyor. Hiçbiri bunların **hepsini** + mühendislik/CS derinliği + mindmap'i tek platformda birleştirmiyor. Bizim boşluğumuz tam burada: **soruya cevap veren chatbot değil, öğrenci modelini sürekli güncelleyen, hatayı kavram grafiğine işleyen, gerektiğinde kod/devre/ispat/mindmap üreten ve mastery kazanılmadan ilerlemeyen bir öğrenme motoru.**

---

## 2. Çekirdek Özellik Spesifikasyonları

### 2.0 İki Mod Mimarisi (platformun ayırt edici tasarım kararı)

| | **Solver Mode** | **Mapping Mode** |
|---|---|---|
| Kapsayan dersler | Matematik, Fizik, Mühendislik (tüm dallar), CS/Algoritma | Coğrafya, Tarih, kavramsal/teorik dersler |
| Birincil arayüz | Sokratik adım-adım çözüm + sandbox/doğrulama | İnteraktif mindmap + zaman çizelgesi |
| Doğrulama katmanı | Sembolik hesap, birim kontrolü, kod çalıştırma | Kaynak/RAG temelli doğruluk kontrolü |
| Tekrar mekanizması | Hata tipine göre flashcard (FSRS) | Mindmap dalı bazlı recall testi (FSRS) |

Kullanıcı bir konu seçtiğinde sistem otomatik modu öner; kullanıcı manuel geçiş yapabilir (örn. tarih konusunu Sokratik olarak da çalışmak isteyebilir).

### MVP Özellikleri

**1. Çoklu-Model OCR + Snap-to-Solve**
- *Öğrenme değeri:* Giriş sürtünmesini sıfırlar; el yazısı/basılı/devre şeması/grafik gibi farklı girdi türlerini tek akışta birleştirir.
- *Kullanıcı akışı:* Fotoğraf/ekran görüntüsü yükle → OCR motoru metni ve LaTeX/sembolleri çıkarır → konu+zorluk sınıflandırılır → Solver veya Mapping moduna yönlendirilir.
- *AI davranışı:* Birincil OCR Gemini 3 Flash ile yapılır (bkz. Bölüm 3.2). Çıkan metin önce normalize edilir (birim, sembol tutarlılığı), sonra ham OCR çıktısı kullanıcıya gösterilip onay istenir — yanlış okunan sembol varsa düzeltme şansı verilir.

**2. Sokratik Adım-Adım Çözücü**
- *Öğrenme değeri:* Doğrudan cevap yerine düşünme zinciri kurar; Khanmigo'nun kanıtlanmış pedagojik yaklaşımı.
- *Kullanıcı akışı:* Soru girilir → model direkt cevap vermez → "Bu konuda ne biliyorsun?" tipi ipucu → öğrenci adım atar → model doğrular/düzeltir → final adımda kullanıcıdan özetletme istenir.
- *AI davranışı:* En az 3 kademeli ipucu sistemi zorunlu (genel ipucu → yönlendirici ipucu → neredeyse-cevap). Direkt final cevap sadece kullanıcı açıkça isterse veya o kavramda mastery skoru zaten yüksekse verilir.

**3. CS/Algoritma Sandbox**
- *Öğrenme değeri:* Mühendislik/CS ağırlıklı kapsamın çekirdeği; kod yazma, çalıştırma, adım adım izleme (trace) ile algoritmik düşünmeyi hızlandırır.
- *Kullanıcı akışı:* Kullanıcı kod yazar veya algoritma sorusu sorar → sandbox'ta çalıştırılır → hata varsa AI hatayı debug eder (cevabı vermeden önce hangi satırda sorun olduğunu sordurur) → karmaşıklık analizi (Big-O) otomatik üretilir → adım adım değişken durumu görselleştirilir.
- *AI davranışı:* Kod asla "burada doğrusu bu" diye direkt yazılmaz; önce kullanıcının mantık hatasını Sokratik sorularla buldurmaya çalışılır, ısrar ederse çözüm gösterilir.

**4. Feynman Modu**
- *Öğrenme değeri:* Bilgiyi kendi cümleleriyle yeniden kurmak gerçek kavrayışı test eder; yüzeysel "anladım" hissini ayıklar.
- *Kullanıcı akışı:* Konu seçilir → kısa AI açıklaması → kullanıcı kendi anlatımını yazar/seslendirir → model konsept grafına göre puanlar, eksik terimleri işaretler → "yeniden anlat" döngüsü.
- *AI davranışı:* Kullanıcı açıklamasını önceden tanımlı concept-tag listesiyle karşılaştırır; eksik/yanlış terim varsa düzeltme değil, soru sorarak buldurma tercih edilir.

**5. FSRS Tabanlı Spaced Repetition**
- *Öğrenme değeri:* SM-2'nin aksine her kart için üç değişkenli (Zorluk, Kararlılık/Stability, Hatırlanabilirlik/Retrievability) istatistiksel model kurar; aynı hatırlama oranı için %20-30 daha az tekrarla sonuç verir. Açık kaynak (MIT lisans), Python/Rust/JS implementasyonları mevcut.
- *Kullanıcı akışı:* Hata/konsept etiketi oluşur → kart otomatik üretilir → FSRS motoru bir sonraki tekrar tarihini hedef hatırlama oranına (örn. %90) göre hesaplar → kullanıcı "Tekrar/Zor/İyi/Kolay" ile derecelendirir → parametreler güncellenir.
- *AI davranışı:* Yeni kullanıcı popülasyon-ortalama FSRS parametreleriyle başlar; ~1000 tekrardan sonra kullanıcıya özel optimize edilir (arka planda periyodik job).

**6. Concept Mastery Dashboard**
- *Öğrenme değeri:* "Neyi bildiğini" değil "neyi gerçekten öğrendiğini" gösterir.
- *Kullanıcı akışı:* Konu → alt kavram → önkoşul ağacı → mastery yüzdesi → son hata kümeleri tek ekranda.
- *AI davranışı:* Mastery skoru tek soru sonucundan güncellenmez; çoklu kanıt (en az 3 bağımsız doğru cevap, farklı zorlukta) gerekir.

**7. AI Mindmap Generator (Mapping Mode çekirdeği)**
- *Öğrenme değeri:* Coğrafya/tarih gibi ilişkisel-hiyerarşik bilgiyi metin yerine görsel ağaç olarak sunar; Mapify/CogniGuide'ın kanıtladığı kullanım deseni.
- *Kullanıcı akışı:* Konu/PDF/ders notu yüklenir → model ana kavramı kök, alt kavramları dal olarak çıkarır → kullanıcı düzenleyebilir, dal büyütebilir ("bu dalı genişlet") → export (PNG/PDF/Markdown).
- *AI davranışı:* Hiyerarşi üretimi RAG'dan beslenir (kaynak metne sadık kalınır, uydurma dal eklenmez); her düğüm kaynak referansı taşır.

**8. Mistake Intelligence (Hata Sınıflandırma)**
- *Öğrenme değeri:* Her yanlışın kök nedenini ayırt eder: kavram yanılgısı, işlem hatası, dikkat hatası, soru okuma hatası — her biri farklı müdahale gerektirir.
- *Kullanıcı akışı:* Soru çözülür → yanlışsa hata tipi sınıflandırılır → loglanır → FSRS kartı bu etikete göre üretilir.
- *AI davranışı:* Aynı hata tipi tekrar görülürse aynı anlatım tekrarlanmaz, farklı modalite denenir (örn. metin yerine diyagram).

### V1 Özellikleri

**1. Multimodal Açıklayıcılar:** Metni duruma göre LaTeX ispat, Mermaid diyagram, kod sandbox, devre şeması (Mühendislik) veya zaman çizelgesine (Tarih) çevirir. Konuya göre en uygun modalite AI tarafından seçilir.

**2. Mühendislik Hesap Doğrulayıcı:** Birim analizi (SI tutarlılığı), sembolik matematik kontrolü (CAS motoru ile), sayısal sonucun makul aralıkta olup olmadığının kontrolü. Reasoning modelinin ürettiği hesap, ayrı bir deterministik araçla (kod çalıştırma / CAS) çapraz doğrulanmadan kullanıcıya "kesin doğru" diye sunulmaz.

**3. Sınav/Deneme Üretici:** Müfredat + zorluk seviyesine göre deneme üretir; zayıf konulara ağırlık verir, soru tiplerini karıştırır.

**4. Tutor Memory / Öğrenci Profili:** Tercih, tempo, hedef (örn. "EEE210 finali"), zayıf kavramlar kalıcı tutulur; oturumlar arası bağlam kaybolmaz.

**5. Doküman/PDF Ingestion + RAG:** Ders notları, kitap, soru bankası yüklenir, parçalanır (chunk), embedding ile indekslenir; model sadece alıntılanan bağlamı kullanır, kaynak yoksa "bilmiyorum" der.

**6. Maliyet-Optimizasyonlu Model Router:** Görev tipine göre otomatik ucuz/güçlü model seçimi (bkz. Bölüm 3.1) — kullanıcıya şeffaf token/maliyet göstergesi.

**7. Tarih Kronoloji Görselleştirici:** Mapping Mode'un tarih-özel uzantısı; olayları nedensellik oklarıyla bağlayan interaktif zaman çizelgesi.

---

## 3. Sistem Mimarisi ve API Entegrasyon Planı

### 3.1 LLM Orkestrasyon Stratejisi (Haziran 2026 model seti)

| Görev tipi | Önerilen model | Gerekçe |
|---|---|---|
| OCR (fotoğraf → metin/LaTeX) | **Gemini 3 Flash** (birincil) | Sayfa başı ~$0,004, Mathpix'e göre ~6 kat ucuz ve daha doğru çıkıyor (bağımsız OCR benchmark). Mathpix yalnızca kimya yapısı/karmaşık tablo ağırlıklı görsellerde fallback olarak tutulabilir. **Grok asla OCR için kullanılmaz** — bağımsız testlerde sayfa içeriğini uydurma (halüsinasyon) oranı çok yüksek çıktı. |
| Niyet sınıflandırma, konu etiketleme, özet, flashcard üretimi | **DeepSeek V3.2/V4** veya **Gemini 3 Flash-Lite** | İkisi de en ucuz uçta (~$0,10-0,40/M ve ~$0,27-1,10/M token); yüksek hacim, düşük risk. DeepSeek V4, MMLU'da proprietary modellerle eşit (94,2%) seviyede, maliyeti çok düşük. |
| Zor matematik/fizik türetme, çok adımlı ispat, mühendislik hesabı | **Gemini 3.1 Pro** (reasoning lideri, GPQA ~94,3%) veya **Claude Sonnet 4.6** | Reasoning modelleri genelde daha yüksek halüsinasyon oranına sahip (bağımsız ölçümlerde reasoning modelleri için %10+); bu yüzden çıktısı **mutlaka** Bölüm 3.1'deki verifier katmanından geçmeli, doğrudan kullanıcıya sunulmamalı. |
| Kod üretimi, debug, sandbox, agentic akış | **Claude Sonnet 4.6 / Opus 4.6** | Coding benchmarklarında (SWE-bench) en güçlü aile; agentic tool-use güçlü, çok adımlı debug akışına uygun. |
| Uzun doküman/ders notu analizi (RAG bağlamı) | **Gemini 3.1 Pro** | 2M token'a kadar bağlam penceresi — kitap/PDF boyutunda materyal için en avantajlı seçenek. |
| Mindmap hiyerarşi çıkarımı | **DeepSeek V4** veya **Gemini 3 Flash** | Orta karmaşıklıkta yapılandırma görevi; pahalı reasoning modeline gerek yok. |

**Önemli prensip:** Reasoning modeli çıktısı asla "ground truth" kabul edilmez. Her sayısal/sembolik sonuç deterministik bir araçla (kod yürütme, CAS, birim kontrolü) doğrulanır; doğrulanamıyorsa kullanıcıya "bu adımı kontrol edemedim" uyarısı verilir.

### 3.2 OCR Pipeline

1. Görsel yüklenir → Gemini 3 Flash'e vision isteği gönderilir (LaTeX + düz metin + tablo formatında çıktı istenir).
2. Çıktıda matematiksel sembol yoğunluğu yüksekse ikinci bir doğrulama turu (aynı görsel, farklı prompt ile) çalıştırılır; iki çıktı uyuşmuyorsa kullanıcıya manuel düzeltme arayüzü gösterilir.
3. Kimyasal yapı/karmaşık devre şeması tespit edilirse Mathpix'e (veya özel görsel-tanıma modeline) yönlendirme yapılır.
4. Sonuç normalize edilip Solver/Mapping moduna iletilir.

### 3.3 RAG / Vector Database Mimarisi

Mevcut stack'in (Supabase) **pgvector** eklentisi kullanılır — ayrı bir vector DB servisi (Pinecone vb.) gerekmez, maliyet ve operasyonel yük azalır.

- **Kaynak türleri:** ders notları, PDF kitaplar, kullanıcı notları, soru bankaları, resmi müfredat, kod snippet'leri.
- **Chunking:** Her belge 300-500 token'lık parçalara bölünür, parça başına metadata: `concept_tags`, `prerequisite_tags`, `difficulty`, `source_type`, `subject`.
- **Retrieval kuralı:** Model yalnızca top-k alıntılanan bağlamı kullanır; bağlamda olmayan bilgiyi üretmez (zero-hallucination policy). Bağlam yetersizse "kaynaklarımda bu yok" yanıtı zorunlu.
- **Embedding modeli:** Maliyet/performans dengesi için Gemini veya açık kaynak embedding modeli (örn. `text-embedding-3-small` muadili) — büyük ölçekte tekrar ölçülüp seçilmeli.

### 3.4 State & Memory Management (Katmanlı)

1. **Session state** (kısa süreli): aktif sohbet bağlamı, seçili mod, aktif soru.
2. **Learner profile** (uzun süreli): hedef, tempo, tercih edilen anlatım stili, dil.
3. **Concept mastery graph:** kavram → önkoşul ilişkisi + mastery skoru.
4. **Mistake log:** hata tipi, zaman, ilgili kavram.
5. **FSRS scheduler state:** her kart için difficulty/stability/retrievability/due_at.

### 3.5 Önerilen Servis Akışı

1. **Ingest:** Görsel/PDF/metin → OCR/parse → ham metin + metadata.
2. **Classifier:** Konu, zorluk, modalite, mod (Solver/Mapping) tespiti (ucuz model).
3. **Retriever:** RAG üzerinden konu+önkoşul temelli top-k bağlam çekimi.
4. **Tutor Engine:** Model seçimi (Bölüm 3.1 tablosu) + prompt enjeksiyonu + araç çağırma (kod çalıştırma, CAS, mindmap üretici).
5. **Verifier:** Matematik/birim doğrulama, kod çalıştırma sonucu kontrolü, kaynak grounding kontrolü.
6. **Memory Writer:** mastery güncelleme, hata loglama, FSRS sonraki tekrar tarihi hesaplama.
7. **UI Renderer:** Markdown, LaTeX, Mermaid, mindmap canvas, kod sandbox çıktısı.

### 3.6 Teknoloji Yığını (mevcut stack ile uyumlu)

- **Frontend:** Next.js (mevcut deneyimle uyumlu), mindmap/diyagram render için canvas tabanlı kütüphane (örn. React Flow benzeri).
- **Backend:** Python/FastAPI (AI orkestrasyon katmanı için Django'dan daha hafif ve async-friendly).
- **Veritabanı:** Supabase (Postgres + pgvector + Auth + Storage — görsel/PDF dosyaları için).
- **Kod sandbox:** İzole container (Docker) içinde kullanıcı kodunu çalıştırma; kaynak limiti ve timeout zorunlu.
- **Job/queue:** FSRS toplu optimizasyonu, RAG indeksleme gibi arka plan işleri için basit bir queue (örn. Supabase Edge Functions + cron veya Celery).

---

## 4. Tam PRD

### 4.1 Ürün Vizyonu
Öğrencinin sadece soru çözmesini değil, kavram inşa etmesini ve uzun vadeli mastery kazanmasını hızlandıran kişisel öğrenme işletim sistemi kurmak. Astra'nın hızlı çözüm sürtünmesizliği, Khanmigo'nun Sokratik disiplini, Synthesis'in mastery gating'i ve Mapify'ın görsel kavram yapılandırması tek platformda, mühendislik/CS derinliğiyle birleştirilir.

### 4.2 Hedef Kullanıcı / Persona
Kendi kendine çalışan mühendislik/CS öğrencisi veya geliştirici. Özellikleri: hızlı geri bildirim ister, eksiğini sayısal olarak ölçmek ister, formül/kod/diyagram arasında sık geçiş yapar, sınav veya proje odaklı çalışır, bazen tarih/coğrafya gibi ezber ağırlıklı dersleri de hızlı kavramsallaştırmak ister.

### 4.3 Fonksiyonel Gereksinimler (Epic'ler)

**Epic 1 — Çoklu-Model Soru Çözüm Motoru**
- User story: Öğrenci fotoğraf/metin ile soru sorar, sistem uygun modeli seçip çözer.
- Kabul kriterleri: OCR doğruluğu kabul edilebilir eşik üstünde; çözüm adımları atomik; final cevap verifier katmanından geçmiş.
- AI kuralı: Direkt final cevap yalnızca kullanıcı talep ederse veya mastery zaten yüksekse verilir.

**Epic 2 — Sokratik Tutor**
- User story: Öğrenci ipucu alarak problemi kendisi çözer.
- Kabul kriterleri: En az 3 kademeli ipucu sistemi; yanlış cevapta adaptif geri dönüş; her adımda anlayış kontrolü.
- AI kuralı: Sokratik soru sorma zorunlu; açıklama oranı kullanıcı seviyesine göre değişir.

**Epic 3 — Mastery & Hata Motoru**
- User story: Öğrenci hangi konularda zayıf olduğunu net görür.
- Kabul kriterleri: Konu/alt konu/önkoşul/hata tipi bazında skor tutulur.
- AI kuralı: Mastery tek oturumdan güncellenmez, çoklu bağımsız kanıt gerekir.

**Epic 4 — FSRS Spaced Repetition**
- User story: Öğrenciye kişiselleştirilmiş tekrar planı sunulur.
- Kabul kriterleri: Her kart difficulty/stability/retrievability değerleriyle takip edilir; hedef hatırlama oranı (örn. %90) ayarlanabilir.
- AI kuralı: Kartlar kısa, tek kavramlı, yanlış örnek içerikli olmalı.

**Epic 5 — Mindmap & Görsel Bilgi Motoru**
- User story: Öğrenci tarih/coğrafya konusunu interaktif mindmap olarak görür ve genişletir.
- Kabul kriterleri: Her düğüm kaynak referansı taşır; dal genişletme RAG'dan beslenir; export PNG/PDF/Markdown destekler.
- AI kuralı: Kaynakta olmayan dal uydurulmaz.

**Epic 6 — Mühendislik/CS Sandbox**
- User story: Öğrenci kod yazar/algoritma çalışır, sistem izole ortamda çalıştırıp debug eder.
- Kabul kriterleri: Kod izole container'da çalışır; Big-O analizi otomatik üretilir; hata önce Sokratik sorularla buldurulmaya çalışılır.
- AI kuralı: Çözüm kodu, kullanıcı en az bir deneme yapmadan verilmez.

**Epic 7 — RAG Doküman Kütüphanesi**
- User story: Öğrenci kendi ders notunu/kitabını yükler, sistem bunlardan yanıt üretir.
- Kabul kriterleri: Chunk + embedding + metadata etiketleme otomatik; bağlam yoksa model "bilmiyorum" der.
- AI kuralı: Yanıt yalnızca alıntılanan bağlama dayanır.

**Epic 8 — Tutor Memory**
- User story: Öğrenci oturumdan çıkıp geri geldiğinde kaldığı yerden devam eder.
- Kabul kriterleri: Tercih, tempo, hedef, zayıf konular kalıcı tutulur.
- AI kuralı: Yeni soru işlenirken önce geçmiş zayıf konular dikkate alınır.

### 4.4 Fonksiyonel Olmayan Gereksinimler

- **Gecikme bütçesi:** Hızlı modda (sınıflandırma, OCR) düşük gecikme hedeflenir; reasoning modunda akış kesilmeden streaming ile cevap üretilir.
- **Token/maliyet optimizasyonu:** Yüksek hacimli görevler ucuz modele (DeepSeek/Gemini Flash-Lite), düşük hacimli kritik görevler güçlü modele yönlendirilir; kullanıcıya şeffaf token sayacı gösterilir.
- **Matematik doğrulama:** Her hesap deterministik araçla çapraz kontrol edilir; birim/sembol tutarlılığı zorunlu.
- **Render standardı:** LaTeX düzgün delimiter ile, Markdown temiz, Mermaid parse edilebilir, mindmap JSON şeması tutarlı.
- **Güvenilirlik:** RAG bağlamı yoksa model "bilinmiyor" der, uydurmaz.
- **Loglama:** Her yanıt için kullanılan model, kaynak, zorluk, hata türü, gecikme süresi kaydedilir (maliyet analizi ve model performans takibi için).
- **Güvenlik:** Kod sandbox izole container'da, kaynak/zaman limitiyle çalışır; kullanıcı verisi (ders notu, yüklenen PDF) yalnızca o kullanıcıya özel RLS (Row Level Security) ile korunur (Supabase'in yerleşik özelliği).

### 4.5 Veri Şeması

**Users:** `id, email, name, target_level, exam_goal, preferred_style, locale, created_at`

**Sessions:** `id, user_id, subject, mode (solver/mapping), model_used, started_at, ended_at, latency_ms, outcome`

**Concepts:** `id, name, subject, prerequisites[], description, source_ref`

**Concept_Mastery:** `user_id, concept_id, mastery_score, confidence, last_practiced_at, streak, review_due_at`

**Error_Log:** `id, user_id, session_id, concept_id, error_type, raw_answer, corrected_answer, severity, created_at`

**SR_Cards (FSRS):** `id, user_id, concept_id, front, back, difficulty, stability, retrievability, reps, lapses, state, due_at, last_review_at`

**Documents (RAG):** `id, owner_id, source_type, title, chunk_text, embedding_vector, concept_tags[], difficulty, checksum`

**Mindmaps:** `id, user_id, subject, source_type (manual/pdf/topic), root_node_json, created_at, updated_at`

**Tutor_Events:** `id, session_id, event_type, payload_json, created_at`

### 4.6 API Endpoint Taslağı

```
POST   /api/ocr/scan              -> görsel yükle, OCR çıktısı al
POST   /api/solve/socratic        -> sokratik adım iste
POST   /api/sandbox/run           -> kod çalıştır, debug yanıtı al
POST   /api/mindmap/generate      -> konu/PDF'den mindmap üret
POST   /api/mindmap/expand        -> belirli dalı genişlet
GET    /api/mastery/dashboard     -> kullanıcı mastery durumu
POST   /api/sr/review             -> flashcard derecelendirme, FSRS güncelleme
GET    /api/sr/due                -> bugün tekrar edilecek kartlar
POST   /api/documents/upload      -> PDF/not yükle, RAG'a indeksle
POST   /api/exam/generate         -> müfredata göre deneme üret
```

### 4.7 UI Bileşenleri (ekran düzeni)

- **Sol panel:** konu haritası + mastery yüzdeleri.
- **Orta panel:** sohbet + adım adım çözüm / mindmap canvas (moda göre değişir).
- **Sağ panel:** kaynaklar, formüller, flashcard önizleme, hata analitiği.
- **Alt panel:** LaTeX render, Mermaid diyagram, kod sandbox çıktısı, devre şeması.

### 4.8 8 Haftalık Geliştirme Yol Haritası (~2 ay)

| Hafta | Odak |
|---|---|
| 1 | Mimari kurulum: Supabase şeması (Bölüm 4.5), Auth, Next.js iskeleti, FastAPI temel servis |
| 2 | OCR pipeline + Snap-to-Solve MVP (Gemini 3 Flash entegrasyonu) |
| 3 | Sokratik solver + model router (DeepSeek + Gemini + Claude orkestrasyon katmanı, Bölüm 3.1) |
| 4 | FSRS spaced repetition motoru + hata loglama + concept mastery şeması |
| 5 | Mindmap generator (Mapping Mode) + Mermaid/LaTeX render katmanı |
| 6 | CS/Algoritma sandbox (izole kod çalıştırma, Big-O analizi, adım izleme) |
| 7 | RAG doküman ingestion (PDF/ders notu) + Supabase pgvector entegrasyonu |
| 8 | Sınav üretici + tutor memory + dashboard birleştirme + maliyet/gecikme optimizasyonu |

### 4.9 Tahmini Token Maliyeti (kaba bütçe)

Kullanıcı başına aylık karma kullanım senaryosu (ör. günde 15-20 etkileşim, çoğu ucuz model ile sınıflandırma/OCR, az sayıda reasoning modeli çağrısı):

- OCR + sınıflandırma + flashcard üretimi (DeepSeek/Gemini Flash-Lite ağırlıklı): düşük maliyetli, ~$0,10-0,40/M token aralığında.
- Reasoning/kod görevleri (Gemini 3.1 Pro / Claude Sonnet 4.6): daha pahalı ama hacmi düşük tutularak toplam maliyet kontrol altında kalır.
- Kesin rakam, gerçek kullanım deseni ölçülmeden verilemez — üretimde her model çağrısının token sayısı loglanıp (Bölüm 4.4 loglama gereksinimi) ilk 2 hafta sonunda gerçek maliyet/kullanıcı hesaplanmalı.

---

## Özet — Sıradaki Somut Adım

1. Supabase şemasını (Bölüm 4.5) doğrudan SQL migration olarak oluştur.
2. Model router'ı (Bölüm 3.1 tablosu) tek bir Python servisi olarak izole et — ileride model değişse bile geri kalan sistem etkilenmesin.
3. MVP'yi Bölüm 2'deki 8 özellikle sınırla; V1 özelliklerini Hafta 8 sonrasına bırak.
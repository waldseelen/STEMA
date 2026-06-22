Önerilen `memory.md` tabanlı hafıza yönetimi mimari bir hatadır. Çok kullanıcılı web uygulamalarında dosya sistemi (I/O) üzerinden state yönetmek darboğaz yaratır ve eşzamanlılık (concurrency) sorunlarına yol açar. DeepSeek ve benzeri modern LLM'lerdeki "Prompt Caching" mekanizması fiziksel bir dosyaya değil, API'ye gönderilen mesaj dizisinin (message array) tam önek (exact prefix) eşleşmesine dayanır. Bu nedenle, sohbet geçmişi ve kullanıcı bağlamı ilişkisel bir veritabanında tutulmalı ve API isteği sırasında JSON formatında derlenerek önbelleklemeyi tetikleyecek şekilde gönderilmelidir.

Sadece vizyon modeline güvenerek OCR ardışık düzenini (pipeline) tamamen devreden çıkarmak, özellikle limit, integral veya matris gibi yoğun indis içeren matematiksel görsellerde halüsinasyon riskini artırır. Modelin doğrudan görüntü okuması tekil sorular için yeterlidir, ancak karmaşık PDF veya kitap sayfalarında doğruluk payı düşer. Vizyon modelinin önüne, görseli yapısal bileşenlere ayıran temel bir görüntü ön işleme (image pre-processing) adımı eklenmelidir.

### Önerilen Teknoloji Yığını (Tech Stack)

* **Framework:** Next.js (App Router) & TypeScript. (Vercel AI SDK entegrasyonu, sunucu tarafı render ve Sokratik akışlar için streaming desteği.)
* **Veritabanı & Vektör Depolama:** Supabase (PostgreSQL + `pgvector`). (Hem ilişkisel kullanıcı/flashcard verilerini hem de RAG mimarisi için vektörleri tek merkezde tutar.)
* **Frontend Bileşenleri:**
* Matematik Render: `KaTeX` (MathJax'ten çok daha hızlıdır, React entegrasyonu için `react-katex`).
* Çizim ve Beyaz Tahta: `@excalidraw/excalidraw` (React kütüphanesi).
* Zihin Haritası (Mindmap): `React Flow`.
* Flashcard Animasyonları: `Framer Motion` (CSS tabanlı 3D çevirme efektleri için).


* **Yapay Zeka:** DeepSeek V4 (Vision ve Reasoning yetenekleri). İlerleyen fazlarda spesifik sınıflandırma görevleri için n8n üzerinden QLoRA ile fine-tune edilmiş açık kaynaklı (Llama 3 vb.) modeller eklenebilir.

---

# STEM Öğrenme Platformu Ürün Gereksinim Belgesi (PRD)

## 1. Pazar ve Rakip Analizi

Standart LLM'ler (ChatGPT, Claude) bilgiyi doğrudan ve tek parça halinde sunarak öğrencinin pasif kalmasına neden olur. STEM eğitiminde bu "ezberci" bir sonuca yol açar.

* **Astra AI / Khanmigo:** Öğrenciye cevabı vermek yerine Sokratik yönlendirme kullanır. Eksiklikleri, karmaşık mühendislik problemlerinde bağlamı kaybetmeleri ve kullanıcıyı statik bir sohbet arayüzüne hapsetmeleridir.
* **Synthesis Tutor:** Derin kavramsal anlama üzerine kuruludur, ancak içerik kısıtlıdır ve kullanıcının kendi materyalini (RAG) eklemesine izin vermez.
* **Bu Platformun Farkı:** "TECHNICS" bilişsel öğrenme prensiplerine dayanarak, tümevarımsal (inductive) bir yaklaşımla, ezbere dayalı (tarih, tıp) veya problem çözme tabanlı (mühendislik) fark etmeksizin; mnemonic'ler, zihin haritaları ve Excalidraw gibi araçları sürece entegre etmesi.

## 2. Çekirdek Özellik ve Fonksiyon Spesifikasyonları

### 2.1. Sokratik Scaffolding (İskelet Oluşturma) Ajanı

* **Açıklama:** Sorunun cevabını doğrudan vermek yerine, çözüm yolunu alt adımlara böler ve öğrenciyi doğru denklemi/kavramı bulmaya yönlendirir.
* **Ajan Davranışı:** Sistem promptunda `temperature: 0.3` ayarlanır. Model, kullanıcı girdisini analiz eder, eksik formülü veya mantık hatasını tespit eder ve "Şu denklemdeki X değişkeni sıfıra yaklaşırken limit ne olur?" şeklinde yönlendirici bir soru sorar.
* **Arayüz:** KaTeX ile eşzamanlı render edilen, matematiksel sembollerin vurgulandığı sohbet akışı.

### 2.2. Feynman Tekniği & Hakem (Evaluator) Modülü

* **Açıklama:** Öğrencinin bir konuyu (örn: Fourier Dönüşümü) kendi kelimeleriyle sisteme anlatması istenir. Hakem ajan, anlatımdaki mantıksal boşlukları ve eksik terminolojiyi bulur.
* **Ajan Davranışı:** Derin düşünme (thinking) token'ları kullanılarak öğrencinin açıklaması referans vektörlerle karşılaştırılır. Model, yalnızca hatalı kısımları izole ederek düzeltici geri bildirim verir ve akılda kalıcılığı artıracak bir "trick" veya mnemoteknik (şifreleme) önerir.

### 2.3. Dinamik Görselleştirme (Mindmap & Excalidraw)

* **Açıklama:** Metin tabanlı açıklamaların kavramsal haritalara dönüşmesi.
* **Ajan Davranışı:** Kullanıcı konunun büyük resmini görmek istediğinde, LLM anında bir JSON/Markdown ağaç yapısı veya Mermaid.js grafiği üretir. Frontend bu veriyi React Flow (Zihin Haritası) veya Excalidraw formatına dönüştürür.

### 2.4. Aralıklı Tekrar (Spaced Repetition) ve Flashcardlar

* **Açıklama:** Hata loglarından otomatik üretilen soru kartları.
* **Akış:** Öğrenci Sokratik ajanda bir soruyu 3 denemede çözemezse, sistem o spesifik alt konuyu (örn: "Kısmi İntegral") hata veritabanına kaydeder. Bir sonraki oturumda CSS/Framer Motion tabanlı flashcard arayüzünde bu kavram karşısına çıkarılır.

## 3. Sistem Mimarisi ve API Entegrasyon Planı

### 3.1. LLM Orkestrasyonu ve Prompt Caching

* **Routing:** Tüm istekler tek bir API route'u (örn: `/api/chat`) üzerinden alınır. Kullanıcının amacı onboarding, quiz üretimi veya mindmap oluşturmak ise düşük `top_k` değerli, hızlı yanıt veren bir alt prompt çalıştırılır. Karmaşık mühendislik sorusu veya Feynman analizi ise DeepSeek V4'ün reasoning özellikleri devreye sokulur.
* **Maliyet Optimizasyonu:** Aynı kullanıcının aynı oturumdaki mesajları, DeepSeek API'sinin prompt caching yeteneğinden faydalanmak için her istekte sistematik bir JSON bloğu olarak gönderilir. Değişmeyen sistem talimatları ve RAG bağlamı önbellekte kalır, giriş maliyetlerini (%50-70) düşürür.

### 3.2. RAG ve Vektör Mimarisi

* **Tümevarımsal (Inductive) Parçalama:** PDF veya ders notları sisteme yüklenirken standart 1000 token'lık parçalara (chunk) bölünmez. Bilişsel modele uygun olarak; tanımlar, teorem kanıtları ve formüller ayrı vektör uzaylarında semantik olarak indekslenir.
* **Hata Logu İndeksleme:** Kullanıcının geçmişte yanıldığı konuların ID'leri vektör metadata'sına eklenir. Benzer bir soru sorulduğunda, RAG sistemi "Bu kullanıcı daha önce bu formülün işaretinde hata yapmıştı" bilgisini LLM'e bağlam olarak iletir.

### 3.3. Multimodal Girdi Süreci

* Öğrenci bir fotoğraf yüklediğinde görüntü DeepSeek V4'ün vizyon API'sine gönderilir. İstek, `thinking` modu aktif edilerek yalnızca görüntünün metne/denkleme dönüştürülmesi görevine atanır (örn: "Fotoğraftaki metni ve matematiği tam olarak LaTeX formatında dökümanlaştır"). Bu çıktı daha sonra ana çözümleme ajanı tarafından kullanılır.

## 4. Tam PRD (Product Requirement Document)

### 4.1. Proje Vizyonu

Geleneksel LLM arayüzlerinin ötesine geçerek, bilişsel psikoloji (Feynman, Aralıklı Tekrar) ilkelerini merkeze alan, kullanıcıyı pasif bilgi tüketicisinden aktif problem çözücüye dönüştüren multimodal bir eğitim aracı inşa etmek.

### 4.2. Onboarding ve Persona

* **Persona:** Bağımsız öğrenen, mühendislik veya zorlu sayısal bilimlerde (matematik, fizik) veya ezber yoğun (tıp, tarih) alanlarda okuyan öğrenciler.
* **Onboarding Akışı:** Ad, bölüm, yaş, ana hedefler (örn: "Vizeye hazırlık", "Kavramsal anlama"). Bu veriler sistem promptunun "Kullanıcı Profili" bloğuna yerleştirilir, böylece ajan metaforları ve anlatım derinliğini bu seviyeye göre ayarlar.

### 4.3. Veritabanı Şeması (Supabase / PostgreSQL)

* `users`: `id`, `name`, `major`, `goals`, `created_at`
* `sessions`: `id`, `user_id`, `topic`, `created_at`
* `messages`: `id`, `session_id`, `role`, `content` (JSONB, KaTeX/Markdown içerir), `is_error` (boolean)
* `flashcards`: `id`, `user_id`, `front_content`, `back_content`, `next_review_date`, `interval`, `ease_factor` (Spaced Repetition SM-2 algoritması için).
* `concept_vectors`: `id`, `content`, `embedding` (pgvector 1536 veya 1024 boyutlu), `metadata` (JSONB, kaynak döküman veya formül tipi).

### 4.4. Fonksiyonel Gereksinimler (Epic'ler)

1. **Epic 1: Multimodal Chat Arayüzü:** KaTeX destekli, görsel yüklenebilen, yanıtların streaming ile aktığı arayüz.
2. **Epic 2: Sokratik Yönlendirme Motoru:** Sistemin doğrudan cevap vermesini engelleyen ve adım adım çözümü dayatan özel prompt enjeksiyonları.
3. **Epic 3: Görsel Araçlar (Visual Tools):** Kullanıcının tek butona basarak mevcut konuşma bağlamını Excalidraw tahtasına veya bir zihin haritasına dönüştürmesi.
4. **Epic 4: Dinamik Flashcardlar:** Yanlış cevaplanan konulardan arka plan (background job) işlemiyle flashcard üretilmesi ve bunların aralıklı tekrar algoritmasına göre listelenmesi.

### 4.5. Fonksiyonel Olmayan Gereksinimler (NFRs)

* **Performans (Latency):** Akıl yürütme (thinking) işlemleri doğası gereği uzun sürer. Kullanıcı deneyimini korumak için TTFB (Time to First Byte) süresi optimize edilmeli ve modelin düşünme süreci UI tarafında iskelet yükleyiciler (skeleton loaders) veya okuma animasyonları ile maskelenmelidir.
* **Maliyet Yönetimi:** DeepSeek V4'ün 1M token giriş $0.45, çıkış $0.87 maliyeti göz önüne alındığında, Sokratik sohbette her döngüde tüm geçmişi göndermek yerine, sadece son N mesaj (örn: `top_k: 5`) ve özetlenmiş RAG verisi gönderilmelidir. Prompt caching zorunludur.
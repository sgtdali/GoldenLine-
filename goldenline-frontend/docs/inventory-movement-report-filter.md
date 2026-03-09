# Envanter Modülü – Hareket Raporu Filtre Kılavuzu

Bu kılavuz, Hareket Raporu sayfasındaki filtre bloğunun arayüz kurallarını tanımlar. Aynı filtre yapısı diğer hareket/rapor ekranlarında da yeniden kullanılabilir.

## Genel Yerleşim

- **Sayfa düzeni:** `p-8 grid h-full min-h-0 grid-rows-[auto_auto_auto_1fr]`.
- **Filtre kartı:** `Card` + `CardContent` (üst boşluk `!pt-6`) ile sayfa başlığının altında yer alır, dış boşluk `mb-8`.
- **Izgara:** `grid gap-4 md:grid-cols-4` – dört kolonlu düzen; küçük ekranlarda tek kolon.

## Tipografi

- **Başlık (sayfa):** `text-2xl font-bold text-slate-900`.
- **Label:** `Label` bileşeni, normal ağırlık; üstünde ayrı başlık yok, alanların hemen üzerinde.
- **Alan içi metin:** `Input` ve `Select` varsayılan `text-sm` temasını kullanır.
- **Butonlar:** `Button` bileşeni; metinler `font-medium`, ikonlu varyantlar `size-4` ikonlarla.

## Form Alanları

- **Tarih girişleri:** `Input type="date"`; değerler ISO formatlı, kenar boşlukları bileşenin varsayılanlarıdır.
- **Seçim alanları:**
  - Malzeme ve personel için `Select` + `SelectTrigger` + `SelectContent`.
  - Tüm seçenekleri için ilk `SelectItem` değeri `all` olarak gelir.
- **Sıralama:** Dört kolon sırası – Başlangıç tarihi, Bitiş tarihi, Malzeme, Personel.
- **Dikey boşluk:** Her alan `space-y-1` ile label–input arasında sıkı boşluk korunur.

## Hareket Türleri Bölümü

- **Başlık:** `Label` ile “Hareket türleri”.
- **Düzen:** `flex flex-wrap gap-2` – büyük/küçük ekranlarda satıra göre kırılır.
- **Buton stilleri:**
  - Aktif tür: `variant="filter"` (dolu görünüm).
  - Pasif tür: `variant="outline"`.
  - Tüm türler aynı boyutta, ikon kullanılmaz; metinler kısadır (“Giriş”, “Çıkış”, “Hurda”, “Kayıp”, “Düzeltme”).
- **Temizle butonu:** Aynı satırda, `variant="outline"`, bekleme durumunda `disabled` (`isLoading`).

## Aralıklar ve İç Boşluklar

- **Kart içi boşluk:** `CardContent` `space-y-4`, üst padding `!pt-6`.
- **Izgara boşlukları:** `gap-4` kolonlar arasında; küçük ekranlarda dikey aralık korunur.
- **Buton aralıkları:** Hareket türü butonları arasında `gap-2`; Temizle butonu aynı boşluk kuralına uyar.

## Renkler ve Durumlar

- **Metin:** Birincil `text-slate-900`; ikincil `text-slate-600`.
- **Buton durumları:** Tema varsayılanları kullanılır; aktif/pasif ayrımı `filter` vs `outline`.
- **Hata/Yükleniyor:** Filtre alanı özel renk kullanmaz; sonuç tablosu içindeki hata/boş durum mesajları ayrı tasarlanır.

## Etkileşim Kuralları

- **Anında çağırma:** Filtre değişiklikleri state’de saklanır; rapor çekimi `useEffect` ile tetiklenir.
- **Temizleme:** `handleClear` ile tüm alanlar başlangıç değerlerine döner ve yeniden sorgu çalışır.
- **Hareket türü seçimi:** Çoklu seçim; butona basıldığında listeye eklenir/çıkarılır (`selectedTypes`).

## Uygulama Notları

- Aynı kılavuzu diğer rapor filtrelerine uygulayın; grid kolon sayısı veri yoğunluğuna göre uyarlanabilir.
- Buton varyantları tutarlı olsun: filtre seçimi için `filter`, ikincil aksiyonlar için `outline`.
- Label–input aralığını `space-y-1`, kart içi aralığı `space-y-4` koruyarak dikey ritmi bozmamaya dikkat edin.

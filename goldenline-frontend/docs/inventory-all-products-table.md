# Envanter Modülü – “Tüm Ürünler” Tablosu Arayüz Kılavuzu

Bu doküman, Envanter modülündeki **Tüm Ürünler** sayfasında kullanılan tablo arayüzünü standartlaştırır. Buradaki kurallar diğer tablo görünümleri için de varsayılan rehber olarak kullanılmalıdır.

## Genel Yapı

- **Sayfa yerleşimi:** `p-8 grid h-full min-h-0 grid-rows-[auto_1fr]`. Tablo, başlık ve filtrelerden sonra tüm kalan alanı kullanır.
- **Tablo kabı:** `min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white inventory-scroll`. İçerik kendi içinde kaydırılır; sayfa dışı scroll kullanılmaz.
- **Tablo bileşeni:** Shadcn `Table` ile `TableHeader` + `TableBody` hiyerarşisi; satırlar `TableRow`, hücreler `TableHead` / `TableCell`.

## Tipografi

- **Font ailesi:** `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji"`.
- **Başlık (h2):** `text-2xl font-bold text-slate-900`.
- **Tablo başlıkları:** `text-sm font-medium text-muted-foreground` (`hsl(var(--muted-foreground))`); yapışkan (`sticky top-0 z-10 bg-white`).
- **Gövde hücreleri:** Varsayılan `text-sm text-slate-700`. Ürün adı `font-semibold text-slate-900`; tedarikçi alt satırı `text-sm text-slate-600`. SKU `font-semibold text-slate-600`.
- **Durum ve sayı rozetleri:** `Badge` tipografisini kullanır; içerikte `font-semibold` metinler sayı vurgusu için uygulanır.

## Alanlar ve Hizalamalar

- **Sütun genişlikleri:** Ürün adı sütunu `w-[25%] min-w-[300px]`; diğerleri otomatik. Son sütun sağa hizalı (`text-right pr-6`).
- **İç boşluklar:** İlk hücreler `pl-6`, son hücre `pr-6`. Tablo kabı kenarları `rounded-lg` + `border`.
- **Satır yastıklamaları:** Varsayılan `TableRow` / `TableCell` padding’leri korunur; satır içi içerikler `gap` kullanır (`flex flex-col gap-1`, rozetlerde `gap-2`).
- **Filtre/ara barı:** Arama girişi `pl-10 pr-10` (ikon ve temizleme alanı), switch grupları `rounded-full border ... px-4 py-1`.

## Renkler ve Durumlar

- **Stok uyarıları (satır arka planı):**
  - Minimum stok altı: `bg-rose-50/70`.
  - Kalibrasyon gecikmiş: `ring-1 ring-amber-200` (satır çevresi).
- **Badge varyantları:**
  - Stok etiketi: `variant="destructive"` min altı için; aksi halde `outline`.
  - Durum etiketi: `destructive` (Min Altı), `secondary` (Kritik/Az Stok), `default bg-green-600` (Stokta Var).
  - Kalibrasyon etiketi: `destructive border-amber-300 bg-amber-100 text-amber-900`.
- **Metin renkleri:** Başlıklar `text-slate-900`; ikincil bilgiler `text-slate-600` / `text-slate-500`; uyarı metinleri `text-amber-900`; hatalar `text-red-600` (sil butonu ikonu).

## Etkileşimler

- **Tablo başlığı yapışkan**; scroll sırasında görünür kalır.
- **Arama temizleme** ikonu `hover:text-slate-600`, temel renk `text-slate-400`.
- **Aksiyonlar:** Satır sonu işlemler `Button variant="ghost" size="sm"` ile ikon-only; düzenleme ikonu normal, silme ikonu `text-red-600`.
- **Yükleme/CSV:** Yönetici aksiyonları üst sağda; `variant="outline"` için ikincil işlem (CSV yükle), düz `Button` için birincil işlem (Ürün Ekle).

## Boş Durum ve İçerik Kuralları

- **Boş tablo:** Tek satır, tüm sütunları kaplar (`colSpan=7`), metin `text-center text-slate-600` ve “Ürün bulunamadı”.
- **Metin biçimleri:** Sayılar yerelde biçimlenir (`toLocaleString('tr-TR')`); eksik değerler için `—` veya `-` kullanılır.
- **Rozet içerikleri:** Stok badge’inde “Stok : X | Zimmet : Y” yapısı, dikey çizgi `text-slate-400`.

## Kart ve Kenar Yarıçapları

- **Genel kart radyusu:** `rounded-lg` (tablo kabı, boşluklu filtre kapsayıcıları).
- **Switch kapsülleri:** `rounded-full` tasarım, ince border (`border-slate-200` veya `border-amber-200`).
- **Badge radyusları:** `Badge` varsayılan yuvarlatma; özel bir değişiklik yoktur.

## Uygulama Prensipleri

- Yeni tablo tasarlarken bu padding, tipografi ve renk kurallarını baz alın.
- Durum rozetleri için aynı renk kodlarını kullanarak anlam tutarlılığı sağlayın.
- İlk sütunu her tabloda sol padding ile başlatın (`pl-6`), son sütunu sağ hizalı bitirin (`pr-6`).
- Kritik satırlarda arka plan veya halka vurgusunu tercih edin; ikonlu aksiyonlar için `ghost` butonlar kullanın.

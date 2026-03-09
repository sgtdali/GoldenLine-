# Kaliphane Yonetimi Modulu - Buton Stilleri Kilavuzu

Bu dokuman, Kaliphane Yonetimi modulu icin buton tiplerini, durumlarini ve boyutlarini tanimlar. Modul icindeki tum aksiyonlar bu kurallara uymali.

## Temel Butonlar

- **Birincil (primary):** `Button` varsayilan; `bg-slate-900 text-white hover:bg-slate-800`.
- **Ikincil (secondary):** `variant="outline"`; `border-slate-200 text-slate-700 hover:bg-slate-50`.
- **Noktasal aksiyon:** `variant="ghost"`; `text-slate-600 hover:text-slate-900 hover:bg-slate-100`.

## Boyutlar

- **Standart:** `size="sm"`; tablo ve liste aksiyonlari.
- **Form aksiyonlari:** Varsayilan boyut; filtre ve detay kartlari.
- **Ikon buton:** `size="icon"` + `h-8 w-8` ile tablo satirlarinda.

## Ikon Kullanimi

- **Sol ikon:** `gap-2` + `size-4` ikonlar (olustur, aktar, yazdir).
- **Tek ikon:** `Button variant="ghost" size="icon"`; silme icin `text-rose-600`.
- **Ikon hizasi:** Metinle ayni hizada, baseline kaymasi olmamali.

## Durumlar

- **Disabled:** `disabled` + `opacity-50` + `cursor-not-allowed`.
- **Loading:** Metin yerine `Spinner` + `gap-2`; buton genisligi sabit kalir.
- **Danger aksiyon:** `bg-rose-600 text-white hover:bg-rose-700` veya `ghost` + `text-rose-600`.

## Yerlesim ve Aralik

- **Aksiyon gruplari:** `flex items-center gap-2` ile dizilir.
- **Sayfa ustu aksiyonlar:** Sag hizali; ikincil + birincil kombinasyonu.
- **Form alt aksiyonlar:** Sol tarafta iptal, sagda kaydet (hizali).

## Uygulama Notlari

- Bir ekranda ayni tip aksiyonlar ayni varyantla sunulmali.
- Silme ve geri donusumu olmayan islemler risk rengi ile isaretlenmeli.
- Buton metinleri kisa ve emir kipinde olmali (Ornek: "Ekle", "Kaydet", "Aktar").

# Kaliphane Yonetimi Modulu - Renk Paleti Kilavuzu

Bu dokuman, Kaliphane Yonetimi modulu icin temel renkleri, yuzeyleri ve durum renklerini tanimlar. Renkler tutarliligi korumak icin burada belirtilen sinirlar dahilinde kullanilmalidir.

## Temel Yuzeyler

- **Arka plan (sayfa):** `bg-slate-50`.
- **Kart/yuzey:** `bg-white` + `border border-slate-200`.
- **Panel vurgusu:** `bg-slate-100` (ikincil bloklar).

## Metin Renkleri

- **Birincil metin:** `text-slate-900`.
- **Ikincil metin:** `text-slate-600`.
- **Yardimci metin:** `text-slate-500`.

## Aksiyon Renkleri

- **Primary:** `bg-slate-900 text-white`.
- **Hover:** `bg-slate-800` (primary), `bg-slate-100` (ghost).
- **Focus ring:** `ring-2 ring-slate-300`.

## Durum Renkleri

- **Basarili:** `bg-emerald-600 text-white`.
- **Uyari:** `bg-amber-100 text-amber-900` + `border-amber-200`.
- **Hata:** `bg-rose-600 text-white` veya `text-rose-600` (ikon).
- **Bilgi:** `bg-sky-100 text-sky-900`.

## Tablo ve Liste Vurgulari

- **Satir hover:** `bg-slate-50`.
- **Secili satir:** `bg-slate-100` + `ring-1 ring-slate-200`.
- **Kritik satir:** `bg-rose-50/70`.

## Uygulama Notlari

- Renk kodlari sabit tutularak moduller arasi gorsel uyum saglanmali.
- Uyari ve hata renkleri sadece anlamli durumlarda kullanilmali, dekoratif amacla kullanilmaz.
- Acik zeminlerde kontrast dusurmemek icin metin renkleri `slate-600` altina inmemeli.

# Kaliphane Yonetimi Modulu - Genel Layout ve Yerlesim Kilavuzu

Bu dokuman, Kaliphane Yonetimi modulu icindeki sayfa iskeleti, grid yapisi ve bosluk kurallarini tanimlar. Tum ekranlar bu layout standardini temel alir.

## Sayfa Iskeleti

- **Ana kapsayici:** `grid h-full min-h-0 grid-cols-[auto_1fr]` (sidebar + icerik).
- **Icerik alani:** `p-8 grid h-full min-h-0 grid-rows-[auto_1fr]`.
- **Baslik bolumu:** `flex items-start justify-between gap-4` (sayfa basligi + aksiyonlar).

## Kart ve Bloklar

- **Kart stili:** `rounded-lg border border-slate-200 bg-white`.
- **Kart araligi:** `space-y-4` veya `gap-4` (grid bloklari).
- **Filtre bloklari:** `Card` + `CardContent` ile ustte, `mb-6` bosluk.

## Grid Kurallari

- **Form gridi:** `grid gap-4 md:grid-cols-4` (kucuk ekranda tek kolon).
- **Iki kolon:** `grid gap-6 md:grid-cols-2` (detay ve ozet panelleri).
- **Tablo alanlari:** `min-h-0 overflow-hidden` ile sayfa icinde kaydirma.

## Bosluk ve Hizalama

- **Yatay padding:** Sayfa genelinde `p-8` (mobilde `p-4`).
- **Dikey ritim:** Basliktan sonra `mb-6`, bloklar arasi `gap-4`.
- **Ic hizalama:** Metinler sol hizali, aksiyonlar sagda.

## Durum ve Mesaj Alanlari

- **Bos durum:** Kart icinde `text-center text-slate-600` + `py-12`.
- **Yukleniyor:** Blok icinde `flex items-center justify-center py-10`.
- **Hata mesaji:** `text-rose-600` + ikonlu kisa aciklama.

## Uygulama Notlari

- Sayfa icerigi `min-h-0` ile container icinde akmalidir; body scroll minimumda tutulur.
- Header ve tablo gibi sabit bolumler icin `grid-rows-[auto_1fr]` kullanilir.
- Mobilde sidebar gizlenir; icerik `p-4` ile yeniden hizalanir.

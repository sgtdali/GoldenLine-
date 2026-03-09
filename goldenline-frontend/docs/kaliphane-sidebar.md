# Kaliphane Yonetimi Modulu - Sidebar Arayuz Kilavuzu

Bu dokuman, Kaliphane Yonetimi modulu icin sol sidebar kurallarini standartlastirir. Navigasyon, rozetler ve durumlar burada tanimlanan yapiya uymali.

## Genel Yerlesim

- **Konteyner:** `w-64 min-w-[16rem] h-full border-r border-slate-200 bg-white`.
- **Icerik akisi:** `flex flex-col` + `gap-4`; ust bolum (logo/modul), orta bolum (linkler), alt bolum (kullanici/ayarlar).
- **Scroll davranisi:** Menu listesi `min-h-0 overflow-y-auto` ile kendi icinde kayar.

## Tipografi

- **Modul basligi:** `text-sm font-semibold uppercase tracking-wide text-slate-500`.
- **Link metni:** `text-sm font-medium text-slate-700`.
- **Ikincil metin:** `text-xs text-slate-500` (alt aciklama veya sayaclar).

## Navigasyon Ogeleri

- **Link kapsul:** `flex items-center gap-3 rounded-md px-3 py-2`.
- **Aktif link:** `bg-slate-900 text-white` + ikon `text-white`.
- **Pasif link:** `hover:bg-slate-100 hover:text-slate-900`.
- **Alt seviye linkler:** `pl-10 text-slate-600` + daha kucuk metin (`text-xs`).

## Rozetler ve Durumlar

- **Sayac rozeti:** `ml-auto text-xs font-semibold rounded-full px-2 py-0.5 bg-slate-100 text-slate-700`.
- **Uyari rozeti:** `bg-rose-100 text-rose-700`.
- **Aktif grup vurgusu:** Grup basliginda `text-slate-900` + ince sol cizgi `border-l-2 border-slate-900`.

## Etkilesimler

- **Hover:** Link yuzeyi `hover:bg-slate-100` ile belirginlesir.
- **Focus:** Klavye erisiminde `focus-visible:ring-2 focus-visible:ring-slate-400`.
- **Collapsed durum (opsiyonel):** `w-16` icin ikon-only; tooltip ile metin desteklenir.

## Uygulama Notlari

- Sol bosluklar ve ikon-metni araligi sabit kalmali (`gap-3`).
- Aktif/pasif ayrimi renk ve arka planla net olmali, sadece ikon degistirmeyin.
- Sidebar her sayfada ayni yukseklikte ve border ile ayrilmis gorunmeli.

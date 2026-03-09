# Build Gecis Notlari

Bu dosya, dev ortamindan build/production ortamina gecis icin degistirilmesi veya kontrol edilmesi gereken noktalarin kisa listesidir.

## Veritabani

- **DB yolu (varsayilan):** `MontajUI.Desktop/App.xaml.cs` icindeki `DefaultDatabasePath` su an `\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\MontajUI\app.db`.
- **Ortam degiskeni:** `MONTAJUI_DB_PATH` ile production DB yolunu ayarlayin.
- **Z: surucu kontrolu:** `App.xaml.cs` Z: yoksa fallback veriyor; production icin Z: map/UNC yol dogrulayin.

## Lojistik Foto Klasoru

- **UNC yol:** `MontajUI.Desktop/Services/MediaService.cs` icinde `ShipmentPhotosRoot` sabit:
  - `\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\MontajUI\Shipment_Photos`
- Production'da gerekiyorsa bu yolu config/ENV ile ayri hale getirin.

## Takimhane Urun Gorselleri

- **UNC yol:** `MontajUI.Desktop/Services/EquipmentImageService.cs` icinde `DefaultImageRoot` su an:
  - `\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\MontajUI\Takımhane_Resimler`
- **Override:** `MONTAJUI_EQUIPMENT_IMAGE_ROOT` ile production yolu ayarlanabilir.

## Bridge ve HTTP Fallback

- `montajui-frontend/src/api/bridge.ts` sadece **dev** ortamda HTTP fallback kullanir.
- Production build icin desktop app (WebView2 + Bridge) gerekiyor. Aksi halde lojistik ve diger native islevler calismaz.

## Migration

- Uygulama acilisinda `context.Database.Migrate()` calisir.
- Yeni tablolar (lojistik) icin bu migration'in production DB'de calistigini dogrulayin.

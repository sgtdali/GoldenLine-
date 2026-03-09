using System.IO;

namespace GoldenLine.Desktop.Services;

public class EquipmentImageService
{
    private const string DefaultImageRoot = @"\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\GoldenLine\TakÄ±mhane_Resimler";
    private static readonly string[] AllowedExtensions = { ".png", ".jpg", ".jpeg" };

    public async Task<EquipmentImageResult?> GetEquipmentImageAsync(string sku)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            return null;
        }

        var normalizedSku = sku.Trim();

        var imageRoot = ResolveImageRoot();

        foreach (var ext in AllowedExtensions)
        {
            var path = Path.Combine(imageRoot, $"{normalizedSku}{ext}");
            if (!File.Exists(path))
            {
                continue;
            }

            var bytes = await File.ReadAllBytesAsync(path);
            var contentType = ext switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            var base64 = Convert.ToBase64String(bytes);
            var dataUrl = $"data:{contentType};base64,{base64}";

            return new EquipmentImageResult
            {
                DataUrl = dataUrl,
                FileName = Path.GetFileName(path),
                ContentType = contentType
            };
        }

        return null;
    }

    private static string ResolveImageRoot()
    {
        var overridePath = Environment.GetEnvironmentVariable("GoldenLine_EQUIPMENT_IMAGE_ROOT");
        return string.IsNullOrWhiteSpace(overridePath) ? DefaultImageRoot : overridePath;
    }
}

public class EquipmentImageResult
{
    public string DataUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}


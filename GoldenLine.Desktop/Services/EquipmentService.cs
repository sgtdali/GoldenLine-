using System.Globalization;
using System.IO;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class EquipmentService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;
    private readonly ICalibrationService _calibrationService;

    public EquipmentService()
        : this(App.DbOptions, new CalibrationService())
    {
    }

    public EquipmentService(DbContextOptions<AppDbContext> dbOptions, ICalibrationService calibrationService)
    {
        _dbOptions = dbOptions;
        _calibrationService = calibrationService;
    }

    public async Task<EquipmentImportResult> ImportFromCsvAsync(string csvContent)
    {
        if (string.IsNullOrWhiteSpace(csvContent))
        {
            throw new InvalidOperationException("CSV content cannot be empty.");
        }

        using var reader = new StringReader(csvContent);
        var header = reader.ReadLine();
        if (header == null)
        {
            throw new InvalidOperationException("CSV content has no header row.");
        }

        var culture = CultureInfo.GetCultureInfo("tr-TR");

        await using var context = new AppDbContext(_dbOptions);
        var existingItems = await context.EquipmentItems.ToDictionaryAsync(item => item.KalemNo);

        var inserted = 0;
        var updated = 0;
        var lineNumber = 1;
        var errors = new List<string>();

        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var columns = line.Split(';').Select(c => c.Trim()).ToArray();
            if (columns.Length < 14)
            {
                errors.Add($"Line {lineNumber}: expected at least 14 columns, found {columns.Length}.");
                continue;
            }

            try
            {
                var parsed = EquipmentImportHelpers.ParseEquipmentCsvRow(columns, culture);
                if (existingItems.TryGetValue(parsed.KalemNo, out var existing))
                {
                    EquipmentImportHelpers.ApplyCsvData(existing, parsed);
                    updated++;
                }
                else
                {
                    parsed.Durum = "aktif";
                    await context.EquipmentItems.AddAsync(parsed);
                    existingItems[parsed.KalemNo] = parsed;
                    inserted++;
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Line {lineNumber}: {ex.Message}");
            }
        }

        await context.SaveChangesAsync();

        return new EquipmentImportResult
        {
            Inserted = inserted,
            Updated = updated,
            Errors = errors
        };
    }

    public async Task<List<EquipmentItem>> GetEquipmentItemsAsync()
    {
        await using var context = new AppDbContext(_dbOptions);
        var items = await context.EquipmentItems
            .OrderBy(item => item.KalemNo)
            .ToListAsync();

        foreach (var item in items)
        {
            item.CalibrationStatus = _calibrationService.GetCalibrationStatus(item);
        }

        return items;
    }

    public async Task<EquipmentItem?> GetEquipmentItemAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);
        var item = await context.EquipmentItems.FindAsync(id);
        if (item == null)
        {
            return null;
        }

        item.CalibrationStatus = _calibrationService.GetCalibrationStatus(item);
        return item;
    }

    public async Task<EquipmentItem> CreateEquipmentItemAsync(EquipmentItemRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        Supplier? supplier = null;
        if (request.SupplierId.HasValue)
        {
            supplier = await context.Suppliers.FindAsync(request.SupplierId.Value);
            if (supplier == null)
            {
                throw new InvalidOperationException($"Supplier not found: {request.SupplierId.Value}");
            }
        }

        var newItem = new EquipmentItem
        {
            KalemNo = request.KalemNo.Trim(),
            KalemTanim = request.KalemTanim.Trim(),
            OlcuAciklama = request.OlcuAciklama.Trim(),
            UreticiKodu = request.UreticiKodu?.Trim(),
            UreticiKodu2 = request.UreticiKodu2?.Trim(),
            Tedarikci = request.Tedarikci?.Trim() ?? supplier?.Name,
            SupplierId = request.SupplierId,
            AnaGrup = request.AnaGrup?.Trim(),
            AraGrup = request.AraGrup?.Trim(),
            AltGrup = request.AltGrup?.Trim(),
            Durum = request.Durum.Trim(),
            Lokasyon = request.Lokasyon?.Trim(),
            Stok = request.Stok,
            MinStock = request.MinStock,
            IsCalibrationRequired = request.IsCalibrationRequired,
            LastCalibrationDate = request.LastCalibrationDate,
            CalibrationIntervalDays = request.CalibrationIntervalDays,
            SonKullanimTarihi = request.SonKullanimTarihi,
            SayimTarihi = request.SayimTarihi,
            Fiyat = request.Fiyat
        };

        context.EquipmentItems.Add(newItem);
        await context.SaveChangesAsync();

        newItem.CalibrationStatus = _calibrationService.GetCalibrationStatus(newItem);
        return newItem;
    }

    public async Task UpdateEquipmentItemAsync(int id, EquipmentItemRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var existing = await context.EquipmentItems.FindAsync(id);
        if (existing == null)
        {
            throw new InvalidOperationException("Equipment item not found.");
        }

        Supplier? supplier = null;
        if (request.SupplierId.HasValue)
        {
            supplier = await context.Suppliers.FindAsync(request.SupplierId.Value);
            if (supplier == null)
            {
                throw new InvalidOperationException($"Supplier not found: {request.SupplierId.Value}");
            }
        }

        existing.KalemNo = request.KalemNo.Trim();
        existing.KalemTanim = request.KalemTanim.Trim();
        existing.OlcuAciklama = request.OlcuAciklama.Trim();
        existing.UreticiKodu = request.UreticiKodu?.Trim();
        existing.UreticiKodu2 = request.UreticiKodu2?.Trim();
        existing.Tedarikci = request.Tedarikci?.Trim() ?? supplier?.Name;
        existing.SupplierId = request.SupplierId;
        existing.AnaGrup = request.AnaGrup?.Trim();
        existing.AraGrup = request.AraGrup?.Trim();
        existing.AltGrup = request.AltGrup?.Trim();
        existing.Durum = request.Durum.Trim();
        existing.Lokasyon = request.Lokasyon?.Trim();
        existing.Stok = request.Stok;
        existing.MinStock = request.MinStock;
        existing.IsCalibrationRequired = request.IsCalibrationRequired;
        existing.LastCalibrationDate = request.LastCalibrationDate;
        existing.CalibrationIntervalDays = request.CalibrationIntervalDays;
        existing.SonKullanimTarihi = request.SonKullanimTarihi;
        existing.SayimTarihi = request.SayimTarihi;
        existing.Fiyat = request.Fiyat;

        await context.SaveChangesAsync();
    }

    public async Task DeleteEquipmentItemAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var existing = await context.EquipmentItems.FindAsync(id);
        if (existing == null)
        {
            throw new InvalidOperationException("Equipment item not found.");
        }

        context.EquipmentItems.Remove(existing);
        await context.SaveChangesAsync();
    }

    private static void ValidateRequest(EquipmentItemRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request is required.");
        }
    }
}

public class EquipmentItemRequest
{
    public string KalemNo { get; set; } = string.Empty;
    public string KalemTanim { get; set; } = string.Empty;
    public string OlcuAciklama { get; set; } = string.Empty;
    public string? UreticiKodu { get; set; }
    public string? UreticiKodu2 { get; set; }
    public string? Tedarikci { get; set; }
    public int? SupplierId { get; set; }
    public string? AnaGrup { get; set; }
    public string? AraGrup { get; set; }
    public string? AltGrup { get; set; }
    public string Durum { get; set; } = "aktif";
    public string? Lokasyon { get; set; }
    public int Stok { get; set; }
    public int? MinStock { get; set; }
    public bool IsCalibrationRequired { get; set; }
    public DateTime? LastCalibrationDate { get; set; }
    public int? CalibrationIntervalDays { get; set; }
    public DateTime? SonKullanimTarihi { get; set; }
    public DateTime? SayimTarihi { get; set; }
    public decimal? Fiyat { get; set; }
}

public class EquipmentImportResult
{
    public int Inserted { get; set; }
    public int Updated { get; set; }
    public List<string> Errors { get; set; } = new();
}

internal static class EquipmentImportHelpers
{
    internal static EquipmentItem ParseEquipmentCsvRow(string[] columns, CultureInfo culture)
    {
        string GetValue(int index) => index >= 0 && index < columns.Length ? columns[index] : string.Empty;

        var baseIndex = columns.Length >= 14 ? 1 : 0;
        var kalemNoIndex = baseIndex + 1;
        var kalemTanimIndex = baseIndex + 2;
        var olcuAciklamaIndex = baseIndex + 3;
        var expectedMinColumns = baseIndex + 13;

        if (columns.Length < expectedMinColumns)
        {
            throw new InvalidOperationException($"Expected at least {expectedMinColumns} columns, found {columns.Length}.");
        }

        if (string.IsNullOrWhiteSpace(GetValue(kalemNoIndex)))
        {
            throw new InvalidOperationException("Kalem No cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(GetValue(kalemTanimIndex)))
        {
            throw new InvalidOperationException("Kalem Tanim cannot be empty.");
        }

        var item = new EquipmentItem
        {
            UreticiKodu = NullIfEmpty(GetValue(baseIndex + 0)),
            KalemNo = GetValue(kalemNoIndex),
            KalemTanim = GetValue(kalemTanimIndex),
            OlcuAciklama = string.IsNullOrWhiteSpace(GetValue(olcuAciklamaIndex)) ? "-" : GetValue(olcuAciklamaIndex),
            UreticiKodu2 = NullIfEmpty(GetValue(baseIndex + 4)),
            Tedarikci = NullIfEmpty(GetValue(baseIndex + 5)),
            Fiyat = ParseDecimal(GetValue(baseIndex + 6), culture),
            AnaGrup = NullIfEmpty(GetValue(baseIndex + 7)),
            AraGrup = NullIfEmpty(GetValue(baseIndex + 8)),
            AltGrup = NullIfEmpty(GetValue(baseIndex + 9)),
            Lokasyon = NullIfEmpty(GetValue(baseIndex + 10)),
            SayimTarihi = ParseDate(GetValue(baseIndex + 11), culture),
            Stok = ParseInt(GetValue(baseIndex + 12)),
        };

        return item;
    }

    internal static void ApplyCsvData(EquipmentItem target, EquipmentItem source)
    {
        target.UreticiKodu = source.UreticiKodu;
        target.KalemNo = source.KalemNo;
        target.KalemTanim = source.KalemTanim;
        target.OlcuAciklama = source.OlcuAciklama;
        target.UreticiKodu2 = source.UreticiKodu2;
        target.Tedarikci = source.Tedarikci;
        target.AnaGrup = source.AnaGrup;
        target.AraGrup = source.AraGrup;
        target.AltGrup = source.AltGrup;
        target.Lokasyon = source.Lokasyon;
        target.SayimTarihi = source.SayimTarihi;
        target.Stok = source.Stok;
        target.Fiyat = source.Fiyat;
    }

    private static int ParseInt(string value)
    {
        if (int.TryParse(value, out var result))
        {
            return result;
        }
        return 0;
    }

    private static decimal? ParseDecimal(string value, CultureInfo culture)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (decimal.TryParse(value, NumberStyles.Any, culture, out var result))
        {
            return result;
        }

        if (decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out result))
        {
            return result;
        }

        return null;
    }

    private static DateTime? ParseDate(string value, CultureInfo culture)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var formats = new[]
        {
            "d.M.yyyy",
            "dd.MM.yyyy",
            "d.MM.yyyy",
            "dd.M.yyyy",
            "yyyy-MM-dd"
        };

        if (DateTime.TryParseExact(value, formats, culture, DateTimeStyles.None, out var date))
        {
            return date;
        }

        if (DateTime.TryParse(value, culture, DateTimeStyles.None, out date))
        {
            return date;
        }

        return null;
    }

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value;
}


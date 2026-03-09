using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class SupplierService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public SupplierService()
        : this(App.DbOptions)
    {
    }

    public SupplierService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<Supplier>> GetSuppliersAsync(bool includeInactive = false)
    {
        await using var context = new AppDbContext(_dbOptions);

        var query = context.Suppliers.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        return await query
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<Supplier> CreateSupplierAsync(SupplierRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var normalizedName = request.Name.Trim();
        var exists = await context.Suppliers.AnyAsync(s => s.Name == normalizedName);
        if (exists)
        {
            throw new InvalidOperationException("Supplier already exists with this name.");
        }

        var supplier = new Supplier
        {
            Name = normalizedName,
            ContactName = request.ContactName?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Address = request.Address?.Trim(),
            Notes = request.Notes?.Trim(),
            IsActive = request.IsActive
        };

        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        return supplier;
    }

    public async Task UpdateSupplierAsync(int id, SupplierRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var supplier = await context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            throw new InvalidOperationException("Supplier not found.");
        }

        supplier.Name = request.Name.Trim();
        supplier.ContactName = request.ContactName?.Trim();
        supplier.Phone = request.Phone?.Trim();
        supplier.Email = request.Email?.Trim();
        supplier.Address = request.Address?.Trim();
        supplier.Notes = request.Notes?.Trim();
        supplier.IsActive = request.IsActive;

        await context.SaveChangesAsync();
    }

    public async Task DeleteSupplierAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var supplier = await context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            throw new InvalidOperationException("Supplier not found.");
        }

        context.Suppliers.Remove(supplier);
        await context.SaveChangesAsync();
    }

    private static void ValidateRequest(SupplierRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request is required.");
        }

        var validationContext = new ValidationContext(request);
        Validator.ValidateObject(request, validationContext, validateAllProperties: true);
    }
}

public class SupplierRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ContactName { get; set; }

    [MaxLength(120)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(400)]
    public string? Address { get; set; }

    [MaxLength(4000)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;
}


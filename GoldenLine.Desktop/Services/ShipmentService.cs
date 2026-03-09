using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class ShipmentService
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "planned",
        "in-transit",
        "delivered",
    };

    private static readonly HashSet<string> ValidTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "land",
        "air",
        "sea",
    };

    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public ShipmentService()
        : this(App.DbOptions)
    {
    }

    public ShipmentService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<ShipmentDto>> GetShipmentsAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        var shipments = await context.Shipments
            .AsNoTracking()
            .Include(s => s.Project)
            .OrderByDescending(s => s.ShipmentId)
            .ToListAsync();

        return shipments.Select(Map).ToList();
    }

    public async Task<ShipmentDto> CreateShipmentAsync(ShipmentCreateRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var project = await context.Projects.FindAsync(request.ProjectId);
        if (project == null)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var status = NormalizeStatus(request.Status);
        var shipmentType = NormalizeType(request.ShipmentType);
        var code = string.IsNullOrWhiteSpace(request.Code)
            ? $"SHP-{DateTime.UtcNow:yyyyMMddHHmmss}"
            : request.Code.Trim();

        var shipment = new Shipment
        {
            Name = request.Name.Trim(),
            Code = code,
            Destination = request.Destination.Trim(),
            Status = status,
            ShipmentType = shipmentType,
            ProjectId = project.ProjeID,
        };

        context.Shipments.Add(shipment);
        await context.SaveChangesAsync();

        shipment.Project = project;
        return Map(shipment);
    }

    public async Task<ShipmentDto> UpdateShipmentAsync(int id, ShipmentUpdateRequest request)
    {
        await using var context = new AppDbContext(_dbOptions);

        var shipment = await context.Shipments
            .Include(s => s.Project)
            .FirstOrDefaultAsync(s => s.ShipmentId == id);

        if (shipment == null)
        {
            throw new InvalidOperationException("Shipment not found.");
        }

        if (request.Name != null) shipment.Name = request.Name.Trim();
        if (request.Code != null) shipment.Code = request.Code.Trim();
        if (request.Destination != null) shipment.Destination = request.Destination.Trim();
        if (request.Status != null) shipment.Status = NormalizeStatus(request.Status);
        if (request.ShipmentType != null) shipment.ShipmentType = NormalizeType(request.ShipmentType);
        if (request.ProjectId.HasValue && request.ProjectId.Value > 0)
        {
            var project = await context.Projects.FindAsync(request.ProjectId.Value);
            if (project != null)
            {
                shipment.ProjectId = project.ProjeID;
                shipment.Project = project;
            }
        }

        await context.SaveChangesAsync();
        return Map(shipment);
    }

    private static ShipmentDto Map(Shipment shipment)
    {
        return new ShipmentDto
        {
            ShipmentId = shipment.ShipmentId,
            Name = shipment.Name,
            Code = shipment.Code,
            Destination = shipment.Destination,
            Status = shipment.Status,
            ShipmentType = shipment.ShipmentType,
            ProjectId = shipment.ProjectId,
            ProjectName = shipment.Project?.ProjeAdi
        };
    }

    private static void ValidateRequest(ShipmentCreateRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request is required.");
        }

        var validationContext = new ValidationContext(request);
        Validator.ValidateObject(request, validationContext, validateAllProperties: true);
    }

    private static string NormalizeStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "planned";
        }

        var trimmed = value.Trim().ToLowerInvariant();
        return ValidStatuses.Contains(trimmed) ? trimmed : "planned";
    }

    private static string NormalizeType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "land";
        }

        var trimmed = value.Trim().ToLowerInvariant();
        return ValidTypes.Contains(trimmed) ? trimmed : "land";
    }
}

public class ShipmentCreateRequest
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(200)]
    public string Destination { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Status { get; set; }

    [MaxLength(20)]
    public string? ShipmentType { get; set; }

    [Range(1, int.MaxValue)]
    public int ProjectId { get; set; }
}

public class ShipmentUpdateRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Destination { get; set; }
    public string? Status { get; set; }
    public string? ShipmentType { get; set; }
    public int? ProjectId { get; set; }
}

public class ShipmentDto
{
    public int ShipmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string Destination { get; set; } = string.Empty;
    public string Status { get; set; } = "planned";
    public string ShipmentType { get; set; } = "land";
    public int ProjectId { get; set; }
    public string? ProjectName { get; set; }
}


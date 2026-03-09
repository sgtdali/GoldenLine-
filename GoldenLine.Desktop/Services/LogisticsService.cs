using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class LogisticsService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public LogisticsService()
        : this(App.DbOptions)
    {
    }

    public LogisticsService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<LogisticsStateDto> GetLogisticsStateAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        var products = await context.LogisticsProducts
            .AsNoTracking()
            .ToListAsync();

        var crates = await context.LogisticsCrates
            .AsNoTracking()
            .ToListAsync();

        var crateItems = await context.LogisticsCrateItems
            .AsNoTracking()
            .ToListAsync();

        var containers = await context.LogisticsContainers
            .AsNoTracking()
            .ToListAsync();

        var productLookup = products.ToDictionary(p => p.ProductId, MapProduct);
        var contentsLookup = crateItems
            .GroupBy(item => item.CrateId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(item => productLookup.TryGetValue(item.ProductId, out var product) ? product : null)
                    .Where(product => product != null)
                    .Select(product => product!)
                    .ToList()
            );

        var crateDtos = crates.Select(crate =>
        {
            contentsLookup.TryGetValue(crate.CrateId, out var contents);
            return MapCrate(crate, contents ?? new List<LogisticsProductDto>());
        }).ToList();

        return new LogisticsStateDto
        {
            Products = productLookup.Values.ToList(),
            Crates = crateDtos,
            Containers = containers.Select(MapContainer).ToList()
        };
    }

    public async Task<LogisticsProductDto> CreateLogisticsProductAsync(LogisticsProductCreateRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var exists = await context.LogisticsProducts.AnyAsync(p => p.ProductId == request.Id);
        if (exists)
        {
            throw new InvalidOperationException("Product already exists.");
        }

        await EnsureProjectExists(context, request.ProjectId);
        if (request.LineProjectId.HasValue)
        {
            await EnsureProjectExists(context, request.LineProjectId.Value);
        }

        var entity = new LogisticsProduct
        {
            ProductId = request.Id.Trim(),
            Name = request.Name.Trim(),
            Length = request.Dimensions.Length,
            Width = request.Dimensions.Width,
            Height = request.Dimensions.Height,
            Weight = request.Weight,
            Color = request.Color ?? string.Empty,
            ProjectId = request.ProjectId,
            LineProjectId = request.LineProjectId
        };

        context.LogisticsProducts.Add(entity);
        await context.SaveChangesAsync();

        return MapProduct(entity);
    }

    public async Task<List<LogisticsProductDto>> CreateLogisticsProductsAsync(List<LogisticsProductCreateRequest> requests)
    {
        if (requests == null || requests.Count == 0)
        {
            throw new InvalidOperationException("Product list is required.");
        }

        await using var context = new AppDbContext(_dbOptions);

        foreach (var request in requests)
        {
            ValidateRequest(request);
            await EnsureProjectExists(context, request.ProjectId);
            if (request.LineProjectId.HasValue)
            {
                await EnsureProjectExists(context, request.LineProjectId.Value);
            }
        }

        var ids = requests.Select(r => r.Id).ToList();
        var existing = await context.LogisticsProducts.AnyAsync(p => ids.Contains(p.ProductId));
        if (existing)
        {
            throw new InvalidOperationException("One or more products already exist.");
        }

        var entities = requests.Select(request => new LogisticsProduct
        {
            ProductId = request.Id.Trim(),
            Name = request.Name.Trim(),
            Length = request.Dimensions.Length,
            Width = request.Dimensions.Width,
            Height = request.Dimensions.Height,
            Weight = request.Weight,
            Color = request.Color ?? string.Empty,
            ProjectId = request.ProjectId,
            LineProjectId = request.LineProjectId
        }).ToList();

        context.LogisticsProducts.AddRange(entities);
        await context.SaveChangesAsync();

        return entities.Select(MapProduct).ToList();
    }

    public async Task<LogisticsProductDto> UpdateLogisticsProductAsync(string id, LogisticsProductUpdateRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var entity = await context.LogisticsProducts.FirstOrDefaultAsync(p => p.ProductId == id);
        if (entity == null)
        {
            throw new InvalidOperationException("Product not found.");
        }

        await EnsureProjectExists(context, request.ProjectId);
        if (request.LineProjectId.HasValue)
        {
            await EnsureProjectExists(context, request.LineProjectId.Value);
        }

        entity.Name = request.Name.Trim();
        entity.Length = request.Dimensions.Length;
        entity.Width = request.Dimensions.Width;
        entity.Height = request.Dimensions.Height;
        entity.Weight = request.Weight;
        entity.Color = request.Color ?? string.Empty;
        entity.ProjectId = request.ProjectId;
        entity.LineProjectId = request.LineProjectId;

        await context.SaveChangesAsync();
        return MapProduct(entity);
    }

    public async Task DeleteLogisticsProductAsync(string id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var entity = await context.LogisticsProducts.FirstOrDefaultAsync(p => p.ProductId == id);
        if (entity == null)
        {
            return;
        }

        context.LogisticsProducts.Remove(entity);
        await context.SaveChangesAsync();
    }

    public async Task<LogisticsCrateDto> CreateCrateAsync(LogisticsCrateCreateRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var exists = await context.LogisticsCrates.AnyAsync(c => c.CrateId == request.Id);
        if (exists)
        {
            throw new InvalidOperationException("Crate already exists.");
        }

        await EnsureProjectExists(context, request.ProjectId);
        if (request.LineProjectId.HasValue)
        {
            await EnsureProjectExists(context, request.LineProjectId.Value);
        }

        var crate = new LogisticsCrate
        {
            CrateId = request.Id.Trim(),
            Name = request.Name.Trim(),
            Length = request.Dimensions.Length,
            Width = request.Dimensions.Width,
            Height = request.Dimensions.Height,
            WeightCapacity = request.WeightCapacity,
            ProjectId = request.ProjectId,
            LineProjectId = request.LineProjectId,
            ShipmentId = request.ShipmentId,
            ContainerId = request.ContainerId,
            Status = request.Status ?? "staged",
            PositionX = request.Position?.X ?? 0,
            PositionY = request.Position?.Y ?? 0,
            Rotation = request.Position?.Rotation ?? 0,
        };

        context.LogisticsCrates.Add(crate);

        var productIds = request.ProductIds ?? new List<string>();
        if (productIds.Count > 0)
        {
            var items = productIds.Select(productId => new LogisticsCrateItem
            {
                CrateId = crate.CrateId,
                ProductId = productId,
                Quantity = 1
            }).ToList();
            context.LogisticsCrateItems.AddRange(items);
        }

        await context.SaveChangesAsync();

        var products = await context.LogisticsProducts
            .AsNoTracking()
            .Where(p => productIds.Contains(p.ProductId))
            .ToListAsync();

        return MapCrate(crate, products.Select(MapProduct).ToList());
    }

    public async Task<LogisticsCrateDto> UpdateCrateAsync(string id, LogisticsCrateUpdateRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request is required.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var crate = await context.LogisticsCrates.FirstOrDefaultAsync(c => c.CrateId == id);
        if (crate == null)
        {
            throw new InvalidOperationException("Crate not found.");
        }

        if (request.SetContainerId == true)
        {
            crate.ContainerId = request.ContainerId;
        }

        if (request.SetShipmentId == true)
        {
            crate.ShipmentId = request.ShipmentId;
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            crate.Status = request.Status.Trim();
        }

        if (request.Position != null)
        {
            crate.PositionX = request.Position.X;
            crate.PositionY = request.Position.Y;
            crate.Rotation = request.Position.Rotation;
        }

        await context.SaveChangesAsync();

        var products = await LoadCrateProductsAsync(context, crate.CrateId);
        return MapCrate(crate, products);
    }

    public async Task DeleteCrateAsync(string id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var crate = await context.LogisticsCrates.FirstOrDefaultAsync(c => c.CrateId == id);
        if (crate == null)
        {
            return;
        }

        context.LogisticsCrates.Remove(crate);
        await context.SaveChangesAsync();
    }

    public async Task<LogisticsContainerDto> CreateContainerAsync(LogisticsContainerCreateRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var exists = await context.LogisticsContainers.AnyAsync(c => c.ContainerId == request.Id);
        if (exists)
        {
            throw new InvalidOperationException("Container already exists.");
        }

        var container = new LogisticsContainer
        {
            ContainerId = request.Id.Trim(),
            Name = request.Name.Trim(),
            Type = request.Type.Trim(),
            Length = request.Dimensions.Length,
            Width = request.Dimensions.Width,
            Height = request.Dimensions.Height,
            MaxWeight = request.MaxWeight,
            ShipmentId = request.ShipmentId
        };

        context.LogisticsContainers.Add(container);
        await context.SaveChangesAsync();

        return MapContainer(container);
    }

    public async Task DeleteContainerAsync(string id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var container = await context.LogisticsContainers.FirstOrDefaultAsync(c => c.ContainerId == id);
        if (container == null)
        {
            return;
        }

        context.LogisticsContainers.Remove(container);
        await context.SaveChangesAsync();
    }

    private static LogisticsProductDto MapProduct(LogisticsProduct product)
    {
        return new LogisticsProductDto
        {
            Id = product.ProductId,
            Name = product.Name,
            Dimensions = new DimensionsDto
            {
                Length = product.Length,
                Width = product.Width,
                Height = product.Height
            },
            Weight = product.Weight,
            Color = product.Color,
            ProjectId = product.ProjectId,
            LineProjectId = product.LineProjectId
        };
    }

    private static LogisticsCrateDto MapCrate(LogisticsCrate crate, List<LogisticsProductDto> contents)
    {
        return new LogisticsCrateDto
        {
            Id = crate.CrateId,
            Name = crate.Name,
            Dimensions = new DimensionsDto
            {
                Length = crate.Length,
                Width = crate.Width,
                Height = crate.Height
            },
            WeightCapacity = crate.WeightCapacity,
            Contents = contents,
            ContainerId = crate.ContainerId,
            ShipmentId = crate.ShipmentId,
            LineProjectId = crate.LineProjectId,
            ProjectId = crate.ProjectId,
            Status = crate.Status,
            Position = new CratePositionDto
            {
                X = crate.PositionX,
                Y = crate.PositionY,
                Rotation = crate.Rotation
            }
        };
    }

    private static LogisticsContainerDto MapContainer(LogisticsContainer container)
    {
        return new LogisticsContainerDto
        {
            Id = container.ContainerId,
            Name = container.Name,
            Type = container.Type,
            Dimensions = new DimensionsDto
            {
                Length = container.Length,
                Width = container.Width,
                Height = container.Height
            },
            MaxWeight = container.MaxWeight,
            ShipmentId = container.ShipmentId
        };
    }

    private static void ValidateRequest(object request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request is required.");
        }

        var validationContext = new ValidationContext(request);
        Validator.ValidateObject(request, validationContext, validateAllProperties: true);
    }

    private static async Task EnsureProjectExists(AppDbContext context, int projectId)
    {
        var exists = await context.Projects.AnyAsync(p => p.ProjeID == projectId);
        if (!exists)
        {
            throw new InvalidOperationException("Project not found.");
        }
    }

    private static async Task<List<LogisticsProductDto>> LoadCrateProductsAsync(AppDbContext context, string crateId)
    {
        var productIds = await context.LogisticsCrateItems
            .AsNoTracking()
            .Where(item => item.CrateId == crateId)
            .Select(item => item.ProductId)
            .ToListAsync();

        if (productIds.Count == 0)
        {
            return new List<LogisticsProductDto>();
        }

        var products = await context.LogisticsProducts
            .AsNoTracking()
            .Where(p => productIds.Contains(p.ProductId))
            .ToListAsync();

        return products.Select(MapProduct).ToList();
    }
}

public class LogisticsStateDto
{
    public List<LogisticsProductDto> Products { get; set; } = new();
    public List<LogisticsCrateDto> Crates { get; set; } = new();
    public List<LogisticsContainerDto> Containers { get; set; } = new();
}

public class DimensionsDto
{
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
}

public class CratePositionDto
{
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal Rotation { get; set; }
}

public class LogisticsProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DimensionsDto Dimensions { get; set; } = new();
    public decimal Weight { get; set; }
    public string Color { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public int? LineProjectId { get; set; }
}

public class LogisticsCrateDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DimensionsDto Dimensions { get; set; } = new();
    public decimal WeightCapacity { get; set; }
    public List<LogisticsProductDto> Contents { get; set; } = new();
    public string? ContainerId { get; set; }
    public int? ShipmentId { get; set; }
    public int? LineProjectId { get; set; }
    public int ProjectId { get; set; }
    public string Status { get; set; } = "staged";
    public CratePositionDto Position { get; set; } = new();
}

public class LogisticsContainerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DimensionsDto Dimensions { get; set; } = new();
    public decimal MaxWeight { get; set; }
    public int? ShipmentId { get; set; }
}

public class LogisticsProductCreateRequest
{
    [Required]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DimensionsDto Dimensions { get; set; } = new();

    public decimal Weight { get; set; }

    [MaxLength(50)]
    public string? Color { get; set; }

    [Range(1, int.MaxValue)]
    public int ProjectId { get; set; }

    public int? LineProjectId { get; set; }
}

public class LogisticsProductUpdateRequest : LogisticsProductCreateRequest
{
}

public class LogisticsCrateCreateRequest
{
    [Required]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DimensionsDto Dimensions { get; set; } = new();

    public decimal WeightCapacity { get; set; }

    public string? Status { get; set; }

    [Range(1, int.MaxValue)]
    public int ProjectId { get; set; }

    public int? LineProjectId { get; set; }
    public int? ShipmentId { get; set; }
    public string? ContainerId { get; set; }
    public CratePositionDto? Position { get; set; }
    public List<string> ProductIds { get; set; } = new();
}

public class LogisticsCrateUpdateRequest
{
    public string? ContainerId { get; set; }
    public bool? SetContainerId { get; set; }
    public int? ShipmentId { get; set; }
    public bool? SetShipmentId { get; set; }
    public string? Status { get; set; }
    public CratePositionDto? Position { get; set; }
}

public class LogisticsContainerCreateRequest
{
    [Required]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty;

    [Required]
    public DimensionsDto Dimensions { get; set; } = new();

    public decimal MaxWeight { get; set; }
    public int? ShipmentId { get; set; }
}


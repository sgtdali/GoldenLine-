using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class LocationService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public LocationService()
        : this(App.DbOptions)
    {
    }

    public LocationService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<LocationDto>> GetLocationsAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        return await context.Locations
            .AsNoTracking()
            .Where(l => l.IsActive)
            .OrderBy(l => l.Code ?? l.Name)
            .Select(l => new LocationDto(
                l.LocationId,
                l.Code ?? l.Name,
                l.Description,
                l.Name))
            .ToListAsync();
    }

    public async Task<LocationDto> CreateLocationAsync(CreateLocationRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Code))
        {
            throw new InvalidOperationException("Location code is required.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var normalizedCode = request.Code.Trim();
        var exists = await context.Locations
            .AnyAsync(l => l.Code != null && l.Code.ToUpper() == normalizedCode.ToUpper());
        if (exists)
        {
            throw new InvalidOperationException("A location with this code already exists.");
        }

        var location = new Location
        {
            Code = normalizedCode,
            Name = string.IsNullOrWhiteSpace(request.Name) ? normalizedCode : request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true,
        };

        context.Locations.Add(location);
        await context.SaveChangesAsync();

        return new LocationDto(location.LocationId, location.Code, location.Description, location.Name);
    }

    public async Task UpdateLocationAsync(int id, UpdateLocationRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Code))
        {
            throw new InvalidOperationException("Location code is required.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var location = await context.Locations.FindAsync(id);
        if (location == null)
        {
            throw new InvalidOperationException("Location not found.");
        }

        var normalizedCode = request.Code.Trim();
        var conflict = await context.Locations
            .AnyAsync(l => l.LocationId != id && l.Code != null && l.Code.ToUpper() == normalizedCode.ToUpper());
        if (conflict)
        {
            throw new InvalidOperationException("A location with this code already exists.");
        }

        location.Code = normalizedCode;
        location.Name = string.IsNullOrWhiteSpace(request.Name) ? normalizedCode : request.Name.Trim();
        location.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await context.SaveChangesAsync();
    }

    public async Task DeleteLocationAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var location = await context.Locations.FindAsync(id);
        if (location == null)
        {
            throw new InvalidOperationException("Location not found.");
        }

        var hasStock = await context.ItemLocationStocks
            .AnyAsync(ls => ls.LocationId == id);
        if (hasStock)
        {
            throw new InvalidOperationException("Location has stock entries and cannot be deleted.");
        }

        var hasSessions = await context.InventoryCountSessions
            .AnyAsync(s => s.LocationId == id);
        if (hasSessions)
        {
            throw new InvalidOperationException("Location has count sessions and cannot be deleted.");
        }

        context.Locations.Remove(location);
        await context.SaveChangesAsync();
    }
}

public record LocationDto(int LocationId, string Code, string? Description, string Name);

public class CreateLocationRequest
{
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class UpdateLocationRequest : CreateLocationRequest
{
}


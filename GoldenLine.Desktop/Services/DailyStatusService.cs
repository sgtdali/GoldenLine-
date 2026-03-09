using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class DailyStatusService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public DailyStatusService()
        : this(App.DbOptions)
    {
    }

    public DailyStatusService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<DailyStatusResponse>> GetDailyStatusesAsync(DailyStatusQuery query)
    {
        await using var context = new AppDbContext(_dbOptions);

        var statusQuery = context.DailyStatuses
            .AsNoTracking()
            .Include(s => s.Personnel)
            .AsQueryable();

        if (query.StartDate.HasValue)
        {
            var start = query.StartDate.Value.Date;
            statusQuery = statusQuery.Where(s => s.Date >= start);
        }

        if (query.EndDate.HasValue)
        {
            var end = query.EndDate.Value.Date;
            statusQuery = statusQuery.Where(s => s.Date <= end);
        }

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            statusQuery = statusQuery.Where(s => s.Personnel.Department == query.Department);
        }

        if (!string.IsNullOrWhiteSpace(query.Project))
        {
            var projectValue = query.Project.Trim();
            statusQuery = statusQuery.Where(s =>
                s.ProjectCode == projectValue || s.ProjectName == projectValue);
        }

        if (!string.IsNullOrWhiteSpace(query.Location))
        {
            var location = query.Location.Trim();
            statusQuery = statusQuery.Where(s => s.Location == location);
        }

        HashSet<int>? personnelFilter = null;
        if (query.PersonnelIds != null && query.PersonnelIds.Count > 0)
        {
            personnelFilter = query.PersonnelIds
                .Where(id => id > 0)
                .ToHashSet();
        }

        HashSet<PersonnelStatusType>? statusTypeFilter = null;
        if (query.StatusTypes != null && query.StatusTypes.Count > 0)
        {
            statusTypeFilter = query.StatusTypes.ToHashSet();
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            statusQuery = statusQuery.Where(s =>
                s.Personnel.FullName.ToLower().Contains(search) ||
                (s.Personnel.Department != null && s.Personnel.Department.ToLower().Contains(search)) ||
                (s.ProjectName != null && s.ProjectName.ToLower().Contains(search)) ||
                (s.ProjectCode != null && s.ProjectCode.ToLower().Contains(search)));
        }

        var results = await statusQuery
            .OrderBy(s => s.Date)
            .ThenBy(s => s.Personnel.FullName)
            .Select(s => new DailyStatusResponse
            {
                DailyStatusId = s.DailyStatusId,
                Date = DateOnly.FromDateTime(s.Date),
                PersonnelId = s.PersonnelId,
                PersonnelName = s.Personnel.FullName,
                Department = s.Personnel.Department,
                StatusType = s.StatusType,
                ProjectCode = s.ProjectCode,
                ProjectName = s.ProjectName,
                Location = s.Location,
                Note = s.Note,
                CreatedAt = s.CreatedAt,
                CreatedBy = s.CreatedBy,
                UpdatedAt = s.UpdatedAt,
                UpdatedBy = s.UpdatedBy
            })
            .ToListAsync();

        if (personnelFilter != null && personnelFilter.Count > 0)
        {
            results = results
                .Where(result => personnelFilter.Contains(result.PersonnelId))
                .ToList();
        }

        if (statusTypeFilter != null && statusTypeFilter.Count > 0)
        {
            results = results
                .Where(result => statusTypeFilter.Contains(result.StatusType))
                .ToList();
        }

        return results;
    }

    public async Task<List<DailyStatusResponse>> BulkUpsertStatusesAsync(DailyStatusBulkRequest request)
    {
        ValidateRequest(request);

        if (request.StartDate.Date > request.EndDate.Date)
        {
            throw new InvalidOperationException("Start date must be before end date.");
        }

        if (request.PersonnelIds == null || request.PersonnelIds.Count == 0)
        {
            throw new InvalidOperationException("At least one personnel must be selected.");
        }

        var uniquePersonnelIds = request.PersonnelIds.Distinct().ToList();
        var personnelIdSet = uniquePersonnelIds.ToHashSet();
        var minPersonnelId = uniquePersonnelIds.Min();
        var maxPersonnelId = uniquePersonnelIds.Max();

        await using var context = new AppDbContext(_dbOptions);

        var existingPersonnel = await context.Personnel
            .Where(p => p.PersonnelId >= minPersonnelId && p.PersonnelId <= maxPersonnelId)
            .Select(p => p.PersonnelId)
            .ToListAsync();

        existingPersonnel = existingPersonnel
            .Where(id => personnelIdSet.Contains(id))
            .ToList();

        if (existingPersonnel.Count != uniquePersonnelIds.Count)
        {
            var missing = uniquePersonnelIds.Except(existingPersonnel).ToList();
            throw new InvalidOperationException($"Unknown personnel identifiers: {string.Join(", ", missing)}");
        }

        var startDate = request.StartDate.Date;
        var endDate = request.EndDate.Date;

        var existingStatuses = await context.DailyStatuses
            .Where(s =>
                s.Date >= startDate &&
                s.Date <= endDate &&
                s.PersonnelId >= minPersonnelId &&
                s.PersonnelId <= maxPersonnelId)
            .ToListAsync();

        existingStatuses = existingStatuses
            .Where(s => personnelIdSet.Contains(s.PersonnelId))
            .ToList();

        var lookup = existingStatuses.ToDictionary(
            s => (s.PersonnelId, DateOnly.FromDateTime(s.Date)));

        var saveTime = DateTime.UtcNow;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var dateOnly = DateOnly.FromDateTime(date);

            foreach (var personnelId in uniquePersonnelIds)
            {
                if (lookup.TryGetValue((personnelId, dateOnly), out var existing))
                {
                    existing.StatusType = request.StatusType;
                    existing.ProjectCode = request.ProjectCode?.Trim();
                    existing.ProjectName = request.ProjectName?.Trim();
                    existing.Location = request.Location?.Trim();
                    existing.Note = request.Note?.Trim();
                    existing.UpdatedAt = saveTime;
                    existing.UpdatedBy = request.Actor?.Trim();
                    continue;
                }

                var newStatus = new DailyStatus
                {
                    PersonnelId = personnelId,
                    Date = DateTime.SpecifyKind(date, DateTimeKind.Unspecified),
                    StatusType = request.StatusType,
                    ProjectCode = request.ProjectCode?.Trim(),
                    ProjectName = request.ProjectName?.Trim(),
                    Location = request.Location?.Trim(),
                    Note = request.Note?.Trim(),
                    CreatedAt = saveTime,
                    CreatedBy = request.Actor?.Trim()
                };

                context.DailyStatuses.Add(newStatus);
                lookup[(personnelId, dateOnly)] = newStatus;
            }
        }

        await context.SaveChangesAsync();

        var persistedQuery = context.DailyStatuses
            .AsNoTracking()
            .Include(s => s.Personnel)
            .Where(s =>
                s.Date >= startDate &&
                s.Date <= endDate &&
                s.PersonnelId >= minPersonnelId &&
                s.PersonnelId <= maxPersonnelId);

        var persisted = await persistedQuery.ToListAsync();

        return persisted
            .Where(s => personnelIdSet.Contains(s.PersonnelId))
            .Select(ToResponseWithPersonnel)
            .ToList();
    }

    public async Task<DailyStatusResponse> CreateStatusAsync(DailyStatusRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var personnelExists = await context.Personnel
            .AnyAsync(p => p.PersonnelId == request.PersonnelId);

        if (!personnelExists)
        {
            throw new InvalidOperationException("Personnel record not found.");
        }

        var date = request.Date.Date;
        var collision = await context.DailyStatuses.AnyAsync(s =>
            s.PersonnelId == request.PersonnelId &&
            s.Date == date);

        if (collision)
        {
            throw new InvalidOperationException("Status already exists for the selected day.");
        }

        var status = new DailyStatus
        {
            PersonnelId = request.PersonnelId,
            Date = DateTime.SpecifyKind(date, DateTimeKind.Unspecified),
            StatusType = request.StatusType,
            ProjectCode = request.ProjectCode?.Trim(),
            ProjectName = request.ProjectName?.Trim(),
            Location = request.Location?.Trim(),
            Note = request.Note?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = request.Actor?.Trim()
        };

        context.DailyStatuses.Add(status);
        await context.SaveChangesAsync();

        var persisted = await context.DailyStatuses
            .AsNoTracking()
            .Include(s => s.Personnel)
            .FirstAsync(s => s.DailyStatusId == status.DailyStatusId);

        return ToResponseWithPersonnel(persisted);
    }

    public async Task UpdateStatusAsync(int id, DailyStatusRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var status = await context.DailyStatuses
            .Include(s => s.Personnel)
            .FirstOrDefaultAsync(s => s.DailyStatusId == id);

        if (status == null)
        {
            throw new InvalidOperationException("Status not found.");
        }

        if (status.PersonnelId != request.PersonnelId)
        {
            var personnelExists = await context.Personnel
                .AnyAsync(p => p.PersonnelId == request.PersonnelId);

            if (!personnelExists)
            {
                throw new InvalidOperationException("Personnel record not found.");
            }
        }

        var newDate = request.Date.Date;

        var conflict = await context.DailyStatuses.AnyAsync(s =>
            s.DailyStatusId != id &&
            s.PersonnelId == request.PersonnelId &&
            s.Date == newDate);

        if (conflict)
        {
            throw new InvalidOperationException("Another status exists for the selected personnel and date.");
        }

        status.PersonnelId = request.PersonnelId;
        status.Date = DateTime.SpecifyKind(newDate, DateTimeKind.Unspecified);
        status.StatusType = request.StatusType;
        status.ProjectCode = request.ProjectCode?.Trim();
        status.ProjectName = request.ProjectName?.Trim();
        status.Location = request.Location?.Trim();
        status.Note = request.Note?.Trim();
        status.UpdatedAt = DateTime.UtcNow;
        status.UpdatedBy = request.Actor?.Trim();

        await context.SaveChangesAsync();
    }

    public async Task DeleteStatusAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var status = await context.DailyStatuses.FindAsync(id);
        if (status == null)
        {
            throw new InvalidOperationException("Status not found.");
        }

        context.DailyStatuses.Remove(status);
        await context.SaveChangesAsync();
    }

    private static void ValidateRequest(object request)
    {
        var validationContext = new ValidationContext(request);
        Validator.ValidateObject(request, validationContext, validateAllProperties: true);
    }

    private static DailyStatusResponse ToResponseWithPersonnel(DailyStatus status)
    {
        return new DailyStatusResponse
        {
            DailyStatusId = status.DailyStatusId,
            Date = DateOnly.FromDateTime(status.Date),
            PersonnelId = status.PersonnelId,
            PersonnelName = status.Personnel?.FullName,
            Department = status.Personnel?.Department,
            StatusType = status.StatusType,
            ProjectCode = status.ProjectCode,
            ProjectName = status.ProjectName,
            Location = status.Location,
            Note = status.Note,
            CreatedAt = status.CreatedAt,
            CreatedBy = status.CreatedBy,
            UpdatedAt = status.UpdatedAt,
            UpdatedBy = status.UpdatedBy
        };
    }
}

public class DailyStatusQuery
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Department { get; set; }
    public string? Project { get; set; }
    public string? Location { get; set; }
    public string? Search { get; set; }
    public List<int>? PersonnelIds { get; set; }
    public List<PersonnelStatusType>? StatusTypes { get; set; }
}

public class DailyStatusBulkRequest
{
    [Required]
    public List<int> PersonnelIds { get; set; } = new();

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public PersonnelStatusType StatusType { get; set; }

    [MaxLength(120)]
    public string? ProjectCode { get; set; }

    [MaxLength(200)]
    public string? ProjectName { get; set; }

    [MaxLength(120)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }

    [MaxLength(100)]
    public string? Actor { get; set; }
}

public class DailyStatusRequest
{
    [Required]
    public int PersonnelId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public PersonnelStatusType StatusType { get; set; }

    [MaxLength(120)]
    public string? ProjectCode { get; set; }

    [MaxLength(200)]
    public string? ProjectName { get; set; }

    [MaxLength(120)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }

    [MaxLength(100)]
    public string? Actor { get; set; }
}

public class DailyStatusResponse
{
    public int DailyStatusId { get; set; }
    public DateOnly Date { get; set; }
    public int PersonnelId { get; set; }
    public string? PersonnelName { get; set; }
    public string? Department { get; set; }
    public PersonnelStatusType StatusType { get; set; }
    public string? ProjectCode { get; set; }
    public string? ProjectName { get; set; }
    public string? Location { get; set; }
    public string? Note { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}


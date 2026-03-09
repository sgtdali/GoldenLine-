using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class PersonnelService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public PersonnelService()
        : this(App.DbOptions)
    {
    }

    public PersonnelService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<PersonnelSummaryResponse>> GetPersonnelAsync(PersonnelListQuery query)
    {
        await using var context = new AppDbContext(_dbOptions);

        var personnelQuery = context.Personnel.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            personnelQuery = personnelQuery.Where(p => p.Department == query.Department);
        }

        if (!string.IsNullOrWhiteSpace(query.EmploymentStatus))
        {
            personnelQuery = personnelQuery.Where(p => p.EmploymentStatus == query.EmploymentStatus);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            personnelQuery = personnelQuery.Where(p =>
                p.FullName.ToLower().Contains(search) ||
                (p.TeamOrProject != null && p.TeamOrProject.ToLower().Contains(search)) ||
                (p.Role != null && p.Role.ToLower().Contains(search)));
        }

        var personnelList = await personnelQuery
            .OrderBy(p => p.FullName)
            .ToListAsync();

        if (personnelList.Count == 0)
        {
            return new List<PersonnelSummaryResponse>();
        }

        var includeMetrics = query.IncludeMetrics ?? true;
        DateOnly metricsStart;
        DateOnly metricsEnd;

        if (query.MetricsStartDate.HasValue && query.MetricsEndDate.HasValue)
        {
            metricsStart = DateOnly.FromDateTime(query.MetricsStartDate.Value.Date);
            metricsEnd = DateOnly.FromDateTime(query.MetricsEndDate.Value.Date);
        }
        else
        {
            var now = DateTime.UtcNow;
            metricsStart = new DateOnly(now.Year, 1, 1);
            metricsEnd = new DateOnly(now.Year, 12, 31);
        }

        var response = personnelList.Select(p => new PersonnelSummaryResponse
        {
            PersonnelId = p.PersonnelId,
            FullName = p.FullName,
            Department = p.Department,
            Role = p.Role,
            TeamOrProject = p.TeamOrProject,
            EmploymentStatus = p.EmploymentStatus,
            PrimaryLocation = p.PrimaryLocation,
            CurrentProject = p.CurrentProject,
            Skills = p.Skills,
            Notes = p.Notes,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        if (!includeMetrics || response.Count == 0)
        {
            return response;
        }

        var startDate = metricsStart.ToDateTime(TimeOnly.MinValue);
        var endDate = metricsEnd.ToDateTime(TimeOnly.MinValue);

        var personnelIds = personnelList.Select(p => p.PersonnelId).ToList();

        var statusItemsRaw = await context.DailyStatuses.AsNoTracking()
            .Where(s => s.Date >= startDate && s.Date <= endDate)
            .ToListAsync();

        var statusItems = statusItemsRaw
            .Where(s => personnelIds.Contains(s.PersonnelId))
            .Select(s => new
            {
                s.PersonnelId,
                s.StatusType,
                s.ProjectName,
                s.ProjectCode,
                s.Location,
                s.Date,
                s.DailyStatusId
            })
            .ToList();

        var metricsLookup = statusItems
            .GroupBy(item => item.PersonnelId)
            .ToDictionary(
                group => group.Key,
                group =>
                {
                    var latestAssignment = group
                        .Where(item => item.StatusType == PersonnelStatusType.Assignment)
                        .OrderByDescending(item => item.Date)
                        .ThenByDescending(item => item.DailyStatusId)
                        .FirstOrDefault();

                    return new
                    {
                        AnnualLeave = group.Count(item => item.StatusType == PersonnelStatusType.AnnualLeave),
                        Assignment = group.Count(item => item.StatusType == PersonnelStatusType.Assignment),
                        SickLeave = group.Count(item => item.StatusType == PersonnelStatusType.SickLeave),
                        Other = group.Count(item => item.StatusType != PersonnelStatusType.Normal),
                        LatestAssignment = latestAssignment
                    };
                });

        var totalDays = Math.Max(0, (endDate - startDate).Days + 1);

        foreach (var summary in response)
        {
            if (!metricsLookup.TryGetValue(summary.PersonnelId, out var metrics))
            {
                summary.Metrics = new PersonnelSummaryMetrics
                {
                    AnnualLeaveDays = 0,
                    AssignmentDays = 0,
                    SickLeaveDays = 0,
                    AvailableDays = totalDays
                };
                continue;
            }

            var occupied = metrics.Other;
            var available = Math.Max(0, totalDays - occupied);

            summary.Metrics = new PersonnelSummaryMetrics
            {
                AnnualLeaveDays = metrics.AnnualLeave,
                AssignmentDays = metrics.Assignment,
                SickLeaveDays = metrics.SickLeave,
                AvailableDays = available
            };

            if (metrics.LatestAssignment != null)
            {
                summary.LatestAssignment = new PersonnelAssignmentPreview
                {
                    ProjectName = metrics.LatestAssignment.ProjectName,
                    ProjectCode = metrics.LatestAssignment.ProjectCode,
                    Location = metrics.LatestAssignment.Location
                };
            }
        }

        return response;
    }

    public async Task<PersonnelDetailResponse?> GetPersonnelDetailAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var personnel = await context.Personnel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PersonnelId == id);

        if (personnel == null)
        {
            return null;
        }

        var recentAssignments = await context.DailyStatuses.AsNoTracking()
            .Where(s => s.PersonnelId == id && s.StatusType == PersonnelStatusType.Assignment)
            .OrderByDescending(s => s.Date)
            .ThenByDescending(s => s.DailyStatusId)
            .Take(20)
            .Select(s => new PersonnelAssignmentPreview
            {
                ProjectName = s.ProjectName,
                ProjectCode = s.ProjectCode,
                Location = s.Location,
                Date = s.Date
            })
            .ToListAsync();

        return new PersonnelDetailResponse
        {
            PersonnelId = personnel.PersonnelId,
            FullName = personnel.FullName,
            Department = personnel.Department,
            Role = personnel.Role,
            TeamOrProject = personnel.TeamOrProject,
            EmploymentStatus = personnel.EmploymentStatus,
            PrimaryLocation = personnel.PrimaryLocation,
            CurrentProject = personnel.CurrentProject,
            Skills = personnel.Skills,
            Notes = personnel.Notes,
            CreatedAt = personnel.CreatedAt,
            UpdatedAt = personnel.UpdatedAt,
            RecentAssignments = recentAssignments
        };
    }

    public async Task<PersonnelDetailResponse> CreatePersonnelAsync(PersonnelRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var newPersonnel = new Personnel
        {
            FullName = request.FullName.Trim(),
            Department = request.Department?.Trim(),
            Role = request.Role?.Trim(),
            TeamOrProject = request.TeamOrProject?.Trim(),
            EmploymentStatus = string.IsNullOrWhiteSpace(request.EmploymentStatus)
                ? "Active"
                : request.EmploymentStatus.Trim(),
            Skills = request.Skills?.Trim(),
            Notes = request.Notes?.Trim(),
            PrimaryLocation = request.PrimaryLocation?.Trim(),
            CurrentProject = request.CurrentProject?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        context.Personnel.Add(newPersonnel);
        await context.SaveChangesAsync();

        return new PersonnelDetailResponse
        {
            PersonnelId = newPersonnel.PersonnelId,
            FullName = newPersonnel.FullName,
            Department = newPersonnel.Department,
            Role = newPersonnel.Role,
            TeamOrProject = newPersonnel.TeamOrProject,
            EmploymentStatus = newPersonnel.EmploymentStatus,
            PrimaryLocation = newPersonnel.PrimaryLocation,
            CurrentProject = newPersonnel.CurrentProject,
            Skills = newPersonnel.Skills,
            Notes = newPersonnel.Notes,
            CreatedAt = newPersonnel.CreatedAt,
            UpdatedAt = newPersonnel.UpdatedAt,
            RecentAssignments = Array.Empty<PersonnelAssignmentPreview>()
        };
    }

    public async Task<List<PersonnelDetailResponse>> BulkCreatePersonnelAsync(IEnumerable<PersonnelRequest> requests)
    {
        if (requests == null)
        {
            throw new InvalidOperationException("Request body cannot be empty.");
        }

        var requestList = requests.ToList();
        if (requestList.Count == 0)
        {
            throw new InvalidOperationException("At least one personnel entry must be provided.");
        }

        var invalid = requestList
            .Select((req, index) => new { Request = req, Index = index })
            .FirstOrDefault(x => string.IsNullOrWhiteSpace(x.Request.FullName));

        if (invalid != null)
        {
            throw new InvalidOperationException($"Full name is required for record at index {invalid.Index}.");
        }

        var createdAt = DateTime.UtcNow;
        var newPersonnelList = requestList.Select(request => new Personnel
        {
            FullName = request.FullName.Trim(),
            Department = request.Department?.Trim(),
            Role = request.Role?.Trim(),
            TeamOrProject = request.TeamOrProject?.Trim(),
            EmploymentStatus = string.IsNullOrWhiteSpace(request.EmploymentStatus)
                ? "Active"
                : request.EmploymentStatus.Trim(),
            Skills = request.Skills?.Trim(),
            Notes = request.Notes?.Trim(),
            PrimaryLocation = request.PrimaryLocation?.Trim(),
            CurrentProject = request.CurrentProject?.Trim(),
            CreatedAt = createdAt
        }).ToList();

        await using var context = new AppDbContext(_dbOptions);
        context.Personnel.AddRange(newPersonnelList);
        await context.SaveChangesAsync();

        return newPersonnelList.Select(person => new PersonnelDetailResponse
        {
            PersonnelId = person.PersonnelId,
            FullName = person.FullName,
            Department = person.Department,
            Role = person.Role,
            TeamOrProject = person.TeamOrProject,
            EmploymentStatus = person.EmploymentStatus,
            PrimaryLocation = person.PrimaryLocation,
            CurrentProject = person.CurrentProject,
            Skills = person.Skills,
            Notes = person.Notes,
            CreatedAt = person.CreatedAt,
            UpdatedAt = person.UpdatedAt,
            RecentAssignments = Array.Empty<PersonnelAssignmentPreview>()
        }).ToList();
    }

    public async Task UpdatePersonnelAsync(int id, PersonnelRequest request)
    {
        ValidateRequest(request);

        await using var context = new AppDbContext(_dbOptions);

        var personnel = await context.Personnel.FindAsync(id);
        if (personnel == null)
        {
            throw new InvalidOperationException("Personnel not found.");
        }

        personnel.FullName = request.FullName.Trim();
        personnel.Department = request.Department?.Trim();
        personnel.Role = request.Role?.Trim();
        personnel.TeamOrProject = request.TeamOrProject?.Trim();
        personnel.EmploymentStatus = string.IsNullOrWhiteSpace(request.EmploymentStatus)
            ? "Active"
            : request.EmploymentStatus.Trim();
        personnel.Skills = request.Skills?.Trim();
        personnel.Notes = request.Notes?.Trim();
        personnel.PrimaryLocation = request.PrimaryLocation?.Trim();
        personnel.CurrentProject = request.CurrentProject?.Trim();
        personnel.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
    }

    public async Task DeletePersonnelAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var personnel = await context.Personnel
            .Include(p => p.DailyStatuses)
            .FirstOrDefaultAsync(p => p.PersonnelId == id);

        if (personnel == null)
        {
            throw new InvalidOperationException("Personnel not found.");
        }

        if (personnel.DailyStatuses.Any())
        {
            throw new InvalidOperationException("Unable to delete personnel with existing daily status records.");
        }

        context.Personnel.Remove(personnel);
        await context.SaveChangesAsync();
    }

    private static void ValidateRequest(PersonnelRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request is required.");
        }

        var validationContext = new ValidationContext(request);
        Validator.ValidateObject(request, validationContext, validateAllProperties: true);
    }
}

public class PersonnelListQuery
{
    public string? Department { get; set; }
    public string? EmploymentStatus { get; set; }
    public string? Search { get; set; }
    public bool? IncludeMetrics { get; set; }
    public DateTime? MetricsStartDate { get; set; }
    public DateTime? MetricsEndDate { get; set; }
}

public class PersonnelRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Department { get; set; }

    [MaxLength(120)]
    public string? Role { get; set; }

    [MaxLength(120)]
    public string? TeamOrProject { get; set; }

    [MaxLength(40)]
    public string? EmploymentStatus { get; set; }

    [MaxLength(200)]
    public string? Skills { get; set; }

    [MaxLength(4000)]
    public string? Notes { get; set; }

    [MaxLength(120)]
    public string? PrimaryLocation { get; set; }

    [MaxLength(120)]
    public string? CurrentProject { get; set; }
}

public class PersonnelSummaryResponse
{
    public int PersonnelId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Role { get; set; }
    public string? TeamOrProject { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
    public string? PrimaryLocation { get; set; }
    public string? CurrentProject { get; set; }
    public string? Skills { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public PersonnelSummaryMetrics? Metrics { get; set; }
    public PersonnelAssignmentPreview? LatestAssignment { get; set; }
}

public class PersonnelSummaryMetrics
{
    public int AnnualLeaveDays { get; set; }
    public int AssignmentDays { get; set; }
    public int SickLeaveDays { get; set; }
    public int AvailableDays { get; set; }
}

public class PersonnelAssignmentPreview
{
    public string? ProjectName { get; set; }
    public string? ProjectCode { get; set; }
    public string? Location { get; set; }
    public DateTime? Date { get; set; }
}

public class PersonnelDetailResponse : PersonnelSummaryResponse
{
    public IEnumerable<PersonnelAssignmentPreview> RecentAssignments { get; set; } =
        Enumerable.Empty<PersonnelAssignmentPreview>();
}


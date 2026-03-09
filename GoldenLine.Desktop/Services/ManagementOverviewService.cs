using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;

namespace GoldenLine.Desktop.Services;

public class ManagementOverviewService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public ManagementOverviewService()
        : this(App.DbOptions)
    {
    }

    public ManagementOverviewService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<ManagementOverviewResponse> GetOverviewAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        var projects = await context.Projects.AsNoTracking().ToListAsync();
        var personnelCount = await context.Personnel.CountAsync();
        var activeStatuses = await context.DailyStatuses
            .AsNoTracking()
            .Where(status => status.Date == DateTime.UtcNow.Date)
            .CountAsync();

        var metrics = new List<SummaryMetricDto>
        {
            new() { Label = "Active Projects", Value = projects.Count.ToString() },
            new() { Label = "People On Site Today", Value = activeStatuses.ToString() },
            new() { Label = "Headcount", Value = personnelCount.ToString() },
        };

        var peoplePerProject = await context.DailyStatuses
            .AsNoTracking()
            .Where(status => status.Date >= DateTime.UtcNow.Date.AddDays(-2))
            .GroupBy(status => status.ProjectName ?? status.ProjectCode ?? "Unnamed")
            .Select(group => new ProjectPeopleDto
            {
                Project = group.Key,
                People = group.Select(status => status.PersonnelId).Distinct().Count(),
            })
            .OrderByDescending(item => item.People)
            .Take(10)
            .ToListAsync();

        var machineCountByProject = new Dictionary<string, int>();

        var topProjectsRaw = await context.DailyStatuses
            .AsNoTracking()
            .GroupBy(status => status.ProjectName ?? status.ProjectCode ?? "Unnamed")
            .Select(group => new ProjectKpiDto
            {
                ProjectName = group.Key,
                PeopleCount = group.Select(status => status.PersonnelId).Distinct().Count(),
            })
            .OrderByDescending(kpi => kpi.PeopleCount)
            .Take(5)
            .ToListAsync();

        var topProjects = topProjectsRaw
            .Select(item => new ProjectKpiDto
            {
                ProjectName = item.ProjectName,
                PeopleCount = item.PeopleCount,
                MachinesCount = machineCountByProject.TryGetValue(item.ProjectName, out var machineCount) ? machineCount : 0,
            })
            .ToList();

        return new ManagementOverviewResponse
        {
            Metrics = metrics,
            PeoplePerProject = peoplePerProject,
            TopProjects = topProjects,
        };
    }
}

public class ManagementOverviewResponse
{
    public List<SummaryMetricDto> Metrics { get; set; } = new();
    public List<ProjectPeopleDto> PeoplePerProject { get; set; } = new();
    public List<ProjectKpiDto> TopProjects { get; set; } = new();
}

public class SummaryMetricDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ProjectPeopleDto
{
    public string Project { get; set; } = string.Empty;
    public int People { get; set; }
}

public class ProjectKpiDto
{
    public string ProjectName { get; set; } = string.Empty;
    public int PeopleCount { get; set; }
    public int MachinesCount { get; set; }
}


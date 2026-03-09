using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class CapacityService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public CapacityService()
        : this(App.DbOptions)
    {
    }

    public CapacityService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<PersonCapacityRowDto>> GetPeopleCapacityAsync(DateTime? startDate, DateTime? endDate)
    {
        var start = (startDate ?? DateTime.UtcNow.Date).Date;
        var end = (endDate ?? start.AddDays(9)).Date;

        if (end < start)
        {
            (start, end) = (end, start);
        }

        var dayCount = (end - start).Days + 1;
        if (dayCount > 30)
        {
            end = start.AddDays(29);
            dayCount = 30;
        }

        var dateRange = Enumerable.Range(0, dayCount)
            .Select(offset => DateOnly.FromDateTime(start.AddDays(offset)))
            .ToArray();

        await using var context = new AppDbContext(_dbOptions);

        var personnel = await context.Personnel
            .AsNoTracking()
            .OrderBy(p => p.FullName)
            .ToListAsync();

        var statuses = await context.DailyStatuses
            .AsNoTracking()
            .Where(s => s.Date >= start && s.Date <= end)
            .ToListAsync();

        var statusLookup = statuses
            .GroupBy(s => s.PersonnelId)
            .ToDictionary(
                grp => grp.Key,
                grp => grp.ToDictionary(
                    s => DateOnly.FromDateTime(s.Date),
                    s => s));

        var response = new List<PersonCapacityRowDto>();

        foreach (var person in personnel)
        {
            var row = new PersonCapacityRowDto
            {
                PersonnelId = person.PersonnelId,
                PersonName = person.FullName,
                Department = person.Department,
            };

            foreach (var date in dateRange)
            {
                DailyStatus? status = null;
                if (statusLookup.TryGetValue(person.PersonnelId, out var personStatuses))
                {
                    personStatuses.TryGetValue(date, out status);
                }

                (string? project, int load) = MapStatusToLoad(status);

                row.Days.Add(new PersonCapacityDayDto
                {
                    Date = date,
                    ProjectName = project,
                    Load = load,
                });
            }

            response.Add(row);
        }

        return response;
    }

    public ScenarioResultDto CalculateScenario(ScenarioRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ProjectName))
        {
            throw new InvalidOperationException("ProjectName is required.");
        }

        const int BasePeopleImpact = 3;
        var absShift = Math.Abs(request.ShiftDays);

        return new ScenarioResultDto
        {
            ProjectName = request.ProjectName,
            ShiftDays = request.ShiftDays,
            ImpactedPeople = BasePeopleImpact + absShift,
            ImpactedMachines = request.ShiftDays > 0 ? 1 : 2,
            OverloadDays = Math.Max(0, absShift - 1),
        };
    }

    private static (string? projectName, int load) MapStatusToLoad(DailyStatus? status)
    {
        if (status == null)
        {
            return (null, 0);
        }

        var project = status.ProjectName ?? status.ProjectCode;
        return status.StatusType switch
        {
            PersonnelStatusType.Assignment => (project, 80),
            PersonnelStatusType.AnnualLeave => (project, 20),
            PersonnelStatusType.ExcuseLeave => (project, 30),
            PersonnelStatusType.SickLeave => (project, 10),
            PersonnelStatusType.AdministrativeLeave => (project, 40),
            _ => (project, 0),
        };
    }
}

public class PersonCapacityRowDto
{
    public int PersonnelId { get; set; }
    public string PersonName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public List<PersonCapacityDayDto> Days { get; set; } = new();
}

public class PersonCapacityDayDto
{
    public DateOnly Date { get; set; }
    public string? ProjectName { get; set; }
    public int Load { get; set; }
}

public class ScenarioRequestDto
{
    public string ProjectName { get; set; } = string.Empty;
    public int ShiftDays { get; set; }
}

public class ScenarioResultDto
{
    public string ProjectName { get; set; } = string.Empty;
    public int ShiftDays { get; set; }
    public int ImpactedPeople { get; set; }
    public int ImpactedMachines { get; set; }
    public int OverloadDays { get; set; }
}


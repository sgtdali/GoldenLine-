using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class PersonnelReportsService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public PersonnelReportsService()
        : this(App.DbOptions)
    {
    }

    public PersonnelReportsService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<PersonnelReportOverviewResponse> GetOverviewAsync(PersonnelReportQuery query)
    {
        var (startDate, endDate) = NormalizeRange(query.StartDate, query.EndDate);

        await using var context = new AppDbContext(_dbOptions);

        var statuses = await context.DailyStatuses
            .AsNoTracking()
            .Include(s => s.Personnel)
            .Where(s => s.Date >= startDate && s.Date <= endDate)
            .ToListAsync();

        var personnel = await context.Personnel
            .AsNoTracking()
            .ToListAsync();

        var rangeDays = Math.Max(0, (endDate - startDate).Days + 1);
        var activePersonnel = personnel
            .Where(p => !string.Equals(p.EmploymentStatus, "Inactive", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var departmentLeave = BuildDepartmentLeave(statuses);
        var projectAssignments = BuildProjectAssignments(statuses);
        var monthlyTrends = BuildMonthlyTrends(statuses, activePersonnel, startDate, endDate);
        var capacity = BuildCapacity(statuses, activePersonnel, startDate, endDate, rangeDays);

        return new PersonnelReportOverviewResponse
        {
            RangeStart = DateOnly.FromDateTime(startDate),
            RangeEnd = DateOnly.FromDateTime(endDate),
            DepartmentLeave = departmentLeave,
            ProjectAssignments = projectAssignments,
            MonthlyTrends = monthlyTrends,
            Capacity = capacity
        };
    }

    private static (DateTime start, DateTime end) NormalizeRange(DateTime? start, DateTime? end)
    {
        var now = DateTime.UtcNow;
        var defaultStart = new DateTime(now.Year, 1, 1);
        var defaultEnd = new DateTime(now.Year, 12, 31);

        var normalizedStart = start?.Date ?? defaultStart;
        var normalizedEnd = end?.Date ?? defaultEnd;

        if (normalizedStart > normalizedEnd)
        {
            (normalizedStart, normalizedEnd) = (normalizedEnd, normalizedStart);
        }

        return (normalizedStart, normalizedEnd);
    }

    private static List<DepartmentLeaveBreakdown> BuildDepartmentLeave(List<DailyStatus> statuses)
    {
        var leaveStatuses = statuses
            .Where(s => s.StatusType == PersonnelStatusType.AnnualLeave ||
                        s.StatusType == PersonnelStatusType.ExcuseLeave ||
                        s.StatusType == PersonnelStatusType.SickLeave ||
                        s.StatusType == PersonnelStatusType.AdministrativeLeave)
            .Select(s => new
            {
                Department = s.Personnel?.Department ?? "Belirtilmemis",
                s.StatusType
            });

        return leaveStatuses
            .GroupBy(x => x.Department)
            .Select(group => new DepartmentLeaveBreakdown
            {
                Department = group.Key,
                AnnualLeaveDays = group.Count(x => x.StatusType == PersonnelStatusType.AnnualLeave),
                ExcuseLeaveDays = group.Count(x => x.StatusType == PersonnelStatusType.ExcuseLeave),
                SickLeaveDays = group.Count(x => x.StatusType == PersonnelStatusType.SickLeave),
                AdministrativeLeaveDays = group.Count(x => x.StatusType == PersonnelStatusType.AdministrativeLeave)
            })
            .OrderByDescending(x => x.TotalLeaveDays)
            .ToList();
    }

    private static List<ProjectAssignmentAggregate> BuildProjectAssignments(List<DailyStatus> statuses)
    {
        return statuses
            .Where(s => s.StatusType == PersonnelStatusType.Assignment)
            .Select(s => new
            {
                Key = $"{s.ProjectCode}|{s.ProjectName}|{s.Location}",
                s.ProjectCode,
                s.ProjectName,
                s.Location
            })
            .GroupBy(x => x.Key)
            .Select(group =>
            {
                var sample = group.First();
                return new ProjectAssignmentAggregate
                {
                    ProjectCode = sample.ProjectCode,
                    ProjectName = sample.ProjectName,
                    Location = sample.Location,
                    AssignmentDays = group.Count()
                };
            })
            .OrderByDescending(x => x.AssignmentDays)
            .ToList();
    }

    private static List<MonthlyTrendPoint> BuildMonthlyTrends(
        List<DailyStatus> statuses,
        List<Personnel> activePersonnel,
        DateTime start,
        DateTime end)
    {
        var trends = new Dictionary<string, MonthlyTrendPoint>();

        foreach (var status in statuses)
        {
            var monthKey = status.Date.ToString("yyyy-MM");
            if (!trends.TryGetValue(monthKey, out var existing))
            {
                existing = new MonthlyTrendPoint
                {
                    MonthKey = monthKey,
                    MonthStart = new DateOnly(status.Date.Year, status.Date.Month, 1)
                };
                trends[monthKey] = existing;
            }

            switch (status.StatusType)
            {
                case PersonnelStatusType.AnnualLeave:
                    existing.AnnualLeaveDays++;
                    break;
                case PersonnelStatusType.ExcuseLeave:
                case PersonnelStatusType.AdministrativeLeave:
                    existing.AdministrativeDays++;
                    break;
                case PersonnelStatusType.SickLeave:
                    existing.SickLeaveDays++;
                    break;
                case PersonnelStatusType.Assignment:
                    existing.AssignmentDays++;
                    break;
            }
        }

        var activeCount = activePersonnel.Count;
        if (activeCount == 0)
        {
            return trends.Values
                .OrderBy(t => t.MonthKey, StringComparer.Ordinal)
                .ToList();
        }

        var cursor = new DateTime(start.Year, start.Month, 1);
        var endCursor = new DateTime(end.Year, end.Month, 1);

        while (cursor <= endCursor)
        {
            var key = cursor.ToString("yyyy-MM");
            if (!trends.TryGetValue(key, out var point))
            {
                point = new MonthlyTrendPoint
                {
                    MonthKey = key,
                    MonthStart = new DateOnly(cursor.Year, cursor.Month, 1)
                };
                trends[key] = point;
            }

            var daysInMonth = DateTime.DaysInMonth(cursor.Year, cursor.Month);
            point.TotalCapacityDays = daysInMonth * activeCount;

            cursor = cursor.AddMonths(1);
        }

        foreach (var point in trends.Values)
        {
            var occupied = point.AnnualLeaveDays +
                           point.AdministrativeDays +
                           point.SickLeaveDays +
                           point.AssignmentDays;

            point.AvailableDays = Math.Max(0, point.TotalCapacityDays - occupied);
        }

        return trends.Values
            .OrderBy(t => t.MonthKey, StringComparer.Ordinal)
            .ToList();
    }

    private static List<DepartmentCapacityPoint> BuildCapacity(
        List<DailyStatus> statuses,
        List<Personnel> activePersonnel,
        DateTime start,
        DateTime end,
        int rangeDays)
    {
        var byDepartment = activePersonnel
            .GroupBy(p => p.Department ?? "Belirtilmemis")
            .Select(group => new
            {
                Department = group.Key,
                PersonnelIds = group.Select(p => p.PersonnelId).ToList(),
                Headcount = group.Count()
            })
            .ToDictionary(x => x.Department);

        var result = new List<DepartmentCapacityPoint>();

        foreach (var kvp in byDepartment)
        {
            var department = kvp.Key;
            var headcount = kvp.Value.Headcount;
            var totalCapacity = headcount * rangeDays;

            var occupied = statuses.Count(s =>
                (s.Personnel?.Department ?? "Belirtilmemis") == department &&
                s.StatusType != PersonnelStatusType.Normal);

            result.Add(new DepartmentCapacityPoint
            {
                Department = department,
                Headcount = headcount,
                OccupiedDays = occupied,
                AvailableDays = Math.Max(0, totalCapacity - occupied)
            });
        }

        var unassignedStatuses = statuses
            .Where(s => string.IsNullOrWhiteSpace(s.Personnel?.Department))
            .ToList();

        if (unassignedStatuses.Count > 0 && !byDepartment.ContainsKey("Belirtilmemis"))
        {
            var occupied = unassignedStatuses.Count(s => s.StatusType != PersonnelStatusType.Normal);
            result.Add(new DepartmentCapacityPoint
            {
                Department = "Belirtilmemis",
                Headcount = 0,
                OccupiedDays = occupied,
                AvailableDays = 0
            });
        }

        return result
            .OrderByDescending(r => r.Headcount)
            .ThenBy(r => r.Department, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}

public class PersonnelReportQuery
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class PersonnelReportOverviewResponse
{
    public DateOnly RangeStart { get; set; }
    public DateOnly RangeEnd { get; set; }
    public List<DepartmentLeaveBreakdown> DepartmentLeave { get; set; } = new();
    public List<ProjectAssignmentAggregate> ProjectAssignments { get; set; } = new();
    public List<MonthlyTrendPoint> MonthlyTrends { get; set; } = new();
    public List<DepartmentCapacityPoint> Capacity { get; set; } = new();
}

public class DepartmentLeaveBreakdown
{
    public string Department { get; set; } = string.Empty;
    public int AnnualLeaveDays { get; set; }
    public int ExcuseLeaveDays { get; set; }
    public int SickLeaveDays { get; set; }
    public int AdministrativeLeaveDays { get; set; }
    public int TotalLeaveDays =>
        AnnualLeaveDays + ExcuseLeaveDays + SickLeaveDays + AdministrativeLeaveDays;
}

public class ProjectAssignmentAggregate
{
    public string? ProjectCode { get; set; }
    public string? ProjectName { get; set; }
    public string? Location { get; set; }
    public int AssignmentDays { get; set; }
}

public class MonthlyTrendPoint
{
    public string MonthKey { get; set; } = string.Empty;
    public DateOnly MonthStart { get; set; }
    public int TotalCapacityDays { get; set; }
    public int AnnualLeaveDays { get; set; }
    public int AdministrativeDays { get; set; }
    public int SickLeaveDays { get; set; }
    public int AssignmentDays { get; set; }
    public int AvailableDays { get; set; }
}

public class DepartmentCapacityPoint
{
    public string Department { get; set; } = string.Empty;
    public int Headcount { get; set; }
    public int OccupiedDays { get; set; }
    public int AvailableDays { get; set; }
}


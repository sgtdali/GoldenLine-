using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class InventoryService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public InventoryService()
        : this(App.DbOptions)
    {
    }

    public InventoryService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<InventoryAssignmentDto>> GetAssignmentsAsync(int? personnelId, int? itemId, bool activeOnly = true)
    {
        await using var context = new AppDbContext(_dbOptions);

        var query = context.InventoryAssignments
            .AsNoTracking()
            .Include(a => a.EquipmentItem)
            .Include(a => a.Personnel)
            .AsQueryable();

        if (personnelId.HasValue)
        {
            query = query.Where(a => a.PersonnelId == personnelId.Value);
        }

        if (itemId.HasValue)
        {
            query = query.Where(a => a.EquipmentItemId == itemId.Value);
        }

        if (activeOnly)
        {
            query = query.Where(a => a.Status == "Active" && a.QuantityRemaining > 0);
        }

        var rows = await query
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync();

        return rows.Select(MapAssignment).ToList();
    }

    public async Task<List<InventoryMovementDto>> GetMovementsAsync(int? itemId, int? personnelId, int take = 200)
    {
        await using var context = new AppDbContext(_dbOptions);

        var query = context.InventoryMovements
            .AsNoTracking()
            .Include(m => m.EquipmentItem)
            .Include(m => m.Personnel)
            .OrderByDescending(m => m.CreatedAt)
            .AsQueryable();

        if (itemId.HasValue)
        {
            query = query.Where(m => m.EquipmentItemId == itemId.Value);
        }

        if (personnelId.HasValue)
        {
            query = query.Where(m => m.PersonnelId == personnelId.Value);
        }

        take = Math.Clamp(take, 20, 500);

        var rows = await query.Take(take).ToListAsync();
        return rows.Select(MapMovement).ToList();
    }

    public async Task<List<LocationListItemDto>> GetLocationsAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        return await context.Locations
            .AsNoTracking()
            .Where(l => l.IsActive)
            .OrderBy(l => l.Name)
            .Select(l => new LocationListItemDto
            {
                LocationId = l.LocationId,
                Name = l.Name,
                Code = l.Code,
            })
            .ToListAsync();
    }

    public async Task<List<ScrapLossReportRowDto>> GetScrapLossReportAsync(ScrapLossReportFilterDto filters)
    {
        await using var context = new AppDbContext(_dbOptions);

        var query = context.InventoryMovements
            .AsNoTracking()
            .Include(m => m.EquipmentItem)
            .Include(m => m.Personnel)
            .Where(m => m.MovementType == "SCRAP" || m.MovementType == "LOST")
            .AsQueryable();

        if (filters.StartDate.HasValue)
        {
            var start = filters.StartDate.Value.Date;
            query = query.Where(m => m.CreatedAt >= start);
        }

        if (filters.EndDate.HasValue)
        {
            var endExclusive = filters.EndDate.Value.Date.AddDays(1);
            query = query.Where(m => m.CreatedAt < endExclusive);
        }

        if (!string.IsNullOrWhiteSpace(filters.MovementType) &&
            (string.Equals(filters.MovementType, "SCRAP", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(filters.MovementType, "LOST", StringComparison.OrdinalIgnoreCase)))
        {
            var normalizedType = filters.MovementType!.ToUpperInvariant();
            query = query.Where(m => m.MovementType == normalizedType);
        }

        if (filters.ItemId.HasValue)
        {
            query = query.Where(m => m.EquipmentItemId == filters.ItemId.Value);
        }

        if (filters.PersonnelId.HasValue)
        {
            query = query.Where(m => m.PersonnelId == filters.PersonnelId.Value);
        }

        return await query
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new ScrapLossReportRowDto
            {
                MovementId = m.InventoryMovementId,
                CreatedAt = m.CreatedAt,
                MovementType = m.MovementType,
                ItemId = m.EquipmentItemId,
                ItemName = m.EquipmentItem!.KalemTanim,
                ItemCode = m.EquipmentItem.KalemNo,
                Quantity = m.Quantity,
                PersonnelId = m.PersonnelId,
                PersonnelName = m.Personnel != null ? m.Personnel.FullName : null,
                Reason = m.Reason,
            })
            .ToListAsync();
    }

    public async Task<StockOverviewResultDto> GetStockOverviewAsync(int? locationId, string? search)
    {
        await using var context = new AppDbContext(_dbOptions);

        var overview = await BuildStockOverviewAsync(context, locationId);
        var filtered = overview.Items.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            filtered = filtered.Where(item =>
                item.ItemName.ToLower().Contains(normalized) ||
                (!string.IsNullOrEmpty(item.ItemCode) && item.ItemCode.ToLower().Contains(normalized)));
        }

        var filteredList = filtered.ToList();
        var summary = new StockOverviewSummaryDto
        {
            TotalItems = filteredList.Count,
            TotalQuantityOnHand = filteredList.Sum(i => i.TotalOnHand),
            TotalQuantityAssigned = filteredList.Sum(i => i.TotalAssigned),
            TotalCriticalItems = filteredList.Count(i => i.IsBelowMinStock),
        };

        return new StockOverviewResultDto
        {
            Summary = summary,
            Items = filteredList,
        };
    }

    public async Task<CriticalStockReportDto> GetCriticalStockAsync(int? locationId, string? search)
    {
        await using var context = new AppDbContext(_dbOptions);

        var overview = await BuildStockOverviewAsync(context, locationId);
        var filtered = overview.Items.Where(item => item.IsBelowMinStock);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            filtered = filtered.Where(item =>
                item.ItemName.ToLower().Contains(normalized) ||
                (!string.IsNullOrEmpty(item.ItemCode) && item.ItemCode.ToLower().Contains(normalized)));
        }

        var criticalList = filtered.ToList();

        var summary = new StockOverviewSummaryDto
        {
            TotalItems = criticalList.Count,
            TotalQuantityOnHand = criticalList.Sum(i => i.TotalOnHand),
            TotalQuantityAssigned = criticalList.Sum(i => i.TotalAssigned),
            TotalCriticalItems = criticalList.Count,
        };

        return new CriticalStockReportDto
        {
            Summary = summary,
            Items = criticalList,
        };
    }

    public async Task<ActiveAssignmentsReportDto> GetActiveAssignmentsAsync(
        int? itemId,
        int? personnelId,
        string? aging,
        DateTime? assignedFrom,
        DateTime? assignedTo)
    {
        await using var context = new AppDbContext(_dbOptions);

        var query = context.InventoryAssignments
            .AsNoTracking()
            .Include(a => a.EquipmentItem)
            .Include(a => a.Personnel)
            .Where(a => a.Status == "Active" && a.QuantityRemaining > 0)
            .AsQueryable();

        if (itemId.HasValue)
        {
            query = query.Where(a => a.EquipmentItemId == itemId.Value);
        }

        if (personnelId.HasValue)
        {
            query = query.Where(a => a.PersonnelId == personnelId.Value);
        }

        if (assignedFrom.HasValue)
        {
            var fromDate = assignedFrom.Value.Date;
            query = query.Where(a => a.AssignedAt >= fromDate);
        }

        if (assignedTo.HasValue)
        {
            var toDate = assignedTo.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(a => a.AssignedAt <= toDate);
        }

        if (!string.IsNullOrWhiteSpace(aging) && !string.Equals(aging, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (int.TryParse(aging, out var minDays))
            {
                var threshold = DateTime.UtcNow.AddDays(-minDays);
                query = query.Where(a => a.AssignedAt <= threshold);
            }
        }

        var assignments = await query
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var rows = assignments.Select(a =>
        {
            var daysInUse = Math.Max(0, (int)(now - a.AssignedAt).TotalDays);
            return new ActiveAssignmentRowDto
            {
                AssignmentId = a.InventoryAssignmentId,
                ItemId = a.EquipmentItemId,
                ItemName = a.EquipmentItem?.KalemTanim ?? string.Empty,
                ItemCode = a.EquipmentItem?.KalemNo ?? string.Empty,
                PersonnelId = a.PersonnelId,
                PersonnelName = a.Personnel?.FullName ?? string.Empty,
                QuantityRemaining = a.QuantityRemaining,
                AssignedAt = a.AssignedAt,
                DaysInUse = daysInUse,
                AgingBucket = DetermineAgingBucket(daysInUse) ?? string.Empty,
            };
        }).ToList();

        var summary = new ActiveAssignmentsSummaryDto
        {
            TotalCount = rows.Count,
            Bucket0To30 = rows.Count(r => r.AgingBucket == "0-30"),
            Bucket31To60 = rows.Count(r => r.AgingBucket == "31-60"),
            Bucket61To90 = rows.Count(r => r.AgingBucket == "61-90"),
            Bucket90Plus = rows.Count(r => r.AgingBucket == "90+"),
        };

        return new ActiveAssignmentsReportDto
        {
            Rows = rows,
            Summary = summary,
        };
    }
    public async Task<InventoryCountSessionDto> CreateInventoryCountSessionAsync(CreateInventoryCountSessionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new InvalidOperationException("Sesyon ad\u0131 zorunludur.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var session = new InventoryCountSession
        {
            Name = request.Name.Trim(),
            LocationId = request.LocationId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = ResolveUser(request.CreatedBy),
            Status = "Open",
        };

        var items = await context.EquipmentItems
            .AsNoTracking()
            .Include(i => i.LocationStocks)
            .Select(i => new
            {
                i.EquipmentItemID,
                i.KalemTanim,
                i.KalemNo,
                i.Stok,
                LocationStocks = i.LocationStocks.Select(ls => new { ls.LocationId, ls.QuantityOnHand }).ToList(),
            })
            .ToListAsync();

        foreach (var item in items)
        {
            var systemQuantity = request.LocationId.HasValue
                ? item.LocationStocks
                    .Where(ls => ls.LocationId == request.LocationId.Value)
                    .Sum(ls => ls.QuantityOnHand)
                : item.Stok;

            session.Lines.Add(new InventoryCountLine
            {
                EquipmentItemId = item.EquipmentItemID,
                SystemQuantity = systemQuantity,
            });
        }

        context.InventoryCountSessions.Add(session);
        await context.SaveChangesAsync();

        var created = await context.InventoryCountSessions
            .Include(s => s.Location)
            .Include(s => s.Lines)
                .ThenInclude(l => l.EquipmentItem)
            .FirstAsync(s => s.InventoryCountSessionId == session.InventoryCountSessionId);

        return MapCountSession(created);
    }

    public async Task<List<InventoryCountSessionSummaryDto>> GetInventoryCountSessionsAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        var sessions = await context.InventoryCountSessions
            .AsNoTracking()
            .Include(s => s.Location)
            .Include(s => s.Lines)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sessions.Select(MapCountSessionSummary).ToList();
    }

    public async Task<InventoryCountSessionDto?> GetInventoryCountSessionAsync(int sessionId)
    {
        await using var context = new AppDbContext(_dbOptions);

        var session = await context.InventoryCountSessions
            .AsNoTracking()
            .Include(s => s.Location)
            .Include(s => s.Lines)
                .ThenInclude(l => l.EquipmentItem)
            .FirstOrDefaultAsync(s => s.InventoryCountSessionId == sessionId);

        return session == null ? null : MapCountSession(session);
    }

    public async Task UpdateCountLineAsync(int sessionId, int lineId, UpdateInventoryCountLineRequest request)
    {
        await using var context = new AppDbContext(_dbOptions);

        var session = await context.InventoryCountSessions
            .Include(s => s.Lines)
            .FirstOrDefaultAsync(s => s.InventoryCountSessionId == sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Oturum bulunamad\u0131.");
        }

        if (!string.Equals(session.Status, "Open", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Kapal\u0131 say\u0131m oturumlar\u0131 g\u00fcncellenemez.");
        }

        var line = session.Lines.FirstOrDefault(l => l.InventoryCountLineId == lineId);
        if (line == null)
        {
            throw new InvalidOperationException("Say\u0131m sat\u0131r\u0131 bulunamad\u0131.");
        }

        line.CountedQuantity = request.CountedQuantity;
        await context.SaveChangesAsync();
    }

    public async Task<InventoryCountSessionDto> FinalizeCountSessionAsync(int sessionId)
    {
        await using var context = new AppDbContext(_dbOptions);

        var session = await context.InventoryCountSessions
            .Include(s => s.Lines)
                .ThenInclude(l => l.EquipmentItem)
            .FirstOrDefaultAsync(s => s.InventoryCountSessionId == sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Oturum bulunamad\u0131.");
        }

        if (!string.Equals(session.Status, "Open", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Bu oturum zaten kapat\u0131lm\u0131\u015f.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            foreach (var line in session.Lines)
            {
                if (!line.CountedQuantity.HasValue)
                {
                    continue;
                }

                var difference = line.CountedQuantity.Value - line.SystemQuantity;
                if (difference == 0)
                {
                    continue;
                }

                var movement = new InventoryMovement
                {
                    EquipmentItemId = line.EquipmentItemId,
                    MovementType = difference < 0 ? "LOST" : "ADJUST",
                    Quantity = Math.Abs(difference),
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = ResolveUser(null),
                    Reason = difference < 0
                        ? $"Envanter say\u0131m\u0131 eksikli\u011fi (Oturum: {session.Name})"
                        : $"Envanter say\u0131m\u0131 fazlas\u0131 (Oturum: {session.Name})",
                };

                context.InventoryMovements.Add(movement);
                await context.SaveChangesAsync();

                await ApplyWarehouseStockDeltaAsync(context, line.EquipmentItemId, difference, session.LocationId);

                line.AdjustmentMovementId = movement.InventoryMovementId;
            }

            session.Status = "Closed";
            session.ClosedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        var updated = await context.InventoryCountSessions
            .AsNoTracking()
            .Include(s => s.Location)
            .Include(s => s.Lines)
                .ThenInclude(l => l.EquipmentItem)
            .FirstAsync(s => s.InventoryCountSessionId == sessionId);

        return MapCountSession(updated);
    }

    public async Task DeleteInventoryCountSessionAsync(int sessionId)
    {
        await using var context = new AppDbContext(_dbOptions);

        var session = await context.InventoryCountSessions
            .Include(s => s.Lines)
            .FirstOrDefaultAsync(s => s.InventoryCountSessionId == sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Oturum bulunamad\u0131.");
        }

        if (!string.Equals(session.Status, "Open", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Kapat\u0131lm\u0131\u015f oturum silinemez.");
        }

        context.InventoryCountSessions.Remove(session);
        await context.SaveChangesAsync();
    }
    public async Task<InventoryMovementReportDto> GetInventoryMovementReportAsync(InventoryMovementReportFilterDto filters)
    {
        await using var context = new AppDbContext(_dbOptions);

        var query = context.InventoryMovements
            .AsNoTracking()
            .Include(m => m.EquipmentItem)
            .Include(m => m.Personnel)
            .AsQueryable();

        if (filters.StartDate.HasValue)
        {
            var startDate = filters.StartDate.Value.Date;
            query = query.Where(m => m.CreatedAt >= startDate);
        }

        if (filters.EndDate.HasValue)
        {
            var endDate = filters.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(m => m.CreatedAt <= endDate);
        }

        if (!string.IsNullOrWhiteSpace(filters.MovementTypes))
        {
            var allowedTypes = filters.MovementTypes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToUpperInvariant())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (allowedTypes.Count > 0)
            {
                var includeOut = allowedTypes.Contains("OUT");
                var includeIn = allowedTypes.Contains("IN");
                var includeScrap = allowedTypes.Contains("SCRAP");
                var includeLost = allowedTypes.Contains("LOST");
                var includeAdjust = allowedTypes.Contains("ADJUST");

                query = query.Where(m =>
                    (includeOut && m.MovementType == "OUT") ||
                    (includeIn && m.MovementType == "IN") ||
                    (includeScrap && m.MovementType == "SCRAP") ||
                    (includeLost && m.MovementType == "LOST") ||
                    (includeAdjust && m.MovementType == "ADJUST"));
            }
        }

        if (filters.ItemId.HasValue)
        {
            query = query.Where(m => m.EquipmentItemId == filters.ItemId.Value);
        }

        if (filters.PersonnelId.HasValue)
        {
            query = query.Where(m => m.PersonnelId == filters.PersonnelId.Value);
        }

        var rows = await query
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new InventoryMovementReportRowDto
            {
                MovementId = m.InventoryMovementId,
                CreatedAt = m.CreatedAt,
                MovementType = m.MovementType,
                ItemId = m.EquipmentItemId,
                ItemName = m.EquipmentItem != null ? m.EquipmentItem.KalemTanim : string.Empty,
                ItemCode = m.EquipmentItem != null ? m.EquipmentItem.KalemNo : null,
                Quantity = m.Quantity,
                PersonnelId = m.PersonnelId,
                PersonnelName = m.Personnel != null ? m.Personnel.FullName : null,
                Reason = m.Reason,
            })
            .ToListAsync();

        var summary = new InventoryMovementReportSummaryDto
        {
            TotalCount = rows.Count,
            QuantityByMovementType = rows
                .GroupBy(r => r.MovementType)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(r => r.Quantity)),
        };

        return new InventoryMovementReportDto
        {
            Summary = summary,
            Rows = rows,
        };
    }

    public async Task<InventoryOperationResult> AssignToPersonnelAsync(InventoryOutRequest request)
    {
        await using var context = new AppDbContext(_dbOptions);

        var item = await context.EquipmentItems
            .Include(i => i.Assignments)
            .FirstOrDefaultAsync(i => i.EquipmentItemID == request.ItemId);

        if (item == null)
        {
            throw new InvalidOperationException("Malzeme bulunamad\u0131.");
        }

        var personnel = await context.Personnel.FindAsync(request.PersonnelId);
        if (personnel == null)
        {
            throw new InvalidOperationException("Personel bulunamad\u0131.");
        }

        var assignment = await GetOrCreateActiveAssignment(context, request.ItemId, request.PersonnelId);
        assignment.QuantityRemaining += request.Quantity;
        assignment.Status = "Active";
        assignment.ClosedAt = null;
        assignment.Note = request.Note ?? assignment.Note;

        await ApplyWarehouseStockDeltaAsync(context, item.EquipmentItemID, -request.Quantity, request.LocationId);
        item.AssignedQuantity += request.Quantity;

        var movement = new InventoryMovement
        {
            EquipmentItemId = item.EquipmentItemID,
            PersonnelId = request.PersonnelId,
            MovementType = "OUT",
            Quantity = request.Quantity,
            CreatedBy = ResolveUser(request.PerformedBy),
            Reason = request.Note,
            InventoryAssignment = assignment,
        };

        await PersistWithTransactionAsync(context, movement);

        var calibrationStatus = GetCalibrationStatus(item);
        string? calibrationWarningMessage = null;
        if (calibrationStatus == CalibrationStatus.Overdue)
        {
            calibrationWarningMessage = "Bu ekipman\u0131n kalibrasyon s\u00fcresi ge\u00e7mi\u015f durumda.";
        }
        else if (calibrationStatus == CalibrationStatus.Unknown)
        {
            calibrationWarningMessage = "Kalibrasyon bilgileri eksik, l\u00fctfen kalibrasyon tarihini ve periyodunu kontrol edin.";
        }

        return BuildOperationResult(item, assignment, movement, calibrationStatus, calibrationWarningMessage);
    }

    public async Task<InventoryOperationResult> ReturnFromPersonnelAsync(InventoryInRequest request)
    {
        await using var context = new AppDbContext(_dbOptions);

        var assignment = await GetActiveAssignment(context, request.ItemId, request.PersonnelId);
        if (assignment == null || assignment.QuantityRemaining < request.Quantity)
        {
            throw new InvalidOperationException("Personelde bu kadar zimmet bulunmuyor.");
        }

        var item = await context.EquipmentItems.FindAsync(request.ItemId);
        if (item == null)
        {
            throw new InvalidOperationException("Malzeme bulunamad\u0131.");
        }

        assignment.QuantityRemaining -= request.Quantity;
        if (assignment.QuantityRemaining == 0)
        {
            assignment.Status = "Returned";
            assignment.ClosedAt = DateTime.UtcNow;
        }

        await ApplyWarehouseStockDeltaAsync(context, item.EquipmentItemID, request.Quantity, request.LocationId);
        item.AssignedQuantity = Math.Max(0, item.AssignedQuantity - request.Quantity);

        var movement = new InventoryMovement
        {
            EquipmentItemId = request.ItemId,
            PersonnelId = request.PersonnelId,
            MovementType = "IN",
            Quantity = request.Quantity,
            CreatedBy = ResolveUser(request.PerformedBy),
            Reason = request.Note,
            InventoryAssignment = assignment,
        };

        await PersistWithTransactionAsync(context, movement);

        return BuildOperationResult(item, assignment, movement);
    }

    public async Task<InventoryOperationResult> ScrapAsync(InventoryAdjustmentRequest request)
    {
        await using var context = new AppDbContext(_dbOptions);

        var item = await context.EquipmentItems.FindAsync(request.ItemId);
        if (item == null)
        {
            throw new InvalidOperationException("Malzeme bulunamad\u0131.");
        }

        InventoryAssignment? assignment = null;

        if (request.PersonnelId.HasValue)
        {
            assignment = await GetActiveAssignment(context, request.ItemId, request.PersonnelId.Value);
            if (assignment == null || assignment.QuantityRemaining < request.Quantity)
            {
                throw new InvalidOperationException("Personelde bu kadar zimmet bulunmuyor.");
            }

            assignment.QuantityRemaining -= request.Quantity;
            if (assignment.QuantityRemaining == 0)
            {
                assignment.Status = "Scrapped";
                assignment.ClosedAt = DateTime.UtcNow;
            }

            item.AssignedQuantity = Math.Max(0, item.AssignedQuantity - request.Quantity);
        }
        else
        {
            if (item.Stok < request.Quantity)
            {
                throw new InvalidOperationException("Depoda yeterli stok yok.");
            }

            await ApplyWarehouseStockDeltaAsync(context, item.EquipmentItemID, -request.Quantity, request.LocationId);
        }

        var movement = new InventoryMovement
        {
            EquipmentItemId = request.ItemId,
            PersonnelId = request.PersonnelId,
            MovementType = "SCRAP",
            Quantity = request.Quantity,
            CreatedBy = ResolveUser(request.PerformedBy),
            Reason = request.Reason,
            InventoryAssignment = assignment,
        };

        await PersistWithTransactionAsync(context, movement);

        return BuildOperationResult(item, assignment, movement);
    }

    public async Task<InventoryOperationResult> LostAsync(InventoryAdjustmentRequest request)
    {
        await using var context = new AppDbContext(_dbOptions);

        var item = await context.EquipmentItems.FindAsync(request.ItemId);
        if (item == null)
        {
            throw new InvalidOperationException("Malzeme bulunamad\u0131.");
        }

        InventoryAssignment? assignment = null;

        if (request.PersonnelId.HasValue)
        {
            assignment = await GetActiveAssignment(context, request.ItemId, request.PersonnelId.Value);
            if (assignment == null || assignment.QuantityRemaining < request.Quantity)
            {
                throw new InvalidOperationException("Personelde bu kadar zimmet bulunmuyor.");
            }

            assignment.QuantityRemaining -= request.Quantity;
            if (assignment.QuantityRemaining == 0)
            {
                assignment.Status = "Lost";
                assignment.ClosedAt = DateTime.UtcNow;
            }

            item.AssignedQuantity = Math.Max(0, item.AssignedQuantity - request.Quantity);
        }
        else
        {
            if (item.Stok < request.Quantity)
            {
                throw new InvalidOperationException("Depoda yeterli stok yok.");
            }

            await ApplyWarehouseStockDeltaAsync(context, item.EquipmentItemID, -request.Quantity, request.LocationId);
        }

        var movement = new InventoryMovement
        {
            EquipmentItemId = request.ItemId,
            PersonnelId = request.PersonnelId,
            MovementType = "LOST",
            Quantity = request.Quantity,
            CreatedBy = ResolveUser(request.PerformedBy),
            Reason = request.Reason,
            InventoryAssignment = assignment,
        };

        await PersistWithTransactionAsync(context, movement);

        return BuildOperationResult(item, assignment, movement);
    }

    public async Task<LocationStockBackfillResult> BackfillLocationStocksAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        var locations = await context.Locations
            .Where(l => l.IsActive)
            .OrderBy(l => l.LocationId)
            .ToListAsync();

        if (locations.Count == 0)
        {
            throw new InvalidOperationException("Aktif lokasyon bulunamad\u0131.");
        }

        var defaultLocation = locations
            .FirstOrDefault(l => string.Equals(l.Code, "MAIN", StringComparison.OrdinalIgnoreCase))
            ?? locations.First();

        var locationLookup = locations
            .Where(l => !string.IsNullOrWhiteSpace(l.Code))
            .ToDictionary(l => l.Code!.Trim().ToUpperInvariant(), l => l);

        var items = await context.EquipmentItems
            .Include(i => i.LocationStocks)
            .ToListAsync();

        var result = new LocationStockBackfillResult
        {
            TotalItems = items.Count,
        };
        var missingLocationSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in items)
        {
            var locationCode = (item.Lokasyon ?? string.Empty).Trim();
            Location targetLocation;
            if (!string.IsNullOrEmpty(locationCode) && locationLookup.TryGetValue(locationCode.ToUpperInvariant(), out var resolved))
            {
                targetLocation = resolved;
            }
            else
            {
                if (!string.IsNullOrEmpty(locationCode) && missingLocationSet.Add(locationCode))
                {
                    result.MissingLocationCodes.Add(locationCode);
                }
                targetLocation = defaultLocation;
            }

            var targetQuantity = Math.Max(item.Stok, 0);
            var locationStocks = item.LocationStocks.ToList();
            var targetStock = locationStocks.FirstOrDefault(ls => ls.LocationId == targetLocation.LocationId);
            var touchedItem = false;

            foreach (var other in locationStocks.Where(ls => ls.LocationId != targetLocation.LocationId))
            {
                if (other.QuantityOnHand != 0)
                {
                    other.QuantityOnHand = 0;
                    touchedItem = true;
                    result.ClearedOtherLocationStocks++;
                }
            }

            if (targetStock == null)
            {
                if (locationStocks.Count == 1)
                {
                    var single = locationStocks[0];
                    single.LocationId = targetLocation.LocationId;
                    targetStock = single;
                    touchedItem = true;
                    result.ReassignedLocationStocks++;
                }
                else
                {
                    targetStock = new ItemLocationStock
                    {
                        EquipmentItemId = item.EquipmentItemID,
                        LocationId = targetLocation.LocationId,
                    };
                    item.LocationStocks.Add(targetStock);
                    touchedItem = true;
                    result.CreatedLocationStocks++;
                }
            }

            if (targetStock.QuantityOnHand != targetQuantity)
            {
                targetStock.QuantityOnHand = targetQuantity;
                touchedItem = true;
            }

            if (touchedItem)
            {
                result.ItemsAligned++;
            }
        }

        await context.SaveChangesAsync();
        return result;
    }
    private static async Task<StockOverviewResultDto> BuildStockOverviewAsync(AppDbContext context, int? locationId)
    {
        var itemData = await context.EquipmentItems
            .AsNoTracking()
            .Include(i => i.LocationStocks)
                .ThenInclude(ls => ls.Location)
            .Select(i => new
            {
                i.EquipmentItemID,
                i.KalemTanim,
                i.KalemNo,
                i.AssignedQuantity,
                i.MinStock,
                Locations = i.LocationStocks.Select(ls => new
                {
                    ls.LocationId,
                    ls.QuantityOnHand,
                    LocationName = ls.Location.Name,
                    LocationCode = ls.Location.Code,
                }).ToList(),
            })
            .ToListAsync();

        var result = new StockOverviewResultDto();

        foreach (var item in itemData)
        {
            var relevantLocations = locationId.HasValue
                ? item.Locations.Where(ls => ls.LocationId == locationId.Value).ToList()
                : item.Locations;

            var totalOnHand = relevantLocations.Sum(ls => ls.QuantityOnHand);
            var totalAssigned = item.AssignedQuantity;
            var snapshot = new ItemStockSnapshotDto
            {
                ItemId = item.EquipmentItemID,
                ItemName = item.KalemTanim,
                ItemCode = item.KalemNo,
                TotalOnHand = totalOnHand,
                TotalAssigned = totalAssigned,
                TotalInSystem = totalOnHand + totalAssigned,
                MinStock = item.MinStock,
                IsBelowMinStock = item.MinStock.HasValue
                    && item.MinStock.Value > 0
                    && totalOnHand < item.MinStock.Value,
                Locations = relevantLocations
                    .Select(ls => new ItemLocationStockSnapshotDto
                    {
                        LocationId = ls.LocationId,
                        LocationName = ls.LocationName,
                        LocationCode = ls.LocationCode,
                        QuantityOnHand = ls.QuantityOnHand,
                    })
                    .ToList(),
            };

            result.Items.Add(snapshot);
        }

        result.Summary = new StockOverviewSummaryDto
        {
            TotalItems = result.Items.Count,
            TotalQuantityOnHand = result.Items.Sum(i => i.TotalOnHand),
            TotalQuantityAssigned = result.Items.Sum(i => i.TotalAssigned),
            TotalCriticalItems = result.Items.Count(i => i.IsBelowMinStock),
        };

        return result;
    }

    private static CalibrationStatus GetCalibrationStatus(EquipmentItem item, DateTime? referenceDate = null)
    {
        const int dueSoonWindowDays = 30;

        if (!item.IsCalibrationRequired)
        {
            return CalibrationStatus.NotRequired;
        }

        if (!item.LastCalibrationDate.HasValue ||
            !item.CalibrationIntervalDays.HasValue ||
            item.CalibrationIntervalDays <= 0)
        {
            return CalibrationStatus.Unknown;
        }

        var now = (referenceDate ?? DateTime.UtcNow).Date;
        var nextDueDate = item.LastCalibrationDate.Value.Date.AddDays(item.CalibrationIntervalDays.Value);

        if (now > nextDueDate)
        {
            return CalibrationStatus.Overdue;
        }

        if ((nextDueDate - now).TotalDays <= dueSoonWindowDays)
        {
            return CalibrationStatus.DueSoon;
        }

        return CalibrationStatus.Ok;
    }

    private static string? DetermineAgingBucket(int daysInUse)
    {
        if (daysInUse <= 30)
        {
            return "0-30";
        }
        if (daysInUse <= 60)
        {
            return "31-60";
        }
        if (daysInUse <= 90)
        {
            return "61-90";
        }
        return "90+";
    }

    private static async Task<InventoryAssignment?> GetActiveAssignment(AppDbContext context, int itemId, int personnelId) =>
        await context.InventoryAssignments
            .Include(a => a.EquipmentItem)
            .FirstOrDefaultAsync(a =>
                a.EquipmentItemId == itemId &&
                a.PersonnelId == personnelId &&
                a.Status == "Active" &&
                a.QuantityRemaining > 0);

    private static async Task<InventoryAssignment> GetOrCreateActiveAssignment(AppDbContext context, int itemId, int personnelId)
    {
        var assignment = await GetActiveAssignment(context, itemId, personnelId);
        if (assignment != null)
        {
            return assignment;
        }

        assignment = new InventoryAssignment
        {
            EquipmentItemId = itemId,
            PersonnelId = personnelId,
            QuantityRemaining = 0,
            Status = "Active",
            AssignedAt = DateTime.UtcNow,
        };

        context.InventoryAssignments.Add(assignment);
        return assignment;
    }

    private static async Task PersistWithTransactionAsync(AppDbContext context, InventoryMovement movement)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            context.InventoryMovements.Add(movement);
            await context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static InventoryOperationResult BuildOperationResult(
        EquipmentItem item,
        InventoryAssignment? assignment,
        InventoryMovement movement,
        CalibrationStatus? calibrationStatus = null,
        string? calibrationWarningMessage = null)
    {
        var resolvedStatus = calibrationStatus ?? (item.IsCalibrationRequired ? GetCalibrationStatus(item) : CalibrationStatus.NotRequired);

        return new InventoryOperationResult
        {
            Stock = new StockSnapshotDto
            {
                ItemId = item.EquipmentItemID,
                OnHandQuantity = item.Stok,
                AssignedQuantity = item.AssignedQuantity,
            },
            Assignment = assignment != null ? MapAssignment(assignment) : null,
            Movement = MapMovement(movement),
            CalibrationStatus = resolvedStatus.ToString(),
            CalibrationWarning = !string.IsNullOrWhiteSpace(calibrationWarningMessage),
            CalibrationWarningMessage = calibrationWarningMessage,
        };
    }

    private static InventoryCountSessionSummaryDto MapCountSessionSummary(InventoryCountSession session)
    {
        var totalLines = session.Lines?.Count ?? 0;
        var countedLines = session.Lines?.Count(l => l.CountedQuantity.HasValue) ?? 0;

        return new InventoryCountSessionSummaryDto
        {
            SessionId = session.InventoryCountSessionId,
            Name = session.Name,
            LocationName = session.Location?.Name,
            CreatedAt = session.CreatedAt,
            ClosedAt = session.ClosedAt,
            Status = session.Status,
            TotalLines = totalLines,
            CountedLines = countedLines,
        };
    }

    private static InventoryCountSessionDto MapCountSession(InventoryCountSession session)
    {
        return new InventoryCountSessionDto
        {
            SessionId = session.InventoryCountSessionId,
            Name = session.Name,
            LocationName = session.Location?.Name,
            CreatedAt = session.CreatedAt,
            ClosedAt = session.ClosedAt,
            Status = session.Status,
            TotalLines = session.Lines.Count,
            CountedLines = session.Lines.Count(l => l.CountedQuantity.HasValue),
            Lines = session.Lines.Select(l => new InventoryCountLineDto
            {
                LineId = l.InventoryCountLineId,
                ItemId = l.EquipmentItemId,
                ItemName = l.EquipmentItem?.KalemTanim ?? string.Empty,
                ItemCode = l.EquipmentItem?.KalemNo,
                SystemQuantity = l.SystemQuantity,
                CountedQuantity = l.CountedQuantity,
                AdjustmentMovementId = l.AdjustmentMovementId,
            }).ToList(),
        };
    }

    private static InventoryAssignmentDto MapAssignment(InventoryAssignment assignment) =>
        new InventoryAssignmentDto
        {
            AssignmentId = assignment.InventoryAssignmentId,
            ItemId = assignment.EquipmentItemId,
            ItemCode = assignment.EquipmentItem?.KalemNo ?? string.Empty,
            ItemName = assignment.EquipmentItem?.KalemTanim ?? string.Empty,
            PersonnelId = assignment.PersonnelId,
            PersonnelName = assignment.Personnel?.FullName ?? string.Empty,
            QuantityRemaining = assignment.QuantityRemaining,
            Status = assignment.Status,
            AssignedAt = assignment.AssignedAt,
            ClosedAt = assignment.ClosedAt,
            Note = assignment.Note,
        };

    private static InventoryMovementDto MapMovement(InventoryMovement movement) =>
        new InventoryMovementDto
        {
            MovementId = movement.InventoryMovementId,
            ItemId = movement.EquipmentItemId,
            ItemCode = movement.EquipmentItem?.KalemNo ?? string.Empty,
            ItemName = movement.EquipmentItem?.KalemTanim ?? string.Empty,
            PersonnelId = movement.PersonnelId,
            PersonnelName = movement.Personnel?.FullName,
            MovementType = movement.MovementType,
            Quantity = movement.Quantity,
            CreatedAt = movement.CreatedAt,
            CreatedBy = movement.CreatedBy,
            Reason = movement.Reason,
        };

    private static async Task ApplyWarehouseStockDeltaAsync(
        AppDbContext context,
        int equipmentItemId,
        int deltaQuantity,
        int? locationId = null,
        CancellationToken cancellationToken = default)
    {
        var item = await context.EquipmentItems
            .Include(i => i.LocationStocks)
            .FirstOrDefaultAsync(i => i.EquipmentItemID == equipmentItemId, cancellationToken);

        if (item == null)
        {
            throw new InvalidOperationException($"Equipment item {equipmentItemId} not found.");
        }

        var resolvedLocationId = locationId ?? await GetDefaultLocationIdAsync(context, cancellationToken);

        var locationStock = item.LocationStocks.FirstOrDefault(ls => ls.LocationId == resolvedLocationId);
        if (locationStock == null)
        {
            locationStock = new ItemLocationStock
            {
                EquipmentItemId = item.EquipmentItemID,
                LocationId = resolvedLocationId,
                QuantityOnHand = 0,
            };
            item.LocationStocks.Add(locationStock);
        }

        var newQuantity = locationStock.QuantityOnHand + deltaQuantity;
        if (newQuantity < 0)
        {
            throw new InvalidOperationException("Location stock cannot be negative.");
        }

        locationStock.QuantityOnHand = newQuantity;
        item.Stok = item.LocationStocks.Sum(ls => ls.QuantityOnHand);
    }

    private static async Task<int> GetDefaultLocationIdAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var defaultLocation = await context.Locations
            .OrderBy(l => l.LocationId)
            .FirstOrDefaultAsync(l => l.IsActive, cancellationToken);

        if (defaultLocation == null)
        {
            throw new InvalidOperationException("No active locations found.");
        }

        return defaultLocation.LocationId;
    }

    private static string ResolveUser(string? provided) =>
        string.IsNullOrWhiteSpace(provided)
            ? (Environment.UserName ?? "system")
            : provided.Trim();
}
public class InventoryOutRequest
{
    [Required]
    public int ItemId { get; set; }

    [Required]
    public int PersonnelId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? Note { get; set; }

    public string? PerformedBy { get; set; }

    public int? LocationId { get; set; }
}

public class InventoryInRequest
{
    [Required]
    public int ItemId { get; set; }

    [Required]
    public int PersonnelId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? Note { get; set; }

    public string? PerformedBy { get; set; }

    public int? LocationId { get; set; }
}

public class InventoryAdjustmentRequest
{
    [Required]
    public int ItemId { get; set; }

    public int? PersonnelId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    public string? Reason { get; set; }

    public string? PerformedBy { get; set; }

    public int? LocationId { get; set; }
}

public class InventoryAssignmentDto
{
    public int AssignmentId { get; set; }
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int PersonnelId { get; set; }
    public string PersonnelName { get; set; } = string.Empty;
    public int QuantityRemaining { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? Note { get; set; }
}

public class InventoryMovementDto
{
    public int MovementId { get; set; }
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int? PersonnelId { get; set; }
    public string? PersonnelName { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
public class StockSnapshotDto
{
    public int ItemId { get; set; }
    public int OnHandQuantity { get; set; }
    public int AssignedQuantity { get; set; }
}

public class InventoryOperationResult
{
    public StockSnapshotDto Stock { get; set; } = new();
    public InventoryAssignmentDto? Assignment { get; set; }
    public InventoryMovementDto Movement { get; set; } = new();
    public bool CalibrationWarning { get; set; }
    public string? CalibrationWarningMessage { get; set; }
    public string? CalibrationStatus { get; set; }
}

public class LocationStockBackfillResult
{
    public int TotalItems { get; set; }
    public int ItemsAligned { get; set; }
    public int CreatedLocationStocks { get; set; }
    public int ReassignedLocationStocks { get; set; }
    public int ClearedOtherLocationStocks { get; set; }
    public List<string> MissingLocationCodes { get; set; } = new();
}

public class ScrapLossReportFilterDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? MovementType { get; set; }
    public int? ItemId { get; set; }
    public int? PersonnelId { get; set; }
}

public class ScrapLossReportRowDto
{
    public int MovementId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int? PersonnelId { get; set; }
    public string? PersonnelName { get; set; }
    public string? Reason { get; set; }
}

public class LocationListItemDto
{
    public int LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
}

public class InventoryMovementReportFilterDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? MovementTypes { get; set; }
    public int? ItemId { get; set; }
    public int? PersonnelId { get; set; }
}

public class InventoryMovementReportRowDto
{
    public int MovementId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemCode { get; set; }
    public int Quantity { get; set; }
    public int? PersonnelId { get; set; }
    public string? PersonnelName { get; set; }
    public string? Reason { get; set; }
}

public class InventoryMovementReportSummaryDto
{
    public int TotalCount { get; set; }
    public Dictionary<string, int> QuantityByMovementType { get; set; } = new();
}

public class InventoryMovementReportDto
{
    public InventoryMovementReportSummaryDto Summary { get; set; } = new();
    public List<InventoryMovementReportRowDto> Rows { get; set; } = new();
}

public class CriticalStockReportDto
{
    public StockOverviewSummaryDto Summary { get; set; } = new();
    public List<ItemStockSnapshotDto> Items { get; set; } = new();
}
public class CreateInventoryCountSessionRequest
{
    public string Name { get; set; } = string.Empty;
    public int? LocationId { get; set; }
    public string? CreatedBy { get; set; }
}

public class UpdateInventoryCountLineRequest
{
    public int? CountedQuantity { get; set; }
}

public class InventoryCountSessionSummaryDto
{
    public int SessionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalLines { get; set; }
    public int CountedLines { get; set; }
}

public class InventoryCountSessionDto : InventoryCountSessionSummaryDto
{
    public List<InventoryCountLineDto> Lines { get; set; } = new();
}

public class InventoryCountLineDto
{
    public int LineId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemCode { get; set; }
    public int SystemQuantity { get; set; }
    public int? CountedQuantity { get; set; }
    public int Difference => (CountedQuantity ?? SystemQuantity) - SystemQuantity;
    public int? AdjustmentMovementId { get; set; }
}

public class ActiveAssignmentsReportDto
{
    public List<ActiveAssignmentRowDto> Rows { get; set; } = new();
    public ActiveAssignmentsSummaryDto Summary { get; set; } = new();
}

public class ActiveAssignmentRowDto
{
    public int AssignmentId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public int PersonnelId { get; set; }
    public string PersonnelName { get; set; } = string.Empty;
    public int QuantityRemaining { get; set; }
    public DateTime AssignedAt { get; set; }
    public int DaysInUse { get; set; }
    public string AgingBucket { get; set; } = string.Empty;
}

public class ActiveAssignmentsSummaryDto
{
    public int TotalCount { get; set; }
    public int Bucket0To30 { get; set; }
    public int Bucket31To60 { get; set; }
    public int Bucket61To90 { get; set; }
    public int Bucket90Plus { get; set; }
}


using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class CalibrationService : ICalibrationService
{
    private const int DueSoonWindowDays = 30;

    public CalibrationStatus GetCalibrationStatus(EquipmentItem item, DateTime? referenceDate = null)
    {
        if (item == null)
        {
            throw new ArgumentNullException(nameof(item));
        }

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

        if ((nextDueDate - now).TotalDays <= DueSoonWindowDays)
        {
            return CalibrationStatus.DueSoon;
        }

        return CalibrationStatus.Ok;
    }
}


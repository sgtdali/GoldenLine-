using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public interface ICalibrationService
{
    CalibrationStatus GetCalibrationStatus(EquipmentItem item, DateTime? referenceDate = null);
}


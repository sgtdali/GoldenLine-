using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models;

public class LogisticsCrateItem
{
    [Key]
    public int LogisticsCrateItemId { get; set; }

    [MaxLength(50)]
    public string CrateId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string ProductId { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;

    public LogisticsCrate? Crate { get; set; }
    public LogisticsProduct? Product { get; set; }
}


using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models;

public class LogisticsCrate
{
    [Key]
    [MaxLength(50)]
    public string CrateId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public decimal WeightCapacity { get; set; }

    public int ProjectId { get; set; }
    public int? LineProjectId { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "staged";

    public int? ShipmentId { get; set; }
    [MaxLength(50)]
    public string? ContainerId { get; set; }

    public decimal PositionX { get; set; }
    public decimal PositionY { get; set; }
    public decimal Rotation { get; set; }

    public Project? Project { get; set; }
    public Project? LineProject { get; set; }
    public Shipment? Shipment { get; set; }
    public LogisticsContainer? Container { get; set; }
    public ICollection<LogisticsCrateItem> Items { get; set; } = new List<LogisticsCrateItem>();
}


using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models;

public class LogisticsContainer
{
    [Key]
    [MaxLength(50)]
    public string ContainerId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty;

    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public decimal MaxWeight { get; set; }

    public int? ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }
    public ICollection<LogisticsCrate> Crates { get; set; } = new List<LogisticsCrate>();
}


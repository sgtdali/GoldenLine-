using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models;

public class Shipment
{
    [Key]
    public int ShipmentId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(200)]
    public string Destination { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "planned";

    [Required]
    [MaxLength(20)]
    public string ShipmentType { get; set; } = "land";

    public int ProjectId { get; set; }

    public Project? Project { get; set; }
}


using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models;

public class LogisticsProduct
{
    [Key]
    [MaxLength(50)]
    public string ProductId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public decimal Weight { get; set; }

    [MaxLength(50)]
    public string Color { get; set; } = string.Empty;

    public int ProjectId { get; set; }
    public int? LineProjectId { get; set; }

    public Project? Project { get; set; }
    public Project? LineProject { get; set; }

    public ICollection<LogisticsCrateItem> CrateItems { get; set; } = new List<LogisticsCrateItem>();
}


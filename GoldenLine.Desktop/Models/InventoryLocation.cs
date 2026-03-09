using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class InventoryLocation
    {
        [Key]
        public int InventoryLocationID { get; set; }

        [Required]
        [MaxLength(60)]
        public string Code { get; set; } = null!;

        [MaxLength(200)]
        public string? Description { get; set; }
    }
}



using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class Supplier
    {
        [Key]
        public int SupplierId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = null!;

        [MaxLength(200)]
        public string? ContactName { get; set; }

        [MaxLength(120)]
        public string? Phone { get; set; }

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(400)]
        public string? Address { get; set; }

        [MaxLength(4000)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<EquipmentItem> EquipmentItems { get; set; } = new List<EquipmentItem>();
    }
}



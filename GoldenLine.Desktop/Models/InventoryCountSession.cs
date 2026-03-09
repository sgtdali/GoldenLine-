using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class InventoryCountSession
    {
        [Key]
        public int InventoryCountSessionId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = null!;

        public int? LocationId { get; set; }

        public Location? Location { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime? ClosedAt { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Open";

        public ICollection<InventoryCountLine> Lines { get; set; } = new List<InventoryCountLine>();
    }
}



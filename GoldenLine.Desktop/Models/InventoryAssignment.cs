using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class InventoryAssignment
    {
        [Key]
        public int InventoryAssignmentId { get; set; }

        [Required]
        public int EquipmentItemId { get; set; }

        public EquipmentItem EquipmentItem { get; set; } = null!;

        [Required]
        public int PersonnelId { get; set; }

        public Personnel Personnel { get; set; } = null!;

        [Required]
        public int QuantityRemaining { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Active";

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ClosedAt { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        public ICollection<InventoryMovement> Movements { get; set; } = new List<InventoryMovement>();
    }
}



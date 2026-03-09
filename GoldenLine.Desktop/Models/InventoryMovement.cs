using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoldenLine.Desktop.Models
{
    [Table("InventoryMovements")]
    public class InventoryMovement
    {
        [Key]
        public int InventoryMovementId { get; set; }

        [Required]
        public int EquipmentItemId { get; set; }

        public EquipmentItem? EquipmentItem { get; set; }

        public int? PersonnelId { get; set; }

        public Personnel? Personnel { get; set; }

        [Required]
        [MaxLength(20)]
        public string MovementType { get; set; } = "OUT";

        [Required]
        public int Quantity { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(150)]
        public string CreatedBy { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Reason { get; set; }

        public int? InventoryAssignmentId { get; set; }

        public InventoryAssignment? InventoryAssignment { get; set; }
    }
}



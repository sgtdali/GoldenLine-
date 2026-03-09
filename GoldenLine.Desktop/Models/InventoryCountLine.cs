using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class InventoryCountLine
    {
        [Key]
        public int InventoryCountLineId { get; set; }

        [Required]
        public int InventoryCountSessionId { get; set; }

        public InventoryCountSession Session { get; set; } = null!;

        [Required]
        public int EquipmentItemId { get; set; }

        public EquipmentItem EquipmentItem { get; set; } = null!;

        [Required]
        public int SystemQuantity { get; set; }

        public int? CountedQuantity { get; set; }

        public int? AdjustmentMovementId { get; set; }

        public InventoryMovement? AdjustmentMovement { get; set; }
    }
}



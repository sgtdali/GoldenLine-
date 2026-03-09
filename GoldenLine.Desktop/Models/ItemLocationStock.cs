using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class ItemLocationStock
    {
        [Key]
        public int ItemLocationStockId { get; set; }

        [Required]
        public int EquipmentItemId { get; set; }

        public EquipmentItem EquipmentItem { get; set; } = null!;

        [Required]
        public int LocationId { get; set; }

        public Location Location { get; set; } = null!;

        public int QuantityOnHand { get; set; }
    }
}



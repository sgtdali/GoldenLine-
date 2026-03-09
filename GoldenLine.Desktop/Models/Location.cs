using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class Location
    {
        [Key]
        public int LocationId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = null!;

        [MaxLength(50)]
        public string? Code { get; set; }

        [MaxLength(400)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<ItemLocationStock> ItemLocationStocks { get; set; } = new List<ItemLocationStock>();
    }
}



using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoldenLine.Desktop.Models
{
    public class Edge
    {
        [Key]
        [StringLength(100)]
        public string EdgeID { get; set; } = null!; // React Flow ID (string)

        [Required]
        public int ProjeID { get; set; }
        
        [Required]
        [StringLength(50)]
        public string KaynakNodeID { get; set; } = null!; // Source node ID
        
        [Required]
        [StringLength(50)]
        public string HedefNodeID { get; set; } = null!; // Target node ID

        public string? DataJson { get; set; }

        // Navigation property
        [ForeignKey("ProjeID")]
        public virtual Project Project { get; set; } = null!;
    }
}



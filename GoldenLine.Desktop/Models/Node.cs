using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GoldenLine.Desktop.Models
{
    public class Node
    {
        [Key]
        [StringLength(50)]
        public string NodeID { get; set; } = null!; // React Flow ID (string)

        [Required]
        public int ProjeID { get; set; }
        
        [StringLength(200)]
        public string NodeAdi { get; set; } = null!;
        
        [StringLength(50)]
        public string Tip { get; set; } = null!; // e.g., "custom", "grup"
        
        [Precision(18, 2)]
        public decimal X_Pozisyonu { get; set; }
        
        [Precision(18, 2)]
        public decimal Y_Pozisyonu { get; set; }

        public string? DataJson { get; set; }

        [StringLength(50)]
        public string? ParentNodeId { get; set; }

        [ForeignKey("ParentNodeId")]
        public virtual Node? ParentNode { get; set; }

        public virtual ICollection<Node> ChildNodes { get; set; } = new List<Node>();

        // Navigation property
        [ForeignKey("ProjeID")]
        public virtual Project Project { get; set; } = null!;
    }
}



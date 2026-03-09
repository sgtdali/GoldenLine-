using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class Project
    {
        [Key]
        public int ProjeID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string ProjeAdi { get; set; } = null!;
        
        public DateTime OlusturmaTarihi { get; set; }

        [StringLength(100)]
        public string? OlusturanKullanici { get; set; }

        public DateTime? SonDuzenlemeTarihi { get; set; }

        [StringLength(100)]
        public string? SonDuzenleyenKullanici { get; set; }

        [StringLength(20)]
        public string ProjectType { get; set; } = "machine";

        public int? ParentProjectId { get; set; }

        // Navigation properties (Bu projedeki nodelar ve kenarlar)
        public virtual ICollection<Node> Nodes { get; set; }
        public virtual ICollection<Edge> Edges { get; set; }

        public Project()
        {
            Nodes = new HashSet<Node>();
            Edges = new HashSet<Edge>();
        }
    }
}



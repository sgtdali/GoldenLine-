using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using GoldenLine.Desktop.Data;

#nullable disable

namespace GoldenLine.Desktop.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20251222123000_AddProjectHierarchyFields")]
    partial class AddProjectHierarchyFields
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "8.0.11");

            modelBuilder.Entity("GoldenLine.Desktop.Models.Project", b =>
                {
                    b.Property<int>("ProjeID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("OlusturanKullanici")
                        .HasMaxLength(100)
                        .HasColumnType("TEXT");

                    b.Property<DateTime>("OlusturmaTarihi")
                        .HasColumnType("TEXT");

                    b.Property<int?>("ParentProjectId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("ProjectType")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("TEXT");

                    b.Property<string>("ProjeAdi")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("TEXT");

                    b.Property<DateTime?>("SonDuzenlemeTarihi")
                        .HasColumnType("TEXT");

                    b.Property<string>("SonDuzenleyenKullanici")
                        .HasMaxLength(100)
                        .HasColumnType("TEXT");

                    b.HasKey("ProjeID");

                    b.ToTable("Projects");
                });
        }
    }
}


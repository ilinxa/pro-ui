"use client";
import { ProjectCardProps } from "@/types/projectsType";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Building2 } from "lucide-react";
import Link from "next/link";




const statusLabels = {
  completed: "Tamamlandı",
  ongoing: "Devam Ediyor",
  planned: "Planlanan",
};

const statusColors = {
  completed: "bg-green-500/20 text-green-400",
  ongoing: "bg-accent/20 text-accent",
  planned: "bg-blue-500/20 text-blue-400",
};

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.1 }}
    >
      <Link href={`/projects/${project.id}`} className="group block">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-500 hover:-translate-y-2">
          {/* Image */}
          <div className="relative aspect-16/10 overflow-hidden">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-primary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            
            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                {statusLabels[project.status]}
              </span>
            </div>

            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                <Building2 className="w-3 h-3 mr-1.5" />
                {project.category}
              </span>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">
                Detayları Gör
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-display font-semibold text-foreground mb-3 group-hover:text-accent transition-colors line-clamp-2">
              {project.title}
            </h3>
            
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" />
                {project.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent" />
                {project.year}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;

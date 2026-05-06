export interface Project {
  id: string;
  title: string;
  category: string;
  location: string;
  year: string;
  image: string;
  description: string;
  status: "completed" | "ongoing" | "planned";
}

export interface ProjectCardProps {
  project: Project;
  index: number;
}
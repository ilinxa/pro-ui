import { Building2 } from "lucide-react";
import PageHero from "../commons/PageHero";


const ProjectsHero = () => {
  return (
    <PageHero
      badge="Projelerimiz"
      badgeIcon={Building2}
      title="Hayata Geçirdiğimiz"
      titleHighlight="Dönüşüm Projeleri"
      description="Türkiye genelinde gerçekleştirdiğimiz kentsel dönüşüm, sosyal kalkınma ve sürdürülebilir gelişim projelerimizi keşfedin."
    />
  );
};

export default ProjectsHero;

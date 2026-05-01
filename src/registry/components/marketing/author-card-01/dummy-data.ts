import type { AuthorCard01Props } from "./types";

export const AUTHOR_CARD_01_DUMMY: Record<string, AuthorCard01Props> = {
  withImage: {
    name: "Maya Chen",
    role: "Senior Editor",
    bio: "Specializes in sustainable urbanism and environmental journalism. Previously at Vox and The Atlantic.",
    imageSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&auto=format",
    imageAlt: "Maya Chen",
  },
  withoutImage: {
    name: "Anonymous Contributor",
    role: "Guest Writer",
    bio: "Writes occasionally about local environmental stories.",
  },
  collective: {
    name: "The Editorial Team",
    role: "Collective",
    bio: "Reporting and analysis from across the newsroom — covering policy, climate, and community.",
  },
  clickable: {
    name: "Daniel Park",
    role: "Product Designer",
    bio: "Currently designing onboarding flows; previously at Atlassian and Notion.",
    imageSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&auto=format",
    href: "/team/daniel-park",
  },
  turkish: {
    name: "Aylin Demir",
    role: "Kıdemli Editör",
    bio: "Sürdürülebilir şehircilik ve çevre konularında uzmanlaşmış gazetecilik deneyimine sahip.",
    labels: { heading: "Yazar Hakkında" },
  },
};

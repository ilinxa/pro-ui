export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Invited" | "Suspended";
  lastSeen: string;
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: "u_01",
    name: "Aria Montgomery",
    email: "aria@ilinxa.dev",
    role: "Owner",
    status: "Active",
    lastSeen: "2 minutes ago",
  },
  {
    id: "u_02",
    name: "Bilal Hashemi",
    email: "bilal@ilinxa.dev",
    role: "Admin",
    status: "Active",
    lastSeen: "1 hour ago",
  },
  {
    id: "u_03",
    name: "Camille Okafor",
    email: "camille@ilinxa.dev",
    role: "Member",
    status: "Invited",
    lastSeen: "—",
  },
  {
    id: "u_04",
    name: "Dimitri Volkov",
    email: "dimitri@ilinxa.dev",
    role: "Member",
    status: "Active",
    lastSeen: "Yesterday",
  },
  {
    id: "u_05",
    name: "Esme Tanaka",
    email: "esme@ilinxa.dev",
    role: "Viewer",
    status: "Suspended",
    lastSeen: "3 weeks ago",
  },
];

import { notFound } from "next/navigation";
import { SandboxShell } from "../_components/sandbox-shell";
import { getSandbox } from "../_lib/manifest";
import EventDetailPage01 from "./event-detail-page-01";
import EventDetailPage01Docs from "./docs";

const meta = getSandbox("event-detail-page-01");

export const metadata = {
  title: meta ? `${meta.title} — ilinxa-ui-pro` : "Sandbox",
  description: meta?.description,
};

export default function EventDetailPage01Route() {
  if (!meta) notFound();
  return (
    <SandboxShell
      meta={meta}
      demo={<EventDetailPage01 />}
      docs={<EventDetailPage01Docs />}
    />
  );
}

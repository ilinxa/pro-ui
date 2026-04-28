import { Template } from "./_template";
import { TEMPLATE_DUMMY } from "./dummy-data";

export default function TemplateDemo() {
  return (
    <Template
      title={TEMPLATE_DUMMY.title}
      description={TEMPLATE_DUMMY.description}
    />
  );
}

import { ForceGraph } from "./force-graph";
import { FORCE_GRAPH_DUMMY } from "./dummy-data";

export default function ForceGraphDemo() {
  return (
    <ForceGraph
      title={FORCE_GRAPH_DUMMY.title}
      description={FORCE_GRAPH_DUMMY.description}
    />
  );
}

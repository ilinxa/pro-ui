"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSigma,
} from "@react-sigma/core";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import Graph from "graphology";
import "@react-sigma/core/lib/style.css";

type TagKey = "philosophy" | "science" | "art" | "history" | "tech" | "math";

const TAG_COLORS: Record<TagKey, string> = {
  philosophy: "#e8b65a",
  science: "#7fb8d6",
  art: "#d97a7a",
  history: "#c4a47c",
  tech: "#8fb87f",
  math: "#b48fc4",
};

type NodeData = { id: string; label: string; tag: TagKey; degree: number };
type LinkData = { source: string; target: string };
type GraphData = { nodes: NodeData[]; links: LinkData[] };

function LoadGraph({ data }: { data: GraphData }) {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new Graph();

    data.nodes.forEach((n) => {
      graph.addNode(n.id, {
        label: n.label,
        tag: n.tag,
        size: 4 + Math.sqrt(n.degree || 1) * 1.4,
        color: TAG_COLORS[n.tag] || "#cccccc",
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
      });
    });

    data.links.forEach((l) => {
      if (graph.hasNode(l.source) && graph.hasNode(l.target)) {
        graph.addEdge(l.source, l.target, {
          size: 0.5,
          color: "rgba(232, 200, 140, 0.18)",
        });
      }
    });

    loadGraph(graph);
  }, [loadGraph, data]);

  return null;
}

function Layout() {
  const { start, stop, kill } = useWorkerLayoutForceAtlas2({
    settings: {
      gravity: 1,
      scalingRatio: 10,
      slowDown: 5,
      barnesHutOptimize: true,
    },
  });

  useEffect(() => {
    start();
    const timeout = setTimeout(() => stop(), 4000);
    return () => {
      clearTimeout(timeout);
      kill();
    };
  }, [start, stop, kill]);

  return null;
}

function GraphEvents({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    registerEvents({
      enterNode: (e) => setHoveredId(e.node),
      leaveNode: () => setHoveredId(null),
      clickNode: (e) => onSelect(selectedId === e.node ? null : e.node),
      clickStage: () => onSelect(null),
    });
  }, [registerEvents, selectedId, onSelect]);

  useEffect(() => {
    const focus = hoveredId || selectedId;
    const graph = sigma.getGraph();
    const focusSet = focus
      ? new Set<string>([focus, ...graph.neighbors(focus)])
      : null;

    sigma.setSetting("nodeReducer", (node, data) => {
      if (!focusSet) return data;
      if (focusSet.has(node)) {
        return { ...data, highlighted: true, zIndex: 1 };
      }
      return {
        ...data,
        color: "rgba(245, 232, 210, 0.12)",
        label: "",
        zIndex: 0,
      };
    });

    sigma.setSetting("edgeReducer", (edge, data) => {
      if (!focusSet) return data;
      const [s, t] = graph.extremities(edge);
      if (focusSet.has(s) && focusSet.has(t)) {
        return { ...data, color: "rgba(232, 200, 140, 0.7)", size: 1 };
      }
      return { ...data, color: "rgba(232, 200, 140, 0.04)" };
    });

    sigma.refresh();
  }, [hoveredId, selectedId, sigma]);

  return null;
}

export default function ObsidianGraph({ data }: { data?: GraphData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graphData = useMemo(() => data || sampleData(), [data]);

  const nodeIndex = useMemo(() => {
    const map = new Map<string, NodeData>();
    graphData.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graphData]);

  const selectedNode = selectedId ? nodeIndex.get(selectedId) : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0908",
        position: "relative",
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: "#f5e8d2",
      }}
    >
      <SigmaContainer
        style={{
          height: "100%",
          width: "100%",
          background: "#0a0908",
        }}
        settings={{
          renderLabels: true,
          labelColor: { color: "rgba(245, 232, 210, 0.7)" },
          labelFont: 'Georgia, "Times New Roman", serif',
          labelSize: 11,
          labelDensity: 0.5,
          labelGridCellSize: 80,
          labelRenderedSizeThreshold: 6,
          defaultEdgeColor: "rgba(232, 200, 140, 0.18)",
          allowInvalidContainer: true,
        }}
      >
        <LoadGraph data={graphData} />
        <Layout />
        <GraphEvents selectedId={selectedId} onSelect={setSelectedId} />
      </SigmaContainer>

      {selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            padding: "14px 18px",
            background: "rgba(20, 17, 14, 0.85)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${TAG_COLORS[selectedNode.tag] || "#888"}40`,
            borderRadius: 2,
            maxWidth: 320,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: TAG_COLORS[selectedNode.tag] || "#888",
              fontFamily: '"SF Mono", Menlo, monospace',
              marginBottom: 6,
            }}
          >
            {selectedNode.tag}
          </div>
          <div style={{ fontSize: 18, fontStyle: "italic" }}>
            {selectedNode.label}
          </div>
        </div>
      )}
    </div>
  );
}

function sampleData(): GraphData {
  const TAGS: TagKey[] = ["philosophy", "science", "art", "history", "tech", "math"];
  const TITLES = [
    "Wittgenstein", "Language Games", "Tractatus", "Philosophy of Mind",
    "Consciousness", "Qualia", "Phenomenology", "Husserl", "Heidegger",
    "Being and Time", "Existentialism", "Sartre", "Camus", "Absurdism",
    "Stoicism", "Marcus Aurelius", "Epictetus", "Seneca",
    "Quantum Mechanics", "Wave Function", "Schrodinger", "Heisenberg",
    "Uncertainty Principle", "Many-Worlds", "Copenhagen", "Bell's Theorem",
    "Entanglement", "General Relativity", "Special Relativity", "Spacetime",
    "Einstein", "Black Holes", "Event Horizon", "Hawking Radiation",
    "Information Paradox", "Holographic Principle", "String Theory",
    "Renaissance", "Florence", "Medici", "Leonardo da Vinci", "Vitruvian Man",
    "Sfumato", "Chiaroscuro", "Caravaggio", "Baroque", "Bernini",
    "Roman Empire", "Augustus", "Pax Romana", "Byzantium", "Constantinople",
    "Hagia Sophia", "Justinian", "Theodora",
    "Turing Machine", "Halting Problem", "Computability", "Lambda Calculus",
    "Functional Programming", "Type Theory", "Category Theory", "Monads",
    "Topology", "Manifolds", "Riemann", "Non-Euclidean",
    "Godel", "Incompleteness", "Hilbert's Program", "Cantor", "Set Theory",
    "Infinity", "Transfinite", "Continuum Hypothesis",
  ];

  const nodes: NodeData[] = TITLES.map((label, i) => ({
    id: `n${i}`,
    label,
    tag: TAGS[i % TAGS.length],
    degree: 0,
  }));

  const links: LinkData[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].tag === nodes[j].tag && Math.random() < 0.25) {
        const key = `${i}-${j}`;
        if (!seen.has(key)) {
          links.push({ source: nodes[i].id, target: nodes[j].id });
          nodes[i].degree++;
          nodes[j].degree++;
          seen.add(key);
        }
      }
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    if (Math.random() < 0.1) {
      const j = Math.floor(Math.random() * nodes.length);
      if (j !== i) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          links.push({ source: nodes[i].id, target: nodes[j].id });
          nodes[i].degree++;
          nodes[j].degree++;
          seen.add(key);
        }
      }
    }
  }

  return { nodes, links };
}

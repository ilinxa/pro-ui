// ============================================================================
// Obsidian-style Graph View — Sigma.js + react-sigma (FIXED)
// ============================================================================
//
// Fixes from the previous version:
//   1. Used wrong layout hook (`useLayoutForceAtlas2` returns positions/assign,
//      NOT start/stop). Fixed: use `useWorkerLayoutForceAtlas2` for the
//      continuous worker mode.
//   2. Missing peer package: `@react-sigma/layout-core`.
//   3. Sample data had a "// ... etc" comment as placeholder — actually
//      populated now (60+ titles).
//   4. Initial node positions were Math.random() (range 0..1, too cramped).
//      Fixed: spread across a sensible range.
//   5. Selection state was duplicated across components and could desync.
//      Fixed: single source of truth lifted to the parent.
//   6. Added explicit container size requirement comment (Sigma needs a
//      sized container or it won't render at all — a common "blank canvas"
//      footgun).
//
// ----------------------------------------------------------------------------
// Setup (run in your project root):
// ----------------------------------------------------------------------------
//   npm install sigma graphology @react-sigma/core \
//               @react-sigma/layout-core \
//               @react-sigma/layout-forceatlas2 \
//               graphology-layout-forceatlas2
//
//   React 18+ is required.
//
// ----------------------------------------------------------------------------
// Usage:
// ----------------------------------------------------------------------------
//   import ObsidianGraph from "./ObsidianGraph";
//
//   // The parent MUST give it a sized container, e.g.:
//   <div style={{ width: "100vw", height: "100vh" }}>
//     <ObsidianGraph />
//   </div>
// ============================================================================

import React, { useEffect, useState, useMemo } from "react";
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSigma,
} from "@react-sigma/core";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import Graph from "graphology";
import "@react-sigma/core/lib/style.css";

// ---------- Theme ----------
const TAG_COLORS = {
  philosophy: "#e8b65a",
  science: "#7fb8d6",
  art: "#d97a7a",
  history: "#c4a47c",
  tech: "#8fb87f",
  math: "#b48fc4",
};

// ============================================================================
// 1. GRAPH LOADER
// Populates the graphology instance from {nodes, links} data.
// ============================================================================
function LoadGraph({ data }) {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new Graph();

    data.nodes.forEach((n) => {
      graph.addNode(n.id, {
        label: n.label,
        tag: n.tag,
        size: 4 + Math.sqrt(n.degree || 1) * 1.4,
        color: TAG_COLORS[n.tag] || "#cccccc",
        // Spread initial positions over a wider range so ForceAtlas2 has
        // something to push apart. Tiny ranges produce a long visual settle.
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
      });
    });

    data.links.forEach((l) => {
      // Guard: only add edge if both endpoints exist (defensive).
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

// ============================================================================
// 2. LAYOUT — uses useWorkerLayoutForceAtlas2 for continuous worker mode.
// This was the main bug: the previous version called useLayoutForceAtlas2
// (one-shot hook) and tried to destructure { start, stop } which don't exist
// on that hook.
// ============================================================================
function Layout() {
  const { start, stop, kill } = useWorkerLayoutForceAtlas2({
    settings: {
      gravity: 1,
      scalingRatio: 10,
      slowDown: 5,
      barnesHutOptimize: true, // O(n log n) instead of O(n²) — for >1k nodes
    },
  });

  useEffect(() => {
    start();
    // Settle for 4s then stop to save CPU.
    const timeout = setTimeout(() => stop(), 4000);
    return () => {
      clearTimeout(timeout);
      kill(); // kill terminates the worker; stop just pauses it
    };
  }, [start, stop, kill]);

  return null;
}

// ============================================================================
// 3. INTERACTIONS — hover highlighting, click selection, neighbor focus.
// Selection state is lifted to the parent (see ObsidianGraph) — this
// component only handles hover and dispatches selection changes upward.
// ============================================================================
function GraphEvents({ selectedId, onSelect }) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    registerEvents({
      enterNode: (e) => setHoveredId(e.node),
      leaveNode: () => setHoveredId(null),
      clickNode: (e) => {
        // Click toggles selection.
        onSelect(selectedId === e.node ? null : e.node);
      },
      clickStage: () => {
        // Click on empty space deselects.
        onSelect(null);
      },
    });
  }, [registerEvents, selectedId, onSelect]);

  // Reducer pattern: re-style nodes/edges based on hover/select state
  // without mutating the underlying graph data. Sigma calls these on each
  // render to compute the visual attributes.
  useEffect(() => {
    const focus = hoveredId || selectedId;
    const graph = sigma.getGraph();
    const focusSet = focus
      ? new Set([focus, ...graph.neighbors(focus)])
      : null;

    sigma.setSetting("nodeReducer", (node, data) => {
      if (!focusSet) return data;
      if (focusSet.has(node)) {
        return { ...data, highlighted: true, zIndex: 1 };
      }
      // Dim non-focus nodes.
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

    // Refresh so reducers are applied immediately.
    sigma.refresh();
  }, [hoveredId, selectedId, sigma]);

  return null;
}

// ============================================================================
// 4. THE COMPONENT
// ============================================================================
export default function ObsidianGraph({ data }) {
  // Single source of truth for selection — passed down to GraphEvents.
  const [selectedId, setSelectedId] = useState(null);

  const graphData = useMemo(() => data || sampleData(), [data]);

  // Look up the selected node's attributes for the detail panel.
  // We can't read from the graphology instance directly here (it's owned
  // by Sigma's context), so we keep a denormalized lookup over the data.
  const nodeIndex = useMemo(() => {
    const map = new Map();
    graphData.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graphData]);

  const selectedNode = selectedId ? nodeIndex.get(selectedId) : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",   // IMPORTANT: parent must give this a sized container
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
          allowInvalidContainer: true, // helps with HMR / strict-mode double-mounts
        }}
      >
        <LoadGraph data={graphData} />
        <Layout />
        <GraphEvents selectedId={selectedId} onSelect={setSelectedId} />
      </SigmaContainer>

      {/* Selected node panel */}
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

// ============================================================================
// Sample data generator — replace with your real source
// ============================================================================
function sampleData() {
  const TAGS = ["philosophy", "science", "art", "history", "tech", "math"];
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

  const nodes = TITLES.map((label, i) => ({
    id: `n${i}`,
    label,
    tag: TAGS[i % TAGS.length],
    degree: 0,
  }));

  const links = [];
  const seen = new Set();

  // Within-tag clustering: nodes that share a tag link with ~25% probability.
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

  // Cross-tag bridges so the graph isn't fully disconnected by tag.
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
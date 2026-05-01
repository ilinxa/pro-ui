import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

// ---------- Sample knowledge-graph data ----------
// Mimics the structure of an Obsidian vault: notes linked to other notes.
const TAGS = ["philosophy", "science", "art", "history", "tech", "math"];

const NOTE_TITLES = [
  "Wittgenstein", "Language Games", "Tractatus", "Philosophy of Mind",
  "Consciousness", "Qualia", "Phenomenology", "Husserl", "Heidegger",
  "Being and Time", "Existentialism", "Sartre", "Camus", "Absurdism",
  "Stoicism", "Marcus Aurelius", "Epictetus", "Seneca",
  "Quantum Mechanics", "Wave Function", "Schrödinger", "Heisenberg",
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
  "Gödel", "Incompleteness", "Hilbert's Program", "Cantor", "Set Theory",
  "Infinity", "Transfinite", "Continuum Hypothesis",
  "Bauhaus", "Mondrian", "De Stijl", "Kandinsky", "Abstract Expressionism",
  "Pollock", "Rothko", "Color Field",
];

function buildGraph() {
  const nodes = NOTE_TITLES.map((title, i) => ({
    id: `n${i}`,
    label: title,
    tag: TAGS[i % TAGS.length],
    // Initial random-ish position so the simulation starts settled-ish
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 600,
  }));

  const links = [];
  const seen = new Set();
  // Cluster within tag
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].tag === nodes[j].tag && Math.random() < 0.18) {
        const k = `${i}-${j}`;
        if (!seen.has(k)) {
          links.push({ source: nodes[i].id, target: nodes[j].id });
          seen.add(k);
        }
      }
    }
  }
  // Cross-cluster bridges
  for (let i = 0; i < nodes.length; i++) {
    if (Math.random() < 0.12) {
      const j = Math.floor(Math.random() * nodes.length);
      if (j !== i) {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(k)) {
          links.push({ source: nodes[i].id, target: nodes[j].id });
          seen.add(k);
        }
      }
    }
  }
  return { nodes, links };
}

// Tag → accent color (warm, atmospheric — Obsidian "lights in the dark" feel)
const TAG_COLORS = {
  philosophy: "#e8b65a",
  science: "#7fb8d6",
  art: "#d97a7a",
  history: "#c4a47c",
  tech: "#8fb87f",
  math: "#b48fc4",
};

export default function ObsidianGraph() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const simulationRef = useRef(null);
  const transformRef = useRef(d3.zoomIdentity);
  const hoveredRef = useRef(null);
  const selectedRef = useRef(null);
  const dataRef = useRef(buildGraph());
  const linkIndexRef = useRef(new Map()); // adjacency for neighbor highlighting

  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [stats, setStats] = useState({ nodes: 0, links: 0 });

  // Controls
  const [linkForce, setLinkForce] = useState(60);
  const [chargeForce, setChargeForce] = useState(-180);
  const [labelThreshold, setLabelThreshold] = useState(0.6);
  const [activeTags, setActiveTags] = useState(() => new Set(TAGS));

  // ---------- Build adjacency once ----------
  useEffect(() => {
    const adj = new Map();
    const { nodes, links } = dataRef.current;
    nodes.forEach((n) => adj.set(n.id, new Set()));
    links.forEach((l) => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    });
    linkIndexRef.current = adj;
    setStats({ nodes: nodes.length, links: links.length });
  }, []);

  // ---------- Simulation setup ----------
  useEffect(() => {
    const { nodes, links } = dataRef.current;

    const sim = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(linkForce)
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(chargeForce))
      .force("center", d3.forceCenter(0, 0).strength(0.05))
      .force("collide", d3.forceCollide(8))
      .alphaDecay(0.02);

    simulationRef.current = sim;
    return () => sim.stop();
  }, []); // build once

  // Update forces when sliders change
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    sim.force("link").distance(linkForce);
    sim.force("charge").strength(chargeForce);
    sim.alpha(0.5).restart();
  }, [linkForce, chargeForce]);

  // ---------- Render loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let resizeObs;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    resizeObs = new ResizeObserver(resize);
    resizeObs.observe(container);

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const t = transformRef.current;
      const { nodes, links } = dataRef.current;
      const adj = linkIndexRef.current;
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const focus = hovered || selected;

      const focusSet = focus ? new Set([focus, ...(adj.get(focus) || [])]) : null;

      // Atmospheric background — radial vignette
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
      grad.addColorStop(0, "#1a1612");
      grad.addColorStop(1, "#0a0908");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Apply zoom/pan
      ctx.save();
      ctx.translate(t.x + w / 2, t.y + h / 2);
      ctx.scale(t.k, t.k);

      // ---------- Edges ----------
      ctx.lineWidth = 0.6 / t.k;
      links.forEach((l) => {
        const s = l.source;
        const tgt = l.target;
        const sActive = activeTags.has(s.tag);
        const tActive = activeTags.has(tgt.tag);
        if (!sActive || !tActive) return;

        let alpha = 0.18;
        if (focusSet) {
          if (focusSet.has(s.id) && focusSet.has(tgt.id)) {
            alpha = 0.7;
          } else {
            alpha = 0.04;
          }
        }
        ctx.strokeStyle = `rgba(232, 200, 140, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
      });

      // ---------- Nodes ----------
      nodes.forEach((n) => {
        const active = activeTags.has(n.tag);
        if (!active) return;

        const degree = (adj.get(n.id)?.size || 0);
        const r = 3 + Math.sqrt(degree) * 1.4;
        const color = TAG_COLORS[n.tag] || "#cccccc";

        let alpha = 1;
        if (focusSet && !focusSet.has(n.id)) alpha = 0.18;

        // Glow
        if (focus === n.id || (focusSet && focusSet.has(n.id))) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Selected ring
        if (selected === n.id) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#fff7e6";
          ctx.lineWidth = 1.5 / t.k;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // ---------- Labels ----------
      // Show all labels above zoom threshold; otherwise only hovered/selected/neighbors
      const showAllLabels = t.k >= labelThreshold;
      ctx.font = `${11 / t.k}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      nodes.forEach((n) => {
        if (!activeTags.has(n.tag)) return;
        const isFocus = focusSet && focusSet.has(n.id);
        if (!showAllLabels && !isFocus) return;

        const degree = adj.get(n.id)?.size || 0;
        const r = 3 + Math.sqrt(degree) * 1.4;

        let alpha = isFocus ? 1 : Math.min(1, (t.k - labelThreshold) * 2.2);
        if (focusSet && !isFocus) alpha *= 0.25;
        if (alpha <= 0.02) return;

        ctx.fillStyle = `rgba(245, 232, 210, ${alpha})`;
        ctx.fillText(n.label, n.x, n.y + r + 3 / t.k);
      });

      ctx.restore();
    };

    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      resizeObs?.disconnect();
    };
  }, [activeTags, labelThreshold]);

  // ---------- Interaction: zoom, pan, hover, click, drag ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const sim = simulationRef.current;
    let dragging = null;

    const screenToWorld = (sx, sy) => {
      const rect = container.getBoundingClientRect();
      const t = transformRef.current;
      const x = (sx - rect.left - rect.width / 2 - t.x) / t.k;
      const y = (sy - rect.top - rect.height / 2 - t.y) / t.k;
      return [x, y];
    };

    const findNode = (sx, sy) => {
      const [wx, wy] = screenToWorld(sx, sy);
      const { nodes } = dataRef.current;
      const adj = linkIndexRef.current;
      // reverse so we hit "topmost"
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!activeTags.has(n.tag)) continue;
        const degree = adj.get(n.id)?.size || 0;
        const r = 3 + Math.sqrt(degree) * 1.4 + 4; // generous hit area
        const dx = n.x - wx;
        const dy = n.y - wy;
        if (dx * dx + dy * dy <= r * r) return n;
      }
      return null;
    };

    const zoom = d3
      .zoom()
      .scaleExtent([0.15, 6])
      .filter((event) => {
        // Don't pan when starting on a node (so we can drag instead)
        if (event.type === "mousedown") {
          const n = findNode(event.clientX, event.clientY);
          return !n;
        }
        return !event.button;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
      });

    d3.select(canvas).call(zoom);

    const onMove = (e) => {
      if (dragging) {
        const [wx, wy] = screenToWorld(e.clientX, e.clientY);
        dragging.fx = wx;
        dragging.fy = wy;
        return;
      }
      const n = findNode(e.clientX, e.clientY);
      hoveredRef.current = n?.id || null;
      setHoveredLabel(n?.label || null);
      canvas.style.cursor = n ? "pointer" : "grab";
    };

    const onDown = (e) => {
      const n = findNode(e.clientX, e.clientY);
      if (!n) return;
      dragging = n;
      n.fx = n.x;
      n.fy = n.y;
      sim.alphaTarget(0.3).restart();
      canvas.style.cursor = "grabbing";
    };

    const onUp = (e) => {
      if (dragging) {
        dragging.fx = null;
        dragging.fy = null;
        sim.alphaTarget(0);
        dragging = null;
      } else {
        // treat as click
        const n = findNode(e.clientX, e.clientY);
        if (n) {
          selectedRef.current = selectedRef.current === n.id ? null : n.id;
          setSelectedNode(selectedRef.current ? n : null);
        } else {
          selectedRef.current = null;
          setSelectedNode(null);
        }
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [activeTags]);

  const toggleTag = useCallback((tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const resetView = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    d3.select(canvas)
      .transition()
      .duration(500)
      .call(d3.zoom().transform, d3.zoomIdentity);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0a0908",
        color: "#f5e8d2",
        fontFamily: 'Georgia, "Times New Roman", serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(232, 200, 140, 0.55)",
            marginBottom: 4,
          }}
        >
          vault graph
        </div>
        <div
          style={{
            fontSize: 28,
            fontStyle: "italic",
            fontWeight: 400,
            color: "#f5e8d2",
            letterSpacing: "-0.01em",
          }}
        >
          A Constellation of Notes
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(245, 232, 210, 0.4)",
            marginTop: 6,
            fontFamily: '"SF Mono", Menlo, monospace',
          }}
        >
          {stats.nodes} nodes · {stats.links} links · powered by d3-force + canvas
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, cursor: "grab" }}
      >
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>

      {/* Controls panel */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 240,
          padding: "18px 18px 16px",
          background: "rgba(20, 17, 14, 0.78)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(232, 200, 140, 0.12)",
          borderRadius: 2,
          fontSize: 11,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(232, 200, 140, 0.6)",
            marginBottom: 14,
            fontFamily: '"SF Mono", Menlo, monospace',
          }}
        >
          ⊹ Forces
        </div>

        <Slider
          label="Link distance"
          value={linkForce}
          min={20}
          max={150}
          onChange={setLinkForce}
        />
        <Slider
          label="Repulsion"
          value={-chargeForce}
          min={20}
          max={500}
          onChange={(v) => setChargeForce(-v)}
        />
        <Slider
          label="Label fade"
          value={Math.round(labelThreshold * 100)}
          min={20}
          max={200}
          onChange={(v) => setLabelThreshold(v / 100)}
        />

        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(232, 200, 140, 0.6)",
            margin: "20px 0 10px",
            fontFamily: '"SF Mono", Menlo, monospace',
          }}
        >
          ⊹ Filter by tag
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TAGS.map((tag) => {
            const active = activeTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  background: active ? TAG_COLORS[tag] : "transparent",
                  color: active ? "#0a0908" : "rgba(245, 232, 210, 0.4)",
                  border: `1px solid ${active ? TAG_COLORS[tag] : "rgba(232, 200, 140, 0.2)"}`,
                  padding: "3px 9px",
                  fontSize: 10,
                  fontFamily: '"SF Mono", Menlo, monospace',
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  borderRadius: 1,
                  transition: "all 200ms",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <button
          onClick={resetView}
          style={{
            marginTop: 18,
            width: "100%",
            background: "transparent",
            border: "1px solid rgba(232, 200, 140, 0.25)",
            color: "rgba(245, 232, 210, 0.7)",
            padding: "6px",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: '"SF Mono", Menlo, monospace',
            cursor: "pointer",
            borderRadius: 1,
          }}
        >
          ↺ Reset view
        </button>
      </div>

      {/* Hover tooltip */}
      {hoveredLabel && !selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            fontSize: 13,
            fontStyle: "italic",
            color: "rgba(245, 232, 210, 0.85)",
            letterSpacing: "0.01em",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          ↳ {hoveredLabel}
        </div>
      )}

      {/* Selected node detail */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            padding: "14px 18px",
            background: "rgba(20, 17, 14, 0.85)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${TAG_COLORS[selectedNode.tag]}40`,
            borderRadius: 2,
            maxWidth: 320,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: TAG_COLORS[selectedNode.tag],
              fontFamily: '"SF Mono", Menlo, monospace',
              marginBottom: 6,
            }}
          >
            {selectedNode.tag}
          </div>
          <div
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: "#f5e8d2",
              marginBottom: 4,
            }}
          >
            {selectedNode.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(245, 232, 210, 0.5)",
              fontFamily: '"SF Mono", Menlo, monospace',
            }}
          >
            {linkIndexRef.current.get(selectedNode.id)?.size || 0} connections
          </div>
        </div>
      )}

      {/* Legend / hint */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 24,
          fontSize: 10,
          color: "rgba(245, 232, 210, 0.35)",
          fontFamily: '"SF Mono", Menlo, monospace',
          letterSpacing: "0.1em",
          textAlign: "right",
          lineHeight: 1.7,
          zIndex: 10,
        }}
      >
        scroll to zoom · drag to pan<br />
        click node to pin · drag node to move
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            color: "rgba(245, 232, 210, 0.7)",
            fontSize: 10,
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: "rgba(232, 200, 140, 0.8)",
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: 10,
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "#e8b65a",
          height: 2,
        }}
      />
    </div>
  );
}

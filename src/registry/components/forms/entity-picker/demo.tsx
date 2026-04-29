"use client";

import { useRef, useState } from "react";
import { ChevronDown, Pin, UserCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityPicker } from "./entity-picker";
import {
  GRAPH_NODES,
  NODE_KINDS,
  USERS,
  type GraphNode,
  type User,
} from "./dummy-data";
import type { EntityPickerHandle } from "./types";

function DemoFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      {children}
    </div>
  );
}

function SingleDemo() {
  const [value, setValue] = useState<GraphNode | null>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <label htmlFor="single-picker" className="text-xs text-muted-foreground">
          Pick a graph node
        </label>
        <EntityPicker<GraphNode>
          id="single-picker"
          items={GRAPH_NODES}
          value={value}
          onChange={setValue}
          kinds={NODE_KINDS}
          triggerLabel="Search nodes…"
        />
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-mono">{value?.label ?? "—"}</span>
        </p>
      </div>
    </DemoFrame>
  );
}

function MultiDemo() {
  const [value, setValue] = useState<GraphNode[]>([
    GRAPH_NODES[0],
    GRAPH_NODES[7],
  ]);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <label htmlFor="multi-picker" className="text-xs text-muted-foreground">
          Pick multiple nodes
        </label>
        <EntityPicker<GraphNode>
          id="multi-picker"
          mode="multi"
          items={GRAPH_NODES}
          value={value}
          onChange={setValue}
          kinds={NODE_KINDS}
          triggerLabel="Search nodes…"
        />
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-mono">{value.length}</span> node{value.length === 1 ? "" : "s"}
        </p>
      </div>
    </DemoFrame>
  );
}

function NoKindsDemo() {
  const [value, setValue] = useState<User | null>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <label htmlFor="user-picker" className="text-xs text-muted-foreground">
          Pick a teammate
        </label>
        <EntityPicker<User>
          id="user-picker"
          items={USERS}
          value={value}
          onChange={setValue}
          triggerLabel="Search users…"
        />
        <p className="text-xs text-muted-foreground">
          {value ? (
            <>
              <span className="font-mono">{value.label}</span> ·{" "}
              <span className="font-mono">{value.email}</span>
            </>
          ) : (
            "—"
          )}
        </p>
      </div>
    </DemoFrame>
  );
}

function CustomMatchDemo() {
  const [value, setValue] = useState<GraphNode[]>([]);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Custom match — substring across <code>label</code> AND{" "}
          <code>description</code>.
        </p>
        <EntityPicker<GraphNode>
          mode="multi"
          items={GRAPH_NODES}
          value={value}
          onChange={setValue}
          kinds={NODE_KINDS}
          match={(item, query) => {
            const q = query.toLowerCase();
            return (
              item.label.toLowerCase().includes(q) ||
              (item.description?.toLowerCase().includes(q) ?? false)
            );
          }}
          triggerLabel="Search labels & descriptions…"
        />
      </div>
    </DemoFrame>
  );
}

function CustomItemDemo() {
  const [value, setValue] = useState<User[]>([]);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Custom <code>renderItem</code> — avatar + name + email.
        </p>
        <EntityPicker<User>
          mode="multi"
          items={USERS}
          value={value}
          onChange={setValue}
          triggerLabel="Pick teammates…"
          renderItem={(item, ctx) => (
            <div className="flex flex-1 items-center gap-2">
              <div className="grid size-7 place-items-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                {item.avatar}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm">{item.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {item.email}
                </span>
              </div>
              {ctx.selected ? (
                <Badge variant="secondary" className="text-[10px]">
                  selected
                </Badge>
              ) : null}
            </div>
          )}
        />
      </div>
    </DemoFrame>
  );
}

function CustomEmptyDemo() {
  const [value, setValue] = useState<GraphNode | null>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Custom <code>renderEmpty</code> — surfaces the query verbatim.
        </p>
        <EntityPicker<GraphNode>
          items={GRAPH_NODES}
          value={value}
          onChange={setValue}
          kinds={NODE_KINDS}
          triggerLabel="Try typing something nonsense…"
          renderEmpty={({ query, itemCount }) => (
            <div className="flex flex-col items-center gap-1 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                {itemCount === 0
                  ? "No items provided."
                  : `No matches for "${query}".`}
              </p>
              {query.length > 0 ? (
                <p className="text-[10px] text-muted-foreground/70">
                  Try a shorter prefix or check the spelling.
                </p>
              ) : null}
            </div>
          )}
        />
      </div>
    </DemoFrame>
  );
}

function CustomTriggerDemo() {
  const [value, setValue] = useState<User | null>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Custom <code>renderTrigger</code> — host owns the trigger chrome.
        </p>
        <EntityPicker<User>
          items={USERS}
          value={value}
          onChange={setValue}
          triggerLabel="Pick teammate…"
          renderTrigger={({ value: v, open, triggerRef }) => (
            <button
              ref={(node) => triggerRef(node)}
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/40"
            >
              <UserCircle2 aria-hidden="true" className="size-4" />
              <span>
                {v && !Array.isArray(v) ? v.label : "Pick teammate…"}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          )}
        />
      </div>
    </DemoFrame>
  );
}

function HandleDemo() {
  const [value, setValue] = useState<GraphNode[]>([]);
  const ref = useRef<EntityPickerHandle>(null);
  return (
    <DemoFrame>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Imperative handle — drive the picker from outside.
        </p>
        <EntityPicker<GraphNode>
          ref={ref}
          mode="multi"
          items={GRAPH_NODES.filter((n) => n.kind === "person" || n.kind === "project")}
          value={value}
          onChange={setValue}
          kinds={NODE_KINDS}
          triggerLabel="People & projects…"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.focus()}
          >
            focus()
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.open()}
          >
            open()
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.close()}
          >
            close()
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => ref.current?.clear()}
          >
            clear()
          </Button>
        </div>
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => (
              <Badge
                key={v.id}
                variant="secondary"
                className="font-mono text-[10px]"
              >
                {v.kind === "person" ? <Pin className="size-2.5" /> : null}
                {v.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </DemoFrame>
  );
}

export default function EntityPickerDemo() {
  return (
    <Tabs defaultValue="single">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="single">Single</TabsTrigger>
        <TabsTrigger value="multi">Multi</TabsTrigger>
        <TabsTrigger value="no-kinds">No kinds</TabsTrigger>
        <TabsTrigger value="custom-match">Custom match</TabsTrigger>
        <TabsTrigger value="custom-item">Custom item</TabsTrigger>
        <TabsTrigger value="custom-empty">Custom empty</TabsTrigger>
        <TabsTrigger value="custom-trigger">Custom trigger</TabsTrigger>
        <TabsTrigger value="handle">Imperative handle</TabsTrigger>
      </TabsList>
      <TabsContent value="single" className="mt-4">
        <SingleDemo />
      </TabsContent>
      <TabsContent value="multi" className="mt-4">
        <MultiDemo />
      </TabsContent>
      <TabsContent value="no-kinds" className="mt-4">
        <NoKindsDemo />
      </TabsContent>
      <TabsContent value="custom-match" className="mt-4">
        <CustomMatchDemo />
      </TabsContent>
      <TabsContent value="custom-item" className="mt-4">
        <CustomItemDemo />
      </TabsContent>
      <TabsContent value="custom-empty" className="mt-4">
        <CustomEmptyDemo />
      </TabsContent>
      <TabsContent value="custom-trigger" className="mt-4">
        <CustomTriggerDemo />
      </TabsContent>
      <TabsContent value="handle" className="mt-4">
        <HandleDemo />
      </TabsContent>
    </Tabs>
  );
}

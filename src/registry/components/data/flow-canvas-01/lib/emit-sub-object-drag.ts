import type { DragEvent } from "react";

// Renderers call this from a sub-object's `onDragStart` to mark the drag as
// a sub-object extraction. The drop handler (canvas root) reads the special
// MIME and routes the drop through the extraction pipeline (copy by default,
// Alt-drag for move).
//
// Pattern (in a renderer):
//
//   <div
//     data-draggable-subobject={`media[${i}]`}
//     draggable
//     onDragStart={(e) => emitSubObjectDrag(
//       e, data.media[i], `media[${i}]`, ctx.nodeId
//     )}
//   >
//     <MediaItem {...data.media[i]} />
//   </div>
//
// Calling stopPropagation prevents xyflow's node-drag from also firing.

export function emitSubObjectDrag(
  e: DragEvent,
  subData: unknown,
  path: string,
  parentId: string,
): void {
  e.stopPropagation();
  e.dataTransfer.setData("application/json", JSON.stringify(subData));
  e.dataTransfer.setData(
    "application/x-ilinxa-subobject",
    JSON.stringify({ parentId, path }),
  );
  e.dataTransfer.effectAllowed = "copyMove";
}

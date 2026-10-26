import * as React from "react";

/**
 * Shared state for the stand-in MediaEditor used by the 0.6.0 tests.
 */
export const editorMock = {
  /** Props of the most recent MediaEditor render. */
  props: null as null | Record<string, unknown>,
  /** What `export()` resolves/rejects with. */
  exportImpl: null as null | (() => Promise<unknown>),
  /** Calls to the editor's `reset()` handle method. */
  resetCalls: 0,
  /** Arguments of every `loadState(state, opts)` call. */
  loadStateCalls: [] as unknown[][],
};

export function resetEditorMock() {
  editorMock.props = null;
  editorMock.exportImpl = null;
  editorMock.resetCalls = 0;
  editorMock.loadStateCalls = [];
}

export const EXPORT_METADATA = {
  mode: "photo",
  width: 1080,
  height: 1920,
  mimeType: "image/png",
  textOverlays: [],
  stickers: [],
  drawingStrokes: 0,
  adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
};

/**
 * Stand-in MediaEditor: renders the top bar slot and the `overlay` inside a
 * role="dialog" (where the real editor puts them in dialog presentation), keeps a "draft"
 * that `reset()` clears, and an `export()` that is configurable.
 */
export function createMockEditor() {
  return React.forwardRef<unknown, Record<string, unknown>>(
    function MockEditor(props, ref) {
      editorMock.props = props;
      const [draft, setDraft] = React.useState("loaded");
      React.useImperativeHandle(ref, () => ({
        getMode: () => "photo",
        getState: () => ({ mode: "photo" }),
        loadState: (...args: unknown[]) => {
          editorMock.loadStateCalls.push(args);
        },
        reset: () => {
          editorMock.resetCalls += 1;
          setDraft("");
        },
        export: () =>
          editorMock.exportImpl
            ? editorMock.exportImpl()
            : Promise.resolve({
                blob: new Blob(["x"], { type: "image/png" }),
                metadata: EXPORT_METADATA,
              }),
      }));
      const renderTopBar = props.renderTopBar as
        | ((ctx: unknown) => React.ReactNode)
        | undefined;
      return (
        <div role="dialog" aria-label="Story editor" data-testid="dialog">
          <div data-testid="editor-body">
            <span data-testid="draft">{draft}</span>
            {renderTopBar?.({
              isDirty: true,
              isCapturing: false,
              mode: "photo",
              enabledModes: ["photo"],
              stage: "edit",
            })}
          </div>
          {props.overlay as React.ReactNode}
        </div>
      );
    },
  );
}

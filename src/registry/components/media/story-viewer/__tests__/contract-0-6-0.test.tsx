/**
 * story-viewer 0.6.0 - consumer contract (C11): the kit's six checks over the viewer, plus the
 * viewer-specific proofs the kit cannot express (the viewer renders in a portal): full Turkish
 * label set with no English left, controlled `pauseReasons`, `locale="tr"` relative time,
 * SSR + hydration, RTL under the document direction, axe over the dialog itself.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoryViewer } from "../story-viewer";
import {
  DEFAULT_STORY_VIEWER_LABELS,
  type Story,
  type StoryViewerLabels,
  type StoryViewerProps,
} from "../types";
import { describeContract, expectNoAxeViolations } from "../../../../../../tests/helpers";

const item = (id: string) => ({ id, type: "image" as const, src: `${id}.jpg` });
const story = (id: string, itemIds: string[], extra: Partial<Story> = {}): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items: itemIds.map(item),
  createdAt: "2026-01-01T00:00:00Z",
  ...extra,
});
const alice = () => story("Alice", ["a1", "a2", "a3"]);
const aliceRenamed = () => story("Alice", ["a1", "a2", "a3"], { username: "Alicia" });

/** jsdom never loads images, so the 0.5.4 ready gate needs `complete`. */
function stubImages() {
  const original = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
  return () => {
    if (original) Object.defineProperty(HTMLImageElement.prototype, "complete", original);
  };
}

const base: StoryViewerProps = {
  stories: [alice()],
  isOpen: true,
  initialStoryIndex: 0,
  onClose: () => {},
  disableStoryTransition: true,
};
const viewerMode = {
  viewerMode: "viewer" as const,
  currentUser: { id: "me", name: "Me" },
  onReport: () => {},
};
const renderViewer = (props: Partial<StoryViewerProps> = {}) => (
  <StoryViewer {...base} {...props} />
);
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const headerName = (s: typeof screen, name: string) => s.getByText(name, { selector: "p" });

// A complete Turkish label set: every default key is replaced by a marker string.
const TR = "TR";
function turkishLabels(): StoryViewerLabels {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(DEFAULT_STORY_VIEWER_LABELS)) {
    if (typeof value === "string") out[key] = `${TR}-${key}`;
  }
  out.position = (a: string, i: number, n: number) => `${TR}-position ${a} ${i + 1}/${n}`;
  out.itemImageAlt = (s: Story, i: number, n: number) => `${TR}-alt ${s.username} ${i + 1}/${n}`;
  out.formatTime = () => `${TR}-time`;
  out.replyComposerPlaceholder = (s: Story) => `${TR}-placeholder ${s.username}`;
  out.replyAriaLabel = (s: Story) => `${TR}-replyAria ${s.username}`;
  out.viewerCountLabel = (c: number) => `${TR}-views ${c}`;
  out.viewersMoreLabel = (c: number) => `${TR}-more ${c}`;
  out.engagementLabels = {
    like: `${TR}-like`,
    unlike: `${TR}-unlike`,
    comment: `${TR}-comment`,
    share: `${TR}-share`,
    react: `${TR}-react`,
    reactionPickerLabel: `${TR}-picker`,
  };
  out.commentLabels = {
    composerPlaceholder: `${TR}-cplaceholder`,
    composerSend: `${TR}-csend`,
    composerCancel: `${TR}-ccancel`,
  };
  return out as StoryViewerLabels;
}

describeContract("StoryViewer", {
  render: (props = {}) => renderViewer(props as Partial<StoryViewerProps>),
  setup: stubImages,
  renders: (s) => {
    expect(s.getByRole("dialog", { name: "Story viewer" })).toBeInTheDocument();
    expect(headerName(s, "Alice")).toBeInTheDocument();
    expect(s.getByLabelText("Close")).toBeInTheDocument();
  },
  labels: {
    props: { ...viewerMode, labels: turkishLabels() },
    expect: (s) => {
      expect(s.getByRole("dialog", { name: `${TR}-viewerLabel` })).toBeInTheDocument();
      // open the engagement column so its labels are rendered too
      fireEvent.click(document.querySelector(`[aria-label="${TR}-engagementShowLabel"]`)!);
      const el = dialog();
      // shadcn's own DialogContent close button ("Close", sr-only) is display:none in this viewer
      // (`[&>button.absolute]:hidden` in viewer-shell) - not reachable by AT, so not a leftover.
      const live = (n: Element) => !n.closest('[data-slot="dialog-close"]');
      const ariaLabels = new Set(
        Array.from(el.querySelectorAll("[aria-label]"))
          .filter(live)
          .map((n) => n.getAttribute("aria-label")),
      );
      const texts = new Set(
        Array.from(el.querySelectorAll("*"))
          .filter((n) => n.children.length === 0 && live(n))
          .map((n) => n.textContent?.trim()),
      );
      const placeholders = new Set(
        Array.from(el.querySelectorAll("[placeholder]")).map((n) => n.getAttribute("placeholder")),
      );
      const leftovers: string[] = [];
      for (const value of Object.values(DEFAULT_STORY_VIEWER_LABELS)) {
        if (typeof value !== "string") continue;
        if (ariaLabels.has(value) || texts.has(value) || placeholders.has(value)) leftovers.push(value);
      }
      for (const english of ["Like", "Comment", "Share", "Send", "Cancel", "Reply to Alice", "Reply to Alice…"]) {
        if (ariaLabels.has(english) || texts.has(english) || placeholders.has(english)) leftovers.push(english);
      }
      expect(leftovers).toEqual([]);
      // and the overrides are the ones on screen
      expect(s.getByLabelText(`${TR}-close`)).toBeInTheDocument();
      expect(s.getByLabelText(`${TR}-kebabAriaLabel`)).toBeInTheDocument();
      expect(placeholders.has(`${TR}-placeholder Alice`)).toBe(true);
      expect(texts.has(`${TR}-time`)).toBe(true);
      expect(s.getByAltText(`${TR}-alt Alice 1/3`)).toBeInTheDocument();
    },
  },
  controlled: {
    initial: { stories: [alice()] },
    next: { stories: [aliceRenamed()] },
    callback: "onStoriesChange",
    expectInitial: (s) => {
      expect(headerName(s, "Alice")).toBeInTheDocument();
      expect(s.queryByText("Alicia", { selector: "p" })).toBeNull();
    },
    expectNext: (s) => {
      expect(headerName(s, "Alicia")).toBeInTheDocument();
      expect(s.queryByText("Alice", { selector: "p" })).toBeNull();
    },
  },
  rtl: {
    // The viewer renders in a portal: the document direction is what it reads.
    props: {},
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      document.documentElement.dir = "rtl";
      try {
        fireEvent.keyDown(document.body, { key: "ArrowLeft" });
        // under rtl ArrowLeft is "forward": item 2 of 3
        expect(s.getByAltText("Alice, story image 2 of 3")).toBeInTheDocument();
        fireEvent.keyDown(document.body, { key: "ArrowRight" });
        expect(s.getByAltText("Alice, story image 1 of 3")).toBeInTheDocument();
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    },
  },
  keyboard: {
    run: async (user) => {
      await user.keyboard("{ArrowRight}");
    },
    expect: (s) => {
      expect(s.getByAltText("Alice, story image 2 of 3")).toBeInTheDocument();
    },
  },
});

describe("StoryViewer - viewer-specific contract proofs", () => {
  let restore: (() => void) | undefined;
  afterEach(() => {
    cleanup();
    restore?.();
    restore = undefined;
    document.documentElement.removeAttribute("dir");
  });

  it("controlled pauseReasons win every render and a requested change is only reported", () => {
    restore = stubImages();
    const onPauseReasonsChange = vi.fn();
    const props = { onPauseReasonsChange };
    const { rerender } = render(renderViewer({ ...props, pauseReasons: [] }));
    expect(screen.queryByLabelText("Play")).toBeNull();
    fireEvent.keyDown(document.body, { key: " " });
    expect(onPauseReasonsChange).toHaveBeenCalled();
    expect(screen.queryByLabelText("Play")).toBeNull(); // the host did not accept it
    rerender(renderViewer({ ...props, pauseReasons: ["host-thing"] }));
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    rerender(renderViewer({ ...props, pauseReasons: [] }));
    expect(screen.queryByLabelText("Play")).toBeNull();
  });

  it('locale="tr" formats the relative time in Turkish', () => {
    restore = stubImages();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:30:00Z"));
      const fmt = (l: string) =>
        new Intl.RelativeTimeFormat(l, { numeric: "auto", style: "short" }).format(-30, "minute");
      expect(fmt("tr")).not.toBe(fmt("en"));
      render(renderViewer({ locale: "tr" }));
      expect(dialog().textContent).toContain(fmt("tr"));
      expect(dialog().textContent).not.toContain(fmt("en"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders on the server and hydrates without errors or recoverable errors", async () => {
    restore = stubImages();
    const tree = renderViewer({ ...viewerMode, locale: "tr" });
    const html = renderToString(tree);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, tree, { onRecoverableError: recoverable });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    expect(dialog()).toBeTruthy();
    errors.mockRestore();
    host.remove();
  });

  it("the dialog itself has no axe violations (default and viewer mode)", async () => {
    restore = stubImages();
    render(renderViewer());
    await expectNoAxeViolations(dialog());
    cleanup();
    render(renderViewer(viewerMode));
    await expectNoAxeViolations(dialog());
  });
});

/**
 * axe-core over three rendered states of StoryRail. Only `color-contrast` is
 * disabled: jsdom has no layout/computed colour engine, so the rule cannot be
 * evaluated there (it reports "incomplete" or false results). Everything else
 * runs at axe defaults.
 */
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { StoryRail } from "../story-rail";
import { AddStoryThumbnail } from "../parts/add-story-thumbnail";
import type { StoryRailItem } from "../types";

const h = vi.hoisted(() => ({ api: null as unknown }));

vi.mock("embla-carousel-react", () => ({
  default: () => [() => {}, h.api],
}));

function makeOverflowApi() {
  const handlers: Record<string, Array<() => void>> = {};
  const api = {
    on: vi.fn((evt: string, fn: () => void) => {
      (handlers[evt] ??= []).push(fn);
      return api;
    }),
    off: vi.fn(),
    scrollSnapList: vi.fn(() => [0, 1, 2, 3, 4]),
    scrollProgress: vi.fn(() => 0.5),
    slidesInView: vi.fn(() => [0, 1]),
    scrollTo: vi.fn(),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
  };
  return api;
}

const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  h.api = null;
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  h.api = null;
});

const ITEMS: StoryRailItem[] = [
  { id: "a", username: "ada", hasUnread: true, previewImage: "https://cdn.test/a.jpg" },
  { id: "b", username: "bob", hasUnread: false, previewImage: "https://cdn.test/b.jpg" },
  { id: "c", username: "cy", hasUnread: true },
];

async function violationsOf(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(",")}`);
}

describe("axe: story-rail", () => {
  it("default rail has zero violations (and actually rendered tiles)", async () => {
    const { container } = render(<StoryRail defaultItems={ITEMS} />);
    expect(container.querySelectorAll("button").length).toBe(3);
    expect(await violationsOf(container)).toEqual([]);
  });

  it("controlled rail with arrows='always' and overflow has zero violations", async () => {
    h.api = makeOverflowApi();
    const { container } = render(
      <StoryRail items={ITEMS} onItemsChange={() => {}} arrows="always" />,
    );
    await act(async () => {});
    expect(container.querySelectorAll("button").length).toBe(5); // 3 tiles + prev + next
    expect(await violationsOf(container)).toEqual([]);
  });

  it("RTL rail with Add tile leading, a muted item and a no-preview item has zero violations", async () => {
    const items: StoryRailItem[] = [
      ...ITEMS,
      { id: "d", username: "dee", hasUnread: true, muted: true, previewImage: "https://cdn.test/d.jpg" },
    ];
    const { container } = render(
      <StoryRail
        dir="rtl"
        defaultItems={items}
        leading={<AddStoryThumbnail />}
        labels={{ addStoryLabel: "Hikaye ekle", addStoryAriaLabel: "Hikaye ekle" }}
      />,
    );
    expect(container.querySelector('[data-state="muted"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="story-rail-avatar-card"]')).not.toBeNull();
    expect(await violationsOf(container)).toEqual([]);
  });
});

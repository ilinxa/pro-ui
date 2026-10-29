/**
 * 0.6.0 (CT-7): the composer part hands its statically imported composer to the rows' reply boxes,
 * so with the part mounted a reply box opens at once; without it (a read-only list) the rows load
 * the composer lazily and the box still opens.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CommentThread } from "../comment-thread";
import { CommentThreadRoot } from "../parts/comment-thread-root";
import { CommentThreadList } from "../parts/comment-thread-list";
import { ME, NOW, comment, installDomStubs, rowQueries } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const replyBox = () => screen.queryByRole("textbox", { name: "Reply to User a" });

describe("reply composer: static with the composer part, lazy without it", () => {
  it("the assembly opens the reply box in the same render (no suspense)", () => {
    render(<CommentThread comments={[comment("a")]} currentUser={ME} now={NOW} />);
    fireEvent.click(rowQueries("Body a").getByRole("button", { name: "Reply" }));
    expect(replyBox()).not.toBeNull();
  });

  it("Root + List (no composer part): the reply box loads lazily and opens", async () => {
    render(
      <CommentThreadRoot comments={[comment("a")]} currentUser={ME} now={NOW}>
        <CommentThreadList />
      </CommentThreadRoot>,
    );
    fireEvent.click(rowQueries("Body a").getByRole("button", { name: "Reply" }));
    expect(await screen.findByRole("textbox", { name: "Reply to User a" })).toBeTruthy();
    // No bottom composer was mounted.
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });
});

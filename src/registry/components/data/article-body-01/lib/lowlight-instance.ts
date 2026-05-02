import { createLowlight } from "lowlight";

import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// 15 languages cover ~95% of realistic article-body code blocks.
// Selective registration keeps the bundle small (~30KB gzip vs ~250KB
// for `lowlight/all`). Add more via `lowlight.register(...)` if needed.
export const lowlight = createLowlight();

lowlight.register("bash", bash);
lowlight.register("sh", shell);
lowlight.register("shell", shell);
lowlight.register("css", css);
lowlight.register("diff", diff);
lowlight.register("go", go);
lowlight.register("html", xml);
lowlight.register("xml", xml);
lowlight.register("java", java);
lowlight.register("javascript", javascript);
lowlight.register("js", javascript);
lowlight.register("json", json);
lowlight.register("markdown", markdown);
lowlight.register("md", markdown);
lowlight.register("python", python);
lowlight.register("py", python);
lowlight.register("rust", rust);
lowlight.register("rs", rust);
lowlight.register("sql", sql);
lowlight.register("typescript", typescript);
lowlight.register("ts", typescript);
lowlight.register("yaml", yaml);
lowlight.register("yml", yaml);

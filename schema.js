/* Validate persisted data before it reaches rendering or simulation. */
(() => {
  "use strict";
  const text = (v) => typeof v === "string" && v.length <= 100000;
  const id = (v) => text(v) && /^[a-zA-Z0-9_-]{1,120}$/.test(v);
  const number =
    (min = 0, max = 1e15) =>
    (v) =>
      Number.isFinite(v) && v >= min && v <= max;
  const bool = (v) => typeof v === "boolean";
  const one =
    (...values) =>
    (v) =>
      values.includes(v);
  const optional = (check) => (v) => v === undefined || check(v);
  const nullable = (check) => (v) => v === null || check(v);
  const array =
    (check, min = 0, max = 1000) =>
    (v) =>
      Array.isArray(v) && v.length >= min && v.length <= max && v.every(check);
  const object = (fields) => (v) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.entries(fields).every(([key, check]) => check(v[key]));
  const record = (check) => (v) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.values(v).every(check);
  const unique = (items) =>
    new Set(items.map((item) => item.id)).size === items.length;
  const scene = object({
    title: text,
    direction: text,
    shot: one(
      "Wide",
      "Medium",
      "Close-up",
      "Extreme wide",
      "Macro",
      "Overhead",
    ),
    movement: one(
      "Slow push",
      "Orbit",
      "Handheld drift",
      "Crane up",
      "Static",
      "Pull back",
    ),
    light: one(
      "Golden dawn",
      "Hard noon",
      "Soft overcast",
      "Blue hour",
      "Neon night",
      "Studio softbox",
    ),
    palette: one("amber", "ocean", "rose", "mono", "acid"),
    duration: number(1, 30),
    seed: number(0, 1e12),
  });
  window.validateWorkspace = object({
    name: text,
    ratio: optional(one("16/9", "9/16", "1/1")),
    scenes: array(scene, 1, 100),
  });
})();

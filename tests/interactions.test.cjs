const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { boot } = require("./harness.cjs");
const key = fs
  .readFileSync(path.join(__dirname, "../app.js"), "utf8")
  .match(/const (?:STORAGE_KEY|STORE|KEY) = "([^"]+)"/)[1];
const fixture = async (t, options) => {
  const h = await boot(options);
  t.after(() => {
    const errors = [...h.errors];
    h.close();
    assert.deepEqual(errors, []);
  });
  return h;
};
const submit = (h, selector) =>
  h
    .$(selector)
    .dispatchEvent(
      new h.window.Event("submit", { bubbles: true, cancelable: true }),
    );
const readBlob = (h, blob) =>
  new Promise((resolve, reject) => {
    const r = new h.window.FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(blob);
  });
async function roundTrip(t, h) {
  await h.wait(450);
  const raw = h.window.localStorage.getItem(key);
  assert.ok(raw, "Interaction should persist workspace data");
  assert.equal(
    h.window.validateWorkspace(JSON.parse(raw)),
    true,
    "Generated state must satisfy its schema",
  );
  const reloaded = await fixture(t, { saved: { [key]: raw } });
  assert.equal(
    reloaded.$("#storage-notice"),
    null,
    "Valid edits must not be discarded on reload",
  );
}
test("scene edits preserve focus and exported ratio follows the project", async (t) => {
  const h = await fixture(t);
  const title = h.$("#titleInput");
  title.focus();
  h.input("#titleInput", "A new beginning");
  title.setSelectionRange(3, 3);
  assert.equal(h.document.activeElement, title);
  assert.equal(title.selectionStart, 3);
  h.click('[data-ratio="9/16"]');
  h.click("#compileButton");
  h.click('[data-format="compact"]');
  assert.match(h.$("#compiledPrompt").textContent, /9:16/);
  h.click("#closePrompt");
  await roundTrip(t, h);
});
test("editing or removing during playback cancels stale playback", async (t) => {
  const h = await fixture(t);
  h.click("#playButton");
  assert.equal(h.$("#visualStage").classList.contains("playing"), true);
  h.click("#deleteScene");
  assert.equal(h.$("#visualStage").classList.contains("playing"), false);
  assert.equal(h.document.querySelectorAll(".scene-card").length, 3);
  h.click("#exportButton");
  assert.equal(h.downloads.length, 1);
});
test("compact treatment formats long-film timecodes correctly", async (t) => {
  const h = await fixture(t);
  for (let i = 0; i < 15; i++) h.click("#addScene");
  assert.match(h.$("#playheadText").textContent, /00:01:/);
});

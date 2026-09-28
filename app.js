const KEY = "motion-prompt-project-v1";
const paletteMap = {
  amber: ["#e69a5c", "#1e303c", "#f5c878", "#172731"],
  ocean: ["#6bb6c5", "#142d4a", "#b5edf0", "#102540"],
  rose: ["#ef8f9a", "#592d48", "#ffc3b2", "#402039"],
  mono: ["#d7d4cc", "#242424", "#f5f2e9", "#181818"],
  acid: ["#c8e76d", "#29351f", "#ecff9e", "#1e2918"],
};
const seeds = [
  {
    title: "First light",
    direction:
      "A quiet horizon wakes in amber; one figure faces the emerging light with restrained optimism.",
    shot: "Wide",
    movement: "Slow push",
    light: "Golden dawn",
    palette: "amber",
    duration: 4,
    seed: 3481,
  },
  {
    title: "Matter in motion",
    direction:
      "Material fragments lift into the air and find an elegant rhythm around the central form.",
    shot: "Medium",
    movement: "Orbit",
    light: "Hard noon",
    palette: "ocean",
    duration: 5,
    seed: 7214,
  },
  {
    title: "Human signal",
    direction:
      "A precise close-up reveals texture, breath, and the small decisions behind the technology.",
    shot: "Close-up",
    movement: "Handheld drift",
    light: "Soft overcast",
    palette: "rose",
    duration: 4,
    seed: 1957,
  },
  {
    title: "Open future",
    direction:
      "The world expands into a luminous landscape; the figure moves forward and the mark resolves.",
    shot: "Extreme wide",
    movement: "Crane up",
    light: "Blue hour",
    palette: "acid",
    duration: 5,
    seed: 8892,
  },
];
const $ = (q, p = document) => p.querySelector(q),
  $$ = (q, p = document) => [...p.querySelectorAll(q)];
let stored = parse(WorkspaceStorage.getItem(KEY));
let state = stored?.scenes?.length
  ? stored
  : {
      name: "Solis — launch film",
      scenes: structuredClone(seeds),
      ratio: "16/9",
    };
let selected = 0,
  ratio = state.ratio || "16/9",
  playing = false,
  format = "treatment";
let playbackVersion = 0;
function parse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
function save() {
  WorkspaceStorage.setItem(KEY, JSON.stringify(state));
}
function esc(v) {
  return String(v).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function current() {
  return state.scenes[selected];
}
function total() {
  return state.scenes.reduce((a, s) => a + s.duration, 0);
}
function render() {
  stopPlayback();
  if (selected >= state.scenes.length)
    selected = Math.max(0, state.scenes.length - 1);
  $("#projectName").textContent = state.name;
  $("#sceneCount").textContent = String(state.scenes.length).padStart(2, "0");
  $("#totalDuration").textContent = `${total()}s`;
  $("#frameLabel").textContent =
    `SCENE ${String(selected + 1).padStart(2, "0")} / ${String(state.scenes.length).padStart(2, "0")}`;
  renderScenes();
  renderStage();
  renderDirector();
  renderTimeline();
  save();
}
function colors(scene) {
  return paletteMap[scene.palette] || paletteMap.amber;
}
function renderScenes() {
  $("#sceneList").innerHTML = state.scenes
    .map((s, i) => {
      let c = colors(s);
      return `<button class="scene-card ${i === selected ? "active" : ""}" data-i="${i}"><span class="scene-thumb" style="--c1:${c[0]};--c2:${c[1]}"></span><span class="scene-copy"><strong>${esc(s.title)}</strong><span>${esc(s.shot)} · ${s.duration}s</span></span><span class="scene-number">${String(i + 1).padStart(2, "0")}</span></button>`;
    })
    .join("");
  $$(".scene-card").forEach((b) =>
    b.addEventListener("click", () => {
      selected = +b.dataset.i;
      render();
    }),
  );
}
function random(seed, n = 0) {
  let x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
function renderStage() {
  let s = current();
  if (!s) return;
  let c = colors(s),
    stage = $("#visualStage");
  stage.style.setProperty("--sky1", c[0]);
  stage.style.setProperty("--sky2", c[1]);
  stage.style.setProperty("--sun", c[2]);
  stage.style.setProperty("--ground", c[3]);
  stage.style.setProperty("--sun-x", `${48 + random(s.seed, 1) * 30}%`);
  stage.style.setProperty("--sun-y", `${8 + random(s.seed, 2) * 25}%`);
  stage.style.setProperty("--subject-x", `${20 + random(s.seed, 3) * 52}%`);
  stage.style.setProperty("--flare-x", `${30 + random(s.seed, 4) * 42}%`);
  stage.style.setProperty("--flare-y", `${20 + random(s.seed, 5) * 35}%`);
  stage.style.setProperty("--tilt", `${-4 + random(s.seed, 6) * 8}deg`);
  stage.style.aspectRatio = ratio;
  stage.style.width =
    ratio === "9/16"
      ? "min(42%,330px)"
      : ratio === "1/1"
        ? "min(70%,560px)"
        : "min(100%,830px)";
  $("#stageTitle").textContent = s.title;
  $("#stageCaption").textContent = s.direction.split(/[.;]/)[0] + ".";
  $("#stageBadge").textContent =
    `${s.shot} · ${s.movement} · ${s.duration}s`.toUpperCase();
  $("#stageTimecode").textContent = timecode(
    state.scenes.slice(0, selected).reduce((a, v) => a + v.duration, 0),
  );
}
function timecode(sec) {
  return [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60, 0]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
function renderDirector() {
  let s = current();
  if (!s) return;
  $("#directionTitle").textContent =
    `Scene ${String(selected + 1).padStart(2, "0")}`;
  $("#titleInput").value = s.title;
  $("#directionInput").value = s.direction;
  $("#shotInput").value = s.shot;
  $("#movementInput").value = s.movement;
  $("#lightInput").value = s.light;
  $("#durationInput").value = s.duration;
  $("#durationOutput").value = `${s.duration} seconds`;
  $("#seedValue").textContent = s.seed;
  $$("[data-palette]").forEach((b) =>
    b.classList.toggle("active", b.dataset.palette === s.palette),
  );
}
function renderTimeline() {
  let sum = total();
  $("#ruler").innerHTML = Array.from(
    { length: 6 },
    (_, i) => `<span>${Math.round((sum * i) / 5)}s</span>`,
  ).join("");
  $("#timeline").innerHTML = state.scenes
    .map((s, i) => {
      let c = colors(s);
      return `<button class="clip ${i === selected ? "active" : ""}" data-i="${i}" style="flex:${s.duration};--c1:${c[0]};--c2:${c[1]}"><strong>${String(i + 1).padStart(2, "0")} ${esc(s.title)}</strong><span>${s.duration}s</span><i class="clip-progress"></i></button>`;
    })
    .join("");
  $$(".clip").forEach((b) =>
    b.addEventListener("click", () => {
      selected = +b.dataset.i;
      render();
    }),
  );
  $("#playheadText").textContent =
    `${timecode(state.scenes.slice(0, selected).reduce((n, s) => n + s.duration, 0))} / ${timecode(sum)}`;
}
function update(field, value) {
  stopPlayback();
  current()[field] = value;
  save();
  renderScenes();
  renderStage();
  renderTimeline();
  $("#totalDuration").textContent = `${total()}s`;
  $("#durationOutput").value = `${current().duration} seconds`;
  $$("[data-palette]").forEach((b) =>
    b.classList.toggle("active", b.dataset.palette === current().palette),
  );
}
function addScene() {
  let base = current() || seeds[0];
  let next = {
    ...base,
    title: "Untitled beat",
    direction:
      "Describe the visual intention, subject, atmosphere, and change within this shot.",
    duration: 4,
    seed: Math.floor(1000 + Math.random() * 8999),
  };
  state.scenes.splice(selected + 1, 0, next);
  selected++;
  render();
  toast("New scene added");
}
function duplicate() {
  state.scenes.splice(selected + 1, 0, {
    ...current(),
    title: `${current().title} — alt`,
    seed: current().seed + 137,
  });
  selected++;
  render();
  toast("Scene duplicated");
}
function remove() {
  if (state.scenes.length === 1)
    return toast("A film needs at least one scene");
  let title = current().title;
  state.scenes.splice(selected, 1);
  selected = Math.min(selected, state.scenes.length - 1);
  render();
  toast(`${title} removed`);
}
function move(dir) {
  let target = selected + dir;
  if (target < 0 || target >= state.scenes.length) return;
  [state.scenes[selected], state.scenes[target]] = [
    state.scenes[target],
    state.scenes[selected],
  ];
  selected = target;
  render();
}
async function play() {
  if (playing) return;
  const version = ++playbackVersion;
  playing = true;
  $("#visualStage").classList.add("playing");
  $("#playButton").innerHTML = "<span>Ⅱ</span>";
  $("#playButton").setAttribute("aria-label", "Stop storyboard");
  for (
    let i = selected;
    i < state.scenes.length && version === playbackVersion;
    i++
  ) {
    selected = i;
    renderScenes();
    renderStage();
    renderDirector();
    renderTimeline();
    $("#visualStage").classList.add("playing");
    let clip = $(`.clip[data-i="${i}"] .clip-progress`);
    let ms = state.scenes[i].duration * 1000;
    clip.style.transition = `width ${ms}ms linear`;
    requestAnimationFrame(() => {
      if (version === playbackVersion) clip.style.width = "100%";
    });
    await wait(ms);
  }
  if (version !== playbackVersion) return;
  stopPlayback();
  toast("Storyboard playback complete");
}
function stopPlayback() {
  playbackVersion++;
  playing = false;
  $("#visualStage").classList.remove("playing");
  $("#playButton").innerHTML = "<span>▶</span>";
  $("#playButton").setAttribute("aria-label", "Play storyboard");
  $$(".clip-progress").forEach((clip) => {
    clip.style.transition = "none";
    clip.style.width = "0%";
  });
}
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function stopOrPlay() {
  if (playing) {
    stopPlayback();
  } else play();
}
function compile(kind = format) {
  let head =
    kind === "compact"
      ? `${state.name}. ${total()}-second cinematic sequence, ${ratio.replace("/", ":")}.`
      : `PROJECT: ${state.name}\nFORMAT: ${total()} seconds · ${ratio} · cinematic product film\n\nDIRECTOR'S TREATMENT\nCreate a cohesive sequence with restrained, premium pacing. Preserve visual continuity, plausible motion, consistent subject identity, and intentional transitions.`;
  let body = state.scenes
    .map((s, i) =>
      kind === "compact"
        ? `${i + 1}) ${s.title}: ${s.direction} ${s.shot}, ${s.movement.toLowerCase()}, ${s.light.toLowerCase()}, ${s.duration}s, palette ${s.palette}, seed ${s.seed}.`
        : `\nSCENE ${String(i + 1).padStart(2, "0")} — ${s.title.toUpperCase()} [${s.duration}s]\n${s.direction}\nCamera: ${s.shot}; ${s.movement}. Light: ${s.light}. Palette: ${s.palette}. Continuity seed: ${s.seed}.`,
    )
    .join("\n");
  let end =
    kind === "compact"
      ? " Keep continuity, natural motion, and no unrequested text or logos."
      : "\n\nGLOBAL CONSTRAINTS\nNatural temporal motion; consistent geometry; intentional composition; no unrequested text, captions, watermarks, or logos. Use scene transitions that preserve direction and visual energy.";
  return `${head}\n${body}\n${end}`;
}
function showPrompt() {
  $("#compiledPrompt").textContent = compile();
  let words = compile().trim().split(/\s+/).length;
  $("#promptStats").textContent =
    `${words} words · ${state.scenes.length} scenes`;
  if (!$("#promptDialog").open) $("#promptDialog").showModal();
}
function download(content, name, type = "text/plain") {
  let blob = new Blob([content], { type }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
function toast(msg) {
  let t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  $("#toastZone").append(t);
  setTimeout(() => t.remove(), 2400);
}

render();
$("#addScene").onclick = $("#addSceneBottom").onclick = addScene;
$("#duplicateScene").onclick = duplicate;
$("#deleteScene").onclick = remove;
$("#moveUp").onclick = () => move(-1);
$("#moveDown").onclick = () => move(1);
$("#previousScene").onclick = () => {
  selected = Math.max(0, selected - 1);
  render();
};
$("#nextScene").onclick = () => {
  selected = Math.min(state.scenes.length - 1, selected + 1);
  render();
};
[
  ["#titleInput", "title"],
  ["#directionInput", "direction"],
  ["#shotInput", "shot"],
  ["#movementInput", "movement"],
  ["#lightInput", "light"],
].forEach(([id, key]) =>
  $(id).addEventListener(
    id.includes("Input") && ["shot", "movement", "light"].includes(key)
      ? "change"
      : "input",
    (e) => update(key, e.target.value),
  ),
);
$("#durationInput").oninput = (e) => update("duration", +e.target.value);
$$("[data-palette]").forEach(
  (b) => (b.onclick = () => update("palette", b.dataset.palette)),
);
$("#remixButton").onclick = () => {
  current().seed = ((current().seed * 17 + 431) % 9000) + 1000;
  render();
  toast("Frame remixed locally");
};
$("#playButton").onclick = $("#timelinePlay").onclick = stopOrPlay;
$$("[data-ratio]").forEach(
  (b) =>
    (b.onclick = () => {
      $$("[data-ratio]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      ratio = b.dataset.ratio;
      state.ratio = ratio;
      stopPlayback();
      save();
      renderStage();
    }),
);
$("#openDirector").onclick = () =>
  $(".director-panel").classList.toggle("open");
$("#compileButton").onclick = showPrompt;
$("#closePrompt").onclick = () => $("#promptDialog").close();
$$("[data-format]").forEach(
  (b) =>
    (b.onclick = () => {
      format = b.dataset.format;
      $$("[data-format]").forEach((x) => x.classList.toggle("active", x === b));
      showPrompt();
    }),
);
$("#copyPrompt").onclick = async () => {
  let text = compile();
  try {
    await navigator.clipboard.writeText(text);
    toast("Prompt copied to clipboard");
  } catch {
    toast("Select the prompt and copy manually");
  }
};
$("#downloadPrompt").onclick = () =>
  download(compile(), "motion-prompt-treatment.txt");
$("#exportButton").onclick = () =>
  download(
    JSON.stringify({ format: "motion-prompt/v1", ...state }, null, 2),
    "motion-prompt-project.json",
    "application/json",
  );
$("#renameProject").onclick = () => {
  let value = prompt("Project name", state.name);
  if (value?.trim()) {
    state.name = value.trim().slice(0, 70);
    render();
  }
};
$("#fullscreenButton").onclick = () => {
  $("#stage").classList.toggle("focus");
  toast("Preview focus toggled");
};
$("#focusClose").onclick = () => $("#stage").classList.remove("focus");
$("#moreButton").onclick = () => $(".director-panel").classList.remove("open");
$("#moreButton").setAttribute("aria-label", "Close director panel");
document.addEventListener("keydown", (e) => {
  let typing = ["INPUT", "TEXTAREA", "SELECT"].includes(
    document.activeElement?.tagName,
  );
  if (e.key === "Escape") {
    $(".director-panel").classList.remove("open");
    $("#stage").classList.remove("focus");
  }
  if (
    typing ||
    document.activeElement?.isContentEditable ||
    document.querySelector("dialog[open]") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  if (e.key === " " && document.activeElement?.matches("button, a")) return;
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    selected = Math.max(0, selected - 1);
    render();
  }
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    selected = Math.min(state.scenes.length - 1, selected + 1);
    render();
  }
  if (e.key.toLowerCase() === "d") duplicate();
  if (e.key === "Backspace" || e.key === "Delete") remove();
  if (e.key === " ") {
    e.preventDefault();
    stopOrPlay();
  }
});

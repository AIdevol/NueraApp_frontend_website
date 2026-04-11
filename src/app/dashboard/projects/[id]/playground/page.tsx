"use client";

import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";
import {
  WORKSPACE_VERSION,
  emptyWorkspacePayload,
  fetchWorkspace,
  isEffectivelyEmptyWorkspace,
  parseLocalWorkspace,
  putWorkspace,
  workspaceStorageKey,
  type WorkspacePayload,
} from "@/lib/mlPlaygroundWorkspace";
import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { primary } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project { id: string; name: string }
interface Checkpoint { epoch: number; loss: number; acc: number; timestamp: string }
interface HyperParams {
  learningRate: string; batchSize: string; epochs: string;
  optimizer: string; dropout: string; hiddenSize: string;
}
interface LossPoint { epoch: number; loss: number; acc: number }

type TabId = "editor" | "hyperparams" | "metrics" | "checkpoints";
type RightPanelTab = "visualization" | "console" | "insights";
type Theme = "dark" | "light";

// ─── File-tree node ───────────────────────────────────────────────────────────
type FSNode =
  | { kind: "file";   id: string; name: string; content: string }
  | { kind: "folder"; id: string; name: string; children: FSNode[]; open: boolean };

function mkId() { return Math.random().toString(36).slice(2, 9); }
function mkFile(name: string, content = ""): FSNode { return { kind: "file", id: mkId(), name, content }; }
function mkFolder(name: string, children: FSNode[] = [], open = true): FSNode {
  return { kind: "folder", id: mkId(), name, children, open };
}

// ── Tree helpers ──────────────────────────────────────────────────────────────
function findNode(nodes: FSNode[], id: string): FSNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.kind === "folder") { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
}

function mapTree(nodes: FSNode[], fn: (n: FSNode) => FSNode): FSNode[] {
  return nodes.map(n => { const m = fn(n); return m.kind === "folder" ? { ...m, children: mapTree(m.children, fn) } : m; });
}

function removeNode(nodes: FSNode[], id: string): FSNode[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => n.kind === "folder" ? { ...n, children: removeNode(n.children, id) } : n);
}

function addChild(nodes: FSNode[], parentId: string | null, child: FSNode): FSNode[] {
  if (parentId === null) return [...nodes, child];
  return nodes.map(n => {
    if (n.kind === "folder" && n.id === parentId) return { ...n, children: [...n.children, child], open: true };
    if (n.kind === "folder") return { ...n, children: addChild(n.children, parentId, child) };
    return n;
  });
}

/** Returns true if `targetId` is ancestorId itself OR a descendant of it */
function isDescendantOrSelf(nodes: FSNode[], ancestorId: string, targetId: string): boolean {
  if (ancestorId === targetId) return true;
  const anc = findNode(nodes, ancestorId);
  if (!anc || anc.kind !== "folder") return false;
  const check = (kids: FSNode[]): boolean =>
    kids.some(k => k.id === targetId || (k.kind === "folder" && check(k.children)));
  return check(anc.children);
}

/** Returns the parent folder id of a node (undefined = not found, null = root) */
function findParentId(nodes: FSNode[], targetId: string, parentId: string | null = null): string | null | undefined {
  for (const n of nodes) {
    if (n.id === targetId) return parentId;
    if (n.kind === "folder") {
      const r = findParentId(n.children, targetId, n.id);
      if (r !== undefined) return r;
    }
  }
  return undefined;
}

/** Move nodeId into targetFolderId (null = root). Returns new tree or null if illegal. */
function moveNode(tree: FSNode[], nodeId: string, targetFolderId: string | null): FSNode[] | null {
  if (targetFolderId !== null && isDescendantOrSelf(tree, nodeId, targetFolderId)) return null;
  const node = findNode(tree, nodeId);
  if (!node) return null;
  return addChild(removeNode(tree, nodeId), targetFolderId, node);
}

function buildPathMap(nodes: FSNode[], prefix = ""): Record<string, string> {
  const map: Record<string, string> = {};
  for (const n of nodes) {
    const p = prefix ? `${prefix}/${n.name}` : n.name;
    map[n.id] = p;
    if (n.kind === "folder") Object.assign(map, buildPathMap(n.children, p));
  }
  return map;
}

/** Merge active editor buffer into the file tree (for save / persistence). */
function mergeEditorIntoTree(tree: FSNode[], openFileId: string | null, editorCode: string): FSNode[] {
  if (!openFileId) return tree;
  return mapTree(tree, (n) => (n.kind === "file" && n.id === openFileId ? { ...n, content: editorCode } : n));
}

function findFirstFile(nodes: FSNode[]): FSNode | null {
  for (const n of nodes) {
    if (n.kind === "file") return n;
    if (n.kind === "folder") {
      const inner = findFirstFile(n.children);
      if (inner) return inner;
    }
  }
  return null;
}

function languageFromFileName(name: string): string {
  if (name.endsWith(".py")) return "Python";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "YAML";
  if (name.endsWith(".json")) return "JSON";
  if (name.endsWith(".md")) return "Markdown";
  if (name.endsWith(".txt")) return "Plain Text";
  return "Text";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightPythonLike(code: string): string {
  const tokens: string[] = [];
  const save = (html: string) => `@@TOK${tokens.push(html) - 1}@@`;

  let out = escapeHtml(code);
  out = out.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (m) => save(`<span style="color:#c3e88d">${m}</span>`));
  out = out.replace(/(#[^\n]*)/g, (m) => save(`<span style="color:#6b7280;font-style:italic">${m}</span>`));

  out = out
    .replace(
      /\b(import|from|class|def|return|if|else|elif|for|while|in|not|and|or|is|True|False|None|with|as|try|except|finally|raise|pass|break|continue)\b/g,
      '<span style="color:#c792ea">$1</span>'
    )
    .replace(
      /\b(print|range|len|int|float|str|list|dict|set|tuple|map|filter|zip|enumerate|min|max|sum|open)\b/g,
      '<span style="color:#82aaff">$1</span>'
    )
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');

  return out.replace(/@@TOK(\d+)@@/g, (_, i) => tokens[Number(i)] ?? "");
}

/** Fallback when API run is unavailable — only extracts simple print('literal') / print("literal"). */
function simulatePythonRun(fileName: string, code: string): string[] {
  const out: string[] = [];
  out.push(`>> python ${fileName}`);
  const printRe = /print\s*\(\s*(["'`])([^"'`]*)\1\s*\)/g;
  let m: RegExpExecArray | null;
  let found = 0;
  while ((m = printRe.exec(code)) !== null) {
    out.push(String(m[2]));
    found++;
  }
  if (found === 0) {
    const hasPrint = /\bprint\s*\(/.test(code);
    const fStrings = code.match(/print\s*\(\s*f?(["'`])([^"'`]*)\1\s*\)/g);
    if (fStrings?.length) {
      out.push(
        "(Browser preview: f-string / complex print() not evaluated — use Run with API for real output.)"
      );
    } else if (hasPrint) {
      out.push(
        "(Browser preview: only simple print('text') / print(\"text\") are shown here. For real execution, ensure the backend is running and Run will use the server.)"
      );
    } else {
      out.push(
        "(No simple print('...') found in preview — start the NeuraApp API and Run will execute Python on the server.)"
      );
    }
  }
  out.push(`>> exit code 0 (preview only — not executing code)`);
  return out;
}

/** New projects start with an empty explorer — users add files and folders themselves. */
function emptyTree(): FSNode[] {
  return [];
}

// ─── Simulation ───────────────────────────────────────────────────────────────
const SIMULATION_STEPS = [
  { epoch: 1,  loss: 2.3015, acc: 12.5 }, { epoch: 3,  loss: 1.9210, acc: 28.4 },
  { epoch: 5,  loss: 1.4502, acc: 45.2 }, { epoch: 7,  loss: 1.1034, acc: 61.7 },
  { epoch: 10, loss: 0.8921, acc: 78.4 }, { epoch: 12, loss: 0.7203, acc: 81.9 },
  { epoch: 14, loss: 0.5123, acc: 85.1 }, { epoch: 16, loss: 0.4801, acc: 86.2 },
  { epoch: 18, loss: 0.4601, acc: 86.9 }, { epoch: 20, loss: 0.4501, acc: 87.3 },
];

// ─── Loss chart ───────────────────────────────────────────────────────────────
function LossChart({ points, theme }: { points: LossPoint[]; theme: Theme }) {
  if (!points.length) return (
    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">Run training to see live charts</div>
  );
  const W = 300, H = 120, PAD = { top: 10, right: 10, bottom: 20, left: 30 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const maxEpoch = Math.max(...points.map(p => p.epoch));
  const maxLoss  = Math.max(...points.map(p => p.loss));
  const mkPath = (key: "loss" | "acc", max: number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${PAD.left + (p.epoch / maxEpoch) * iW},${PAD.top + iH - (p[key] / max) * iH}`).join(" ");
  const lossPath = mkPath("loss", maxLoss), accPath = mkPath("acc", 100);
  const lp = points[points.length - 1];
  const gc = theme === "dark" ? "#1e293b" : "#e2e8f0", tc = theme === "dark" ? "#64748b" : "#94a3b8";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, .25, .5, .75, 1].map(t => <line key={t} x1={PAD.left} y1={PAD.top + iH * (1 - t)} x2={PAD.left + iW} y2={PAD.top + iH * (1 - t)} stroke={gc} strokeWidth="1" />)}
      {[0, .5, 1].map(t => <text key={t} x={PAD.left - 4} y={PAD.top + iH * (1 - t) + 3} fontSize="7" textAnchor="end" fill={tc}>{t === 0 ? "0" : t === .5 ? "50%" : "100%"}</text>)}
      <path d={`${lossPath} L${PAD.left + iW},${PAD.top + iH} L${PAD.left},${PAD.top + iH} Z`} fill={primary} fillOpacity=".08" />
      <path d={lossPath} fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${accPath} L${PAD.left + iW},${PAD.top + iH} L${PAD.left},${PAD.top + iH} Z`} fill="#34d399" fillOpacity=".08" />
      <path d={accPath} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={PAD.left + (lp.epoch / maxEpoch) * iW} cy={PAD.top + iH - (lp.loss / maxLoss) * iH} r="3" fill={primary} />
      <circle cx={PAD.left + (lp.epoch / maxEpoch) * iW} cy={PAD.top + iH - (lp.acc / 100) * iH} r="3" fill="#34d399" />
    </svg>
  );
}

// ─── Confusion matrix ─────────────────────────────────────────────────────────
function ConfusionMatrix({ trained }: { trained: boolean }) {
  const labels = ["0","1","2","3","4","5","6","7","8","9"];
  const matrix = trained
    ? [[98,0,1,0,0,0,0,0,1,0],[0,99,0,0,0,0,0,1,0,0],[1,1,95,1,0,0,0,1,1,0],[0,0,1,96,0,2,0,0,1,0],[0,0,0,0,97,0,1,0,0,2],[1,0,0,2,0,95,1,0,0,1],[1,0,0,0,1,1,97,0,0,0],[0,1,2,0,1,0,0,95,0,1],[0,0,1,1,0,1,0,0,96,1],[0,0,0,1,2,0,0,1,1,95]]
    : Array(10).fill(Array(10).fill(0));
  return (
    <div className="overflow-auto">
      <div className="text-[8px] text-slate-400 mb-1">Predicted →</div>
      <div style={{ display: "grid", gridTemplateColumns: `20px repeat(10, 1fr)` }} className="gap-px text-[7px]">
        <div />
        {labels.map(l => <div key={l} className="text-center text-slate-400 pb-0.5">{l}</div>)}
        {matrix.map((row, i) => (
          <Fragment key={`row-${i}`}>
            <div className="text-slate-400 flex items-center justify-end pr-1">{labels[i]}</div>
            {(row as number[]).map((val, j) => {
              const ins = trained ? val / 100 : 0;
              const bg  = i === j ? `rgba(39,39,241,${0.2 + ins * 0.8})` : val > 0 ? `rgba(239,68,68,${ins * 0.7})` : "transparent";
              return (
                <div
                  key={`cell-${i}-${j}`}
                  title={`True:${labels[i]} Pred:${labels[j]} Count:${val}`}
                  style={{ background: bg, minWidth: 16, minHeight: 14 }}
                  className="rounded-[2px] flex items-center justify-center text-[6px] text-white/70"
                >
                  {val > 0 && trained ? val : ""}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── File-icon helper ─────────────────────────────────────────────────────────
function fileIconColor(name: string): string {
  if (name.endsWith(".py"))                           return "#4B8BBE";
  if (name.endsWith(".txt"))                          return "#a0aec0";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "#f59e0b";
  if (name.endsWith(".json"))                         return "#34d399";
  if (name.endsWith(".md"))                           return "#c792ea";
  return "#6a9955";
}

// ─── Rename input ─────────────────────────────────────────────────────────────
function RenameInput({ initial, onCommit, onCancel }: { initial: string; onCommit: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") onCommit(val.trim() || initial); if (e.key === "Escape") onCancel(); }}
      onBlur={() => onCommit(val.trim() || initial)}
      className="flex-1 bg-slate-700 text-white text-xs px-1 py-0 rounded outline-none border border-blue-400"
      style={{ minWidth: 0 }} onClick={e => e.stopPropagation()} />
  );
}

// ─── Context menu type ────────────────────────────────────────────────────────
interface CtxMenu { x: number; y: number; nodeId: string | null; kind: "file" | "folder" | "root" }

// ─── TreeNode ─────────────────────────────────────────────────────────────────
function TreeNode({
  node, depth, openFileId, renamingId,
  draggingId, dragOverFolderId,
  onSelect, onToggle, onRename, onStartRename, onCancelRename, onContext,
  onDragStart, onDragEnterFolder, onDragLeaveFolder, onDropOnFolder,
}: {
  node: FSNode; depth: number; openFileId: string | null; renamingId: string | null;
  draggingId: string | null; dragOverFolderId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onStartRename: (id: string) => void;
  onCancelRename: () => void;
  onContext: (e: React.MouseEvent, nodeId: string, kind: "file" | "folder") => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnterFolder: (e: React.DragEvent, id: string) => void;
  onDragLeaveFolder: (e: React.DragEvent, id: string) => void;
  onDropOnFolder: (e: React.DragEvent, folderId: string | null) => void;
}) {
  const isOpen      = node.kind === "folder" && node.open;
  const isActive    = openFileId === node.id;
  const isRenaming  = renamingId === node.id;
  const isDragging  = draggingId === node.id;
  const isDragOver  = node.kind === "folder" && dragOverFolderId === node.id;

  return (
    <div>
      <div
        role="button" tabIndex={0} draggable
        onDragStart={e => onDragStart(e, node.id)}
        onDragEnter={node.kind === "folder" ? e => onDragEnterFolder(e, node.id) : undefined}
        onDragLeave={node.kind === "folder" ? e => onDragLeaveFolder(e, node.id) : undefined}
        onDragOver={node.kind === "folder" ? e => e.preventDefault() : undefined}
        onDrop={node.kind === "folder" ? e => onDropOnFolder(e, node.id) : undefined}
        onClick={() => node.kind === "folder" ? onToggle(node.id) : onSelect(node.id)}
        onKeyDown={e => { if (e.key === "Enter") node.kind === "folder" ? onToggle(node.id) : onSelect(node.id); }}
        onContextMenu={e => onContext(e, node.id, node.kind === "folder" ? "folder" : "file")}
        onDoubleClick={e => { e.stopPropagation(); onStartRename(node.id); }}
        className={[
          "flex items-center gap-1 py-[3px] px-2 rounded cursor-pointer group select-none text-xs transition-all",
          isActive    ? "bg-white/10 text-white"        : "hover:bg-white/5 text-slate-300",
          isDragging  ? "opacity-30 scale-95"           : "",
          isDragOver  ? "ring-1 ring-inset ring-blue-400 bg-blue-500/15 text-white" : "",
        ].filter(Boolean).join(" ")}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {/* Drag handle — subtle, reveals on hover */}
        <span
          className="material-symbols-outlined shrink-0 text-slate-700 group-hover:text-slate-500 cursor-grab active:cursor-grabbing"
          style={{ fontSize: 13 }}
          title="Drag to move"
        >drag_indicator</span>

        {node.kind === "folder" ? (
          <>
            <span className="material-symbols-outlined text-slate-500 shrink-0" style={{ fontSize: 12 }}>
              {isOpen ? "expand_more" : "chevron_right"}
            </span>
            <span className="material-symbols-outlined shrink-0" style={{ color: "#f59e0b", fontSize: 14 }}>
              {isDragOver ? "folder_open" : isOpen ? "folder_open" : "folder"}
            </span>
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="material-symbols-outlined shrink-0" style={{ color: fileIconColor(node.name), fontSize: 14 }}>description</span>
          </>
        )}

        {isRenaming ? (
          <RenameInput initial={node.name} onCommit={v => onRename(node.id, v)} onCancel={onCancelRename} />
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}

        {/* "drop" badge on hover-targeted folders */}
        {isDragOver && (
          <span className="ml-1 shrink-0 text-[9px] font-bold text-blue-400 animate-pulse">drop</span>
        )}
      </div>

      {node.kind === "folder" && node.open && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1}
              openFileId={openFileId} renamingId={renamingId}
              draggingId={draggingId} dragOverFolderId={dragOverFolderId}
              onSelect={onSelect} onToggle={onToggle}
              onRename={onRename} onStartRename={onStartRename} onCancelRename={onCancelRename}
              onContext={onContext}
              onDragStart={onDragStart}
              onDragEnterFolder={onDragEnterFolder}
              onDragLeaveFolder={onDragLeaveFolder}
              onDropOnFolder={onDropOnFolder}
            />
          ))}
          {node.children.length === 0 && (
            <div className="text-[10px] text-slate-600 py-1 italic" style={{ paddingLeft: `${20 + (depth + 1) * 12}px` }}>
              empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectPlaygroundPage() {
  const router    = useRouter();
  const params    = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [mounted, setMounted] = useState(false);

  // ── File tree ──
  const [tree,       setTree]       = useState<FSNode[]>(emptyTree);
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  /** Open editor tabs (file ids), in order — IDE-style multi-file editing */
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [ctxMenu,    setCtxMenu]    = useState<CtxMenu | null>(null);
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);

  // ── Drag state ──
  const [draggingId,       setDraggingId]       = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [rootDragOver,     setRootDragOver]     = useState(false);
  const dragDepthRef     = useRef<Record<string, number>>({});
  const rootDragDepthRef = useRef(0);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  const openFile     = openFileId ? findNode(tree, openFileId) : null;
  const openFileName = openFile?.name ?? "—";
  const openContent  = openFile?.kind === "file" ? openFile.content : "";
  const pathMap      = buildPathMap(tree);

  // ── Editor ──
  const [theme,         setTheme]         = useState<Theme>("dark");
  const [unsaved,       setUnsaved]       = useState(false);
  const [findQuery,     setFindQuery]     = useState("");
  const [showFind,      setShowFind]      = useState(false);
  const [cursorLine,    setCursorLine]    = useState(1);
  const [cursorCol,     setCursorCol]     = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNosRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const keyHandlersRef = useRef<{
    handleSave: () => void;
    handleRunSimulation: () => void;
    handleRunCurrentFile: () => void;
  }>({
    handleSave: () => {},
    handleRunSimulation: () => {},
    handleRunCurrentFile: () => {},
  });

  // ── Tabs ──
  const [activeTab,     setActiveTab]     = useState<TabId>("editor");
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("visualization");

  // ── Hyperparams ──
  const [hyperParams, setHyperParams] = useState<HyperParams>({
    learningRate: "", batchSize: "", epochs: "",
    optimizer: "", dropout: "", hiddenSize: "",
  });

  // ── Datasets (user-added via upload; no sample data) ──
  const [datasets, setDatasets] = useState<{ name: string; size: number }[]>([]);

  // ── Training ──
  const [consoleInputLine, setConsoleInputLine] = useState("");
  const [logs,         setLogs]         = useState<string[]>([
    ">> ML Playground ready. Add files in Explorer, set hyperparameters, then train.",
  ]);
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);
  const [running,      setRunning]      = useState(false);
  const [paused,       setPaused]       = useState(false);
  const [lossPoints,   setLossPoints]   = useState<LossPoint[]>([]);
  const [checkpoints,  setCheckpoints]  = useState<Checkpoint[]>([]);
  const [trainDone,    setTrainDone]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedRef   = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bestAcc  = lossPoints.length ? Math.max(...lossPoints.map(p => p.acc)) : null;
  const lastLoss = lossPoints.length ? lossPoints[lossPoints.length - 1].loss : null;

  // ── Effects ──
  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      setLoading(true); setError("");
      try {
        const res = await fetch(
          `${getPublicApiUrl()}/api/v1/projects/${encodeURIComponent(projectId)}`,
          { headers: { ...bearerAuthHeaders() } }
        );
        if (res.status === 401) {
          if (typeof window !== "undefined") localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || "Not found"); return; }
        const data = await res.json();
        setProject({ id: data.id, name: data.name });
      } catch { setError("Connection error."); }
      finally   { setLoading(false); }
    })();
  }, [projectId, router]);

  useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    const h = () => setCtxMenu(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  /** Global shortcuts: save, find, train, run file (handlers via ref so deps stay stable) */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const h = keyHandlersRef.current;
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        h.handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowFind((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        h.handleRunCurrentFile();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        h.handleRunSimulation();
      }
      if (e.key === "Escape") setCtxMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [editorCode, setEditorCode] = useState("");
  useEffect(() => {
    setEditorCode(openContent);
    setUnsaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFileId]);

  /** Load workspace: API first, migrate legacy localStorage if server is empty */
  useEffect(() => {
    if (!projectId || !project) return;
    let cancelled = false;

    function applyPayload(w: WorkspacePayload) {
      const t = w.tree as FSNode[];
      setTree(t);
      const hp: HyperParams = {
        learningRate: "",
        batchSize: "",
        epochs: "",
        optimizer: "",
        dropout: "",
        hiddenSize: "",
      };
      Object.assign(hp, w.hyperParams);
      setHyperParams(hp);
      setDatasets(Array.isArray(w.datasets) ? w.datasets : []);
      const tabIds = w.openTabIds ?? [];
      const validTabs = tabIds.filter((id) => findNode(t, id)?.kind === "file");
      setOpenTabIds(validTabs.length ? validTabs : []);
      if (w.openFileId && findNode(t, w.openFileId)?.kind === "file") {
        setOpenFileId(w.openFileId);
      } else {
        setOpenFileId(null);
      }
    }

    void (async () => {
      const api = await fetchWorkspace(projectId);
      if (cancelled) return;

      const localRaw =
        typeof window !== "undefined"
          ? localStorage.getItem(workspaceStorageKey(projectId))
          : null;
      const localParsed = localRaw ? parseLocalWorkspace(localRaw) : null;

      if (api?.payload) {
        let payload = api.payload;
        if (
          isEffectivelyEmptyWorkspace(payload) &&
          localParsed &&
          !isEffectivelyEmptyWorkspace(localParsed)
        ) {
          await putWorkspace(projectId, localParsed);
          payload = localParsed;
          try {
            localStorage.removeItem(workspaceStorageKey(projectId));
          } catch {
            /* ignore */
          }
        }
        applyPayload(payload);
      } else if (localParsed) {
        applyPayload(localParsed);
        if (getPublicApiUrl()) {
          const r = await putWorkspace(projectId, localParsed);
          if (!r.ok) {
            showToast("Offline or API unavailable — using local workspace.", false);
          }
        }
      }

      if (!cancelled) setWorkspaceHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, project]);

  /** Persist workspace to API + local backup (debounced) */
  useEffect(() => {
    if (!projectId || !project || !workspaceHydrated) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      const mergedTree = mergeEditorIntoTree(tree, openFileId, editorCode);
      const payload: WorkspacePayload = {
        version: WORKSPACE_VERSION,
        tree: mergedTree as WorkspacePayload["tree"],
        hyperParams,
        datasets,
        openTabIds,
        openFileId,
      };
      void (async () => {
        if (cancelled) return;
        const hasApi = Boolean(getPublicApiUrl());
        if (hasApi) {
          const r = await putWorkspace(projectId, payload);
          if (cancelled) return;
          if (r.ok) {
            try {
              localStorage.setItem(workspaceStorageKey(projectId), JSON.stringify(payload));
            } catch {
              /* quota */
            }
          } else {
            showToast("Could not sync to server — saved in browser only.", false);
            try {
              localStorage.setItem(workspaceStorageKey(projectId), JSON.stringify(payload));
            } catch {
              /* quota */
            }
          }
        } else {
          try {
            localStorage.setItem(workspaceStorageKey(projectId), JSON.stringify(payload));
          } catch {
            /* quota */
          }
        }
      })();
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [projectId, project, workspaceHydrated, tree, hyperParams, datasets, openTabIds, openFileId, editorCode]);

  /** Default: open first file in tabs when none */
  useEffect(() => {
    if (!workspaceHydrated) return;
    const first = findFirstFile(tree);
    if (!first || first.kind !== "file") return;
    if (openTabIds.length === 0) {
      setOpenTabIds([first.id]);
      if (!openFileId) setOpenFileId(first.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceHydrated, tree]);

  // ── File operations ──
  function handleSelectFile(id: string) {
    if (openFileId && unsaved)
      setTree(prev => mapTree(prev, n => n.kind === "file" && n.id === openFileId ? { ...n, content: editorCode } : n));
    setOpenFileId(id);
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setUnsaved(false);
  }

  function handleCloseTab(tabId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const merged = mergeEditorIntoTree(tree, openFileId, editorCode);
    setTree(merged);
    const nextTabs = openTabIds.filter((x) => x !== tabId);
    setOpenTabIds(nextTabs);
    if (openFileId === tabId) {
      const nextId = nextTabs[nextTabs.length - 1] ?? null;
      setOpenFileId(nextId);
      if (nextId) {
        const n = findNode(merged, nextId);
        setEditorCode(n?.kind === "file" ? n.content : "");
      } else {
        setEditorCode("");
      }
      setUnsaved(false);
    }
  }

  async function handleRunCurrentFile() {
    if (!openFileId) {
      showToast("Open a file first.", false);
      return;
    }
    const merged = mergeEditorIntoTree(tree, openFileId, editorCode);
    const node = findNode(merged, openFileId);
    if (!node || node.kind !== "file") return;
    const name = node.name;
    if (!name.endsWith(".py")) {
      setLogs((prev) => [...prev, `>> Run file: ${name} — only .py is supported for Run.`]);
      setRightPanelTab("console");
      return;
    }
    const api = getPublicApiUrl();
    if (api) {
      try {
        const res = await fetch(`${api}/api/v1/practice-problems/run-python`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: editorCode, timeout_sec: 12 }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          exit_code?: number;
          stdout?: string;
          stderr?: string;
          detail?: string;
        };
        if (!res.ok) {
          throw new Error((data as { detail?: string }).detail || `HTTP ${res.status}`);
        }
        if (data.ok === false) {
          const detail = data.detail || "Run failed";
          setLogs((prev) => [...prev, "", `>> Server: ${detail}`, `>> Preview fallback:`, ...simulatePythonRun(name, editorCode)]);
          setRightPanelTab("console");
          showToast(detail, false);
          return;
        }
        if (typeof data.exit_code === "number") {
          const lines: string[] = [`>> python ${name} (server)`];
          const so = (data.stdout ?? "").trimEnd();
          const se = (data.stderr ?? "").trimEnd();
          if (so) lines.push(...so.split("\n"));
          if (se) lines.push(...se.split("\n").map((l) => `[stderr] ${l}`));
          if (!so && !se) lines.push("(no output)");
          lines.push(`>> exit code ${data.exit_code}`);
          setLogs((prev) => [...prev, "", ...lines]);
          setRightPanelTab("console");
          showToast("Run finished — see Console");
          return;
        }
        setLogs((prev) => [
          ...prev,
          "",
          `>> Unexpected API response`,
          ...simulatePythonRun(name, editorCode),
        ]);
        setRightPanelTab("console");
        showToast("Unexpected response — preview in Console", false);
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setLogs((prev) => [
          ...prev,
          "",
          `>> Could not reach API (${msg}). Preview only:`,
          ...simulatePythonRun(name, editorCode),
        ]);
        setRightPanelTab("console");
        showToast("API unreachable — preview in Console", false);
        return;
      }
    }
    const lines = simulatePythonRun(name, editorCode);
    setLogs((prev) => [...prev, "", `>> NEXT_PUBLIC_API_URL not set — preview only:`, ...lines]);
    setRightPanelTab("console");
    showToast("Configure API URL for real Python runs", false);
  }

  function exportWorkspaceJson() {
    const merged = mergeEditorIntoTree(tree, openFileId, editorCode);
    const blob = new Blob(
      [JSON.stringify({ version: WORKSPACE_VERSION, tree: merged, hyperParams, datasets, openTabIds, openFileId }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ml-playground-${project?.name ?? projectId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Workspace exported");
  }

  function importWorkspaceJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const w = JSON.parse(String(reader.result)) as {
          tree?: FSNode[];
          hyperParams?: HyperParams;
          datasets?: unknown;
          openTabIds?: string[];
          openFileId?: string | null;
        };
        if (!Array.isArray(w.tree)) throw new Error("Invalid file");
        setTree(w.tree);
        if (w.hyperParams) setHyperParams(w.hyperParams);
        if (Array.isArray(w.datasets)) setDatasets(w.datasets as { name: string; size: number }[]);
        const first = findFirstFile(w.tree);
        if (first && first.kind === "file") {
          setOpenFileId(first.id);
          setOpenTabIds([first.id]);
          setEditorCode(first.content);
        } else {
          setOpenFileId(null);
          setOpenTabIds([]);
          setEditorCode("");
        }
        showToast("Workspace imported");
        if (projectId && getPublicApiUrl()) {
          const tabIds = first && first.kind === "file" ? [first.id] : [];
          const openId = first && first.kind === "file" ? first.id : null;
          const payload: WorkspacePayload = {
            version: WORKSPACE_VERSION,
            tree: w.tree as WorkspacePayload["tree"],
            hyperParams: {
              learningRate: "",
              batchSize: "",
              epochs: "",
              optimizer: "",
              dropout: "",
              hiddenSize: "",
              ...(w.hyperParams ?? {}),
            },
            datasets: Array.isArray(w.datasets) ? (w.datasets as { name: string; size: number }[]) : [],
            openTabIds: tabIds,
            openFileId: openId,
          };
          void putWorkspace(projectId, payload).then((r) => {
            if (!r.ok) showToast("Imported locally — server sync failed.", false);
          });
        }
      } catch {
        showToast("Import failed — invalid JSON", false);
      }
    };
    reader.readAsText(file);
  }

  function updateCursorPos() {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const upTo = editorCode.slice(0, pos);
    const lines = upTo.split("\n");
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  }

  function handleToggleFolder(id: string) {
    setTree(prev => mapTree(prev, n => n.kind === "folder" && n.id === id ? { ...n, open: !n.open } : n));
  }

  function handleSave() {
    if (!openFileId) return;
    setTree(prev => mapTree(prev, n => n.kind === "file" && n.id === openFileId ? { ...n, content: editorCode } : n));
    setUnsaved(false);
    setLogs(prev => [...prev, `>> [${new Date().toLocaleTimeString()}] ${openFileName} saved.`]);
  }

  function handleRename(id: string, name: string) {
    setTree(prev => mapTree(prev, n => n.id === id ? { ...n, name } : n));
    setRenamingId(null);
  }

  function handleDelete(id: string) {
    const merged = mergeEditorIntoTree(tree, openFileId, editorCode);
    const nextTree = removeNode(merged, id);
    setTree(nextTree);
    const nextTabs = openTabIds.filter((x) => x !== id);
    setOpenTabIds(nextTabs);
    if (openFileId === id) {
      const nextId = nextTabs[nextTabs.length - 1] ?? null;
      setOpenFileId(nextId);
      if (nextId) {
        const n = findNode(nextTree, nextId);
        setEditorCode(n?.kind === "file" ? n.content : "");
      } else {
        setEditorCode("");
      }
      setUnsaved(false);
    }
    setCtxMenu(null);
  }

  function createNewFile(parentId: string | null) {
    const node = mkFile("untitled.py", "# New file\n");
    setTree(prev => addChild(prev, parentId, node));
    setOpenFileId(node.id);
    setOpenTabIds((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
    setEditorCode("# New file\n");
    setRenamingId(node.id);
    setCtxMenu(null);
  }

  function createNewFolder(parentId: string | null) {
    const node = mkFolder("New Folder", [], true);
    setTree(prev => addChild(prev, parentId, node));
    setRenamingId(node.id);
    setCtxMenu(null);
  }

  function handleContext(e: React.MouseEvent, nodeId: string, kind: "file" | "folder") {
    e.preventDefault(); e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId, kind });
  }

  function handleRootContext(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: null, kind: "root" });
  }

  function handleTabKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const s = el.selectionStart;
    const en = el.selectionEnd;

    if (e.key === "Tab") {
      e.preventDefault();
      const next = editorCode.substring(0, s) + "    " + editorCode.substring(en);
      setEditorCode(next);
      setUnsaved(true);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 4;
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const before = editorCode.slice(0, s);
      const after = editorCode.slice(en);
      const lineStart = before.lastIndexOf("\n") + 1;
      const currentLine = before.slice(lineStart);
      const baseIndent = (currentLine.match(/^\s*/) ?? [""])[0];
      const needsBlockIndent = currentLine.trimEnd().endsWith(":");
      const indent = needsBlockIndent ? `${baseIndent}    ` : baseIndent;
      const insertion = `\n${indent}`;
      const next = `${before}${insertion}${after}`;
      setEditorCode(next);
      setUnsaved(true);
      requestAnimationFrame(() => {
        const cursor = s + insertion.length;
        el.selectionStart = el.selectionEnd = cursor;
      });
    }
  }

  // ── Drag & drop ──
  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("nodeId", id);
    setDraggingId(id);
    dragDepthRef.current = {};
  }

  function handleDragEnterFolder(e: React.DragEvent, id: string) {
    e.preventDefault(); e.stopPropagation();
    dragDepthRef.current[id] = (dragDepthRef.current[id] || 0) + 1;
    setDragOverFolderId(id);
  }

  function handleDragLeaveFolder(e: React.DragEvent, id: string) {
    e.stopPropagation();
    dragDepthRef.current[id] = (dragDepthRef.current[id] || 1) - 1;
    if (dragDepthRef.current[id] <= 0) {
      dragDepthRef.current[id] = 0;
      setDragOverFolderId(prev => prev === id ? null : prev);
    }
  }

  function performMove(nodeId: string, targetFolderId: string | null) {
    const currentParent = findParentId(tree, nodeId);
    if (currentParent === targetFolderId) { showToast("Already in that location.", false); return; }
    if (targetFolderId !== null && isDescendantOrSelf(tree, nodeId, targetFolderId)) {
      showToast("Can't move a folder into itself.", false); return;
    }
    const movedNode = findNode(tree, nodeId);
    const destName  = targetFolderId ? (findNode(tree, targetFolderId)?.name ?? "root") : "root";
    setTree(prev => moveNode(prev, nodeId, targetFolderId) ?? prev);
    showToast(`Moved "${movedNode?.name}" → /${destName}`);
  }

  function handleDropOnFolder(e: React.DragEvent, folderId: string | null) {
    e.preventDefault(); e.stopPropagation();
    const nodeId = e.dataTransfer.getData("nodeId") || draggingId;
    setDraggingId(null); setDragOverFolderId(null); setRootDragOver(false);
    dragDepthRef.current = {}; rootDragDepthRef.current = 0;
    if (!nodeId || nodeId === folderId) return;
    performMove(nodeId, folderId);
  }

  function handleRootDragEnter(e: React.DragEvent) {
    e.preventDefault();
    rootDragDepthRef.current += 1;
    setRootDragOver(true);
  }
  function handleRootDragLeave(_e: React.DragEvent) {
    rootDragDepthRef.current -= 1;
    if (rootDragDepthRef.current <= 0) { rootDragDepthRef.current = 0; setRootDragOver(false); }
  }
  function handleRootDrop(e: React.DragEvent) { handleDropOnFolder(e, null); }

  function handleDragEnd() {
    setDraggingId(null); setDragOverFolderId(null); setRootDragOver(false);
    dragDepthRef.current = {}; rootDragDepthRef.current = 0;
  }

  // ── Training ──
  const stopAll = useCallback(() => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; }, []);

  function handleRunSimulation() {
    if (running && !paused) return;
    if (paused) { setPaused(false); pausedRef.current = false; continueSimulation(currentEpoch ?? 0); return; }
    stopAll();
    setRunning(true); setPaused(false); pausedRef.current = false;
    setTrainDone(false); setLossPoints([]); setCheckpoints([]);
    setCurrentEpoch(0); setProgress(0);
    const totalEpochs = parseInt(hyperParams.epochs) || 20;
    setLogs([
      `>> [${new Date().toLocaleTimeString()}] python train.py`,
      `   Optimizer: ${hyperParams.optimizer || "—"}  lr=${hyperParams.learningRate || "—"}`,
      `   Batch: ${hyperParams.batchSize || "—"}  Epochs: ${totalEpochs}`,
      "   Loading dataset... Done.", "   Starting training...",
    ]);
    continueSimulation(0);
  }

  function continueSimulation(fromEpoch: number) {
    const steps = SIMULATION_STEPS.filter(s => s.epoch > fromEpoch);
    const totalEpochs = parseInt(hyperParams.epochs) || 20;
    steps.forEach((step, idx) => {
      const t = setTimeout(() => {
        if (pausedRef.current) return;
        setLogs(prev => [...prev, `   Epoch [${step.epoch}/${totalEpochs}]  Loss: ${step.loss.toFixed(4)}  Acc: ${step.acc.toFixed(1)}%`]);
        setCurrentEpoch(step.epoch);
        setLossPoints(prev => [...prev, step]);
        setProgress(Math.round((step.epoch / totalEpochs) * 100));
        if (step.epoch % 5 === 0) {
          const ckpt: Checkpoint = { epoch: step.epoch, loss: step.loss, acc: step.acc, timestamp: new Date().toLocaleTimeString() };
          setCheckpoints(prev => [...prev, ckpt]);
          setLogs(prev => [...prev, `   ✓ Checkpoint → ckpt_epoch${step.epoch}.pt`]);
        }
        if (idx === steps.length - 1) {
          setRunning(false); setTrainDone(true); setProgress(100);
          setLogs(prev => [...prev, "", `   ✅ Done! Best Acc: ${step.acc.toFixed(1)}%  Loss: ${step.loss.toFixed(4)}`]);
        }
      }, 800 * (idx + 1));
      timeoutsRef.current.push(t);
    });
  }

  function handlePause() {
    if (!running || paused) return;
    stopAll(); setPaused(true); pausedRef.current = true; setRunning(false);
    setLogs(prev => [...prev, `   ⏸ Paused at epoch ${currentEpoch}.`]);
  }
  function handleStop() {
    stopAll(); setRunning(false); setPaused(false); pausedRef.current = false;
    setLogs(prev => [...prev, "   ⛔ Stopped."]);
  }
  function handleReset() {
    handleStop();
    const fresh = emptyTree();
    setTree(fresh);
    setHyperParams({
      learningRate: "", batchSize: "", epochs: "",
      optimizer: "", dropout: "", hiddenSize: "",
    });
    setDatasets([]);
    setLossPoints([]); setCheckpoints([]);
    setCurrentEpoch(null); setProgress(0); setTrainDone(false); setUnsaved(false);
    setOpenFileId(null);
    setOpenTabIds([]);
    setEditorCode("");
    if (projectId) {
      if (getPublicApiUrl()) {
        void putWorkspace(projectId, emptyWorkspacePayload()).then((r) => {
          if (!r.ok) showToast("Reset locally — could not clear server workspace.", false);
        });
      }
      try {
        localStorage.removeItem(workspaceStorageKey(projectId));
      } catch {
        /* ignore */
      }
    }
    setLogs([">> Playground reset. Workspace cleared on server and in this browser."]);
  }

  function handleDatasetUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setDatasets(prev => [...prev, ...Array.from(files).map(f => ({ name: f.name, size: f.size }))]);
  }

  function formatSize(b: number) {
    if (!b) return "—";
    if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
    if (b >= 1_000)     return `${(b / 1_000).toFixed(1)} KB`;
    return `${b} B`;
  }

  function handleEditorScroll() {
    const el = textareaRef.current;
    if (!el) return;
    if (lineNosRef.current) lineNosRef.current.scrollTop = el.scrollTop;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = el.scrollTop;
      highlightRef.current.scrollLeft = el.scrollLeft;
    }
  }

  keyHandlersRef.current = { handleSave, handleRunSimulation, handleRunCurrentFile };

  if (!mounted) return null;

  // ── Theme tokens ──
  const bg      = theme === "dark" ? "bg-[#030303]"     : "bg-white";
  const bg2     = theme === "dark" ? "bg-[#0c0c0f]"     : "bg-slate-50";
  const border  = theme === "dark" ? "border-slate-800" : "border-slate-200";
  const text    = theme === "dark" ? "text-slate-300"   : "text-slate-700";
  const textDim = theme === "dark" ? "text-slate-500"   : "text-slate-400";

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin" style={{ borderTopColor: primary }} />
      <p className="text-slate-500">Opening playground…</p>
    </div>
  );

  if (error || !project) return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: primary }}>
        <span className="material-symbols-outlined text-lg">arrow_back</span> Back
      </Link>
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
        <p className="text-red-600">{error || "Project not found"}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full" onDragEnd={handleDragEnd}>
      <div className={`flex flex-col flex-1 min-h-0 ${bg}`}>

        {/* ── Header ── */}
        <header className={`h-14 border-b ${border} ${bg2} flex items-center justify-between px-4 md:px-6 shrink-0`}
          style={{ borderTopColor: `${primary}33` }}>
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/dashboard/projects/${encodeURIComponent(project.id)}`}
              className={`inline-flex items-center gap-1 text-xs font-medium ${textDim} hover:${text} shrink-0`}>
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back
            </Link>
            <div className="flex items-center gap-2 font-bold text-sm md:text-base shrink-0" style={{ color: primary }}>
              <span className="material-symbols-outlined">memory</span>
              <span className="hidden sm:inline">MLPlayground</span>
            </div>
            <div className={`h-6 w-px ${border} shrink-0`} />
            <span className={`text-xs md:text-sm font-medium ${text} truncate max-w-[200px]`}>
              {project.name} / {openFileId ? (pathMap[openFileId] ?? openFileName) : "—"}
            </span>
            {openFileId && (unsaved
              ? <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">Unsaved</span>
              : <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">Saved</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button title="Toggle theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              className={`p-1.5 rounded ${textDim} hover:${text} border ${border}`}>
              <span className="material-symbols-outlined text-[16px]">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
            </button>
            <button title="Find (Ctrl+F)" onClick={() => setShowFind(v => !v)}
              className={`p-1.5 rounded ${textDim} hover:${text} border ${border}`}>
              <span className="material-symbols-outlined text-[16px]">search</span>
            </button>
            <button title="Save (Ctrl+S)" onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${textDim} hover:${text} rounded border ${border}`}>
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span className="hidden md:inline">Save</span>
            </button>
            <button
              type="button"
              title="Run current .py — executes on server when API is configured, else preview only — Ctrl+Shift+Enter"
              onClick={handleRunCurrentFile}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border ${border} ${textDim} hover:${text}`}
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span className="hidden lg:inline">Run file</span>
            </button>
            <button
              type="button"
              title="Keyboard shortcuts"
              onClick={() => setShowShortcuts(true)}
              className={`p-1.5 rounded ${textDim} hover:${text} border ${border}`}
            >
              <span className="material-symbols-outlined text-[16px]">keyboard</span>
            </button>
            <button
              type="button"
              title="Export workspace JSON"
              onClick={exportWorkspaceJson}
              className={`hidden md:flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded border ${border} ${textDim} hover:${text}`}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
            </button>
            <label
              title="Import workspace JSON"
              className={`hidden md:flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded border ${border} ${textDim} hover:${text} cursor-pointer`}
            >
              <span className="material-symbols-outlined text-[16px]">upload</span>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importWorkspaceJson(f);
                  e.target.value = "";
                }}
              />
            </label>
            {(running || paused) && (
              <>
                <button title="Pause" onClick={handlePause} disabled={paused}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 rounded border border-amber-500/40 disabled:opacity-40">
                  <span className="material-symbols-outlined text-[16px]">pause</span>
                </button>
                <button title="Stop" onClick={handleStop}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded border border-red-500/40">
                  <span className="material-symbols-outlined text-[16px]">stop</span>
                </button>
              </>
            )}
            <button title={paused ? "Resume training" : "Train (Ctrl+Enter) — simulated epochs"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded border disabled:opacity-60"
              style={{ background: running && !paused ? `${primary}33` : `${primary}22`, color: primary, borderColor: `${primary}66` }}
              onClick={handleRunSimulation} disabled={running && !paused}>
              <span className="material-symbols-outlined text-[16px]">{paused ? "play_arrow" : running ? "hourglass_top" : "model_training"}</span>
              <span className="hidden md:inline">{paused ? "Resume" : running ? "Training…" : "Train"}</span>
            </button>
            <button title="Reset" onClick={handleReset}
              className={`p-1.5 rounded ${textDim} hover:text-red-400 border ${border}`}>
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-white rounded shadow-lg"
              style={{ background: primary }}>
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              <span className="hidden md:inline">Submit</span>
            </button>
          </div>
        </header>

        {/* ── Progress bar ── */}
        {(running || paused || trainDone) && (
          <div className={`h-1 ${bg2} shrink-0`}>
            <div className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: trainDone ? "#34d399" : paused ? "#f59e0b" : primary }} />
          </div>
        )}

        {/* ── Find bar ── */}
        {showFind && (
          <div className={`h-10 border-b ${border} ${bg2} flex items-center gap-2 px-4 shrink-0`}>
            <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
            <input autoFocus value={findQuery} onChange={e => setFindQuery(e.target.value)}
              placeholder="Find in file…"
              className={`flex-1 bg-transparent text-xs outline-none ${text} placeholder:text-slate-500`} />
            <span className={`text-[10px] ${textDim}`}>
              {findQuery ? `${(editorCode.match(new RegExp(findQuery, "gi")) || []).length} results` : ""}
            </span>
            <button onClick={() => { setShowFind(false); setFindQuery(""); }}>
              <span className="material-symbols-outlined text-[14px] text-slate-400 hover:text-white">close</span>
            </button>
          </div>
        )}

        {/* ── Main IDE ── */}
        <main className={`flex-1 flex overflow-hidden border-t ${border}`}>

          {/* ══ LEFT: File Explorer ══ */}
          <aside
            className={[
              `w-52 md:w-60 border-r ${border} ${bg} flex flex-col shrink-0`,
              rootDragOver && !dragOverFolderId ? "ring-1 ring-inset ring-blue-500 bg-blue-500/5" : "",
            ].join(" ")}
            onContextMenu={handleRootContext}
            onDragEnter={handleRootDragEnter}
            onDragLeave={handleRootDragLeave}
            onDragOver={e => e.preventDefault()}
            onDrop={handleRootDrop}
          >
            {/* Explorer header */}
            <div className={`flex items-center justify-between gap-1 px-2 py-1.5 text-[10px] font-semibold ${textDim} uppercase tracking-wider border-b ${border} ${bg2}`}>
              <span>Explorer</span>
              <div className="flex items-center gap-0.5">
                <button type="button" title="New File" onClick={() => createNewFile(null)}
                  className={`p-1 rounded hover:${text} transition-colors`}>
                  <span className="material-symbols-outlined text-[14px]">note_add</span>
                </button>
                <button type="button" title="New Folder" onClick={() => createNewFolder(null)}
                  className={`p-1 rounded hover:${text} transition-colors`}>
                  <span className="material-symbols-outlined text-[14px]">create_new_folder</span>
                </button>
                <button type="button" title="Collapse all"
                  onClick={() => setTree(prev => mapTree(prev, n => n.kind === "folder" ? { ...n, open: false } : n))}
                  className={`p-1 rounded hover:${text} transition-colors`}>
                  <span className="material-symbols-outlined text-[14px]">unfold_less</span>
                </button>
              </div>
            </div>

            {/* Project root label */}
            <div className="px-2 py-1 flex items-center gap-1.5 select-none">
              <span className="material-symbols-outlined text-[14px]" style={{ color: primary }}>folder_special</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: primary }}>
                {project.name || "project"}
              </span>
            </div>

            {/* Drag hint */}
            <div className={`px-2 pb-1 text-[9px] ${textDim} flex items-center gap-0.5`}>
              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>drag_indicator</span>
              Drag to move · Double-click to rename · Workspace syncs to the server (local backup if offline)
            </div>

            {/* Datasets section (moved up for better visibility) */}
            <div className={`mx-2 mb-2 rounded-lg border ${border} p-2 ${bg2}`}>
              <div className={`flex items-center gap-1.5 py-1 text-[10px] font-semibold ${textDim} uppercase tracking-wider`}>
                <span className="material-symbols-outlined text-[12px]">folder</span>
                <span>datasets</span>
                <span className="ml-auto">{datasets.length}</span>
              </div>
              {datasets.length === 0 ? (
                <p className={`text-[10px] ${textDim} py-1 px-1`}>No files yet — upload datasets for this project.</p>
              ) : (
                <div className="max-h-28 overflow-y-auto pr-1">
                  {datasets.map((d, i) => (
                    <div key={i} title={`${d.name} (${formatSize(d.size)})`}
                      className={`flex items-center justify-between gap-1 py-0.5 px-1 rounded hover:bg-white/5 cursor-pointer ${textDim} text-[10px]`}>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="material-symbols-outlined text-[12px] text-emerald-400 shrink-0">table_chart</span>
                        <span className="truncate">{d.name}</span>
                      </div>
                      <span className="text-[9px] shrink-0">{formatSize(d.size)}</span>
                    </div>
                  ))}
                </div>
              )}
              <label className={`flex items-center gap-1.5 py-1 px-1 rounded hover:bg-white/5 cursor-pointer text-[10px] ${textDim} mt-0.5`}>
                <span className="material-symbols-outlined text-[12px]">upload_file</span>
                Upload dataset
                <input type="file" multiple className="hidden" onChange={handleDatasetUpload} />
              </label>
            </div>

            {/* Root drop zone hint when dragging */}
            {draggingId && rootDragOver && !dragOverFolderId && (
              <div className="mx-2 mb-1 px-2 py-1 rounded border border-dashed border-blue-500 bg-blue-500/10 text-[10px] text-blue-400 text-center font-medium">
                Drop here → move to root
              </div>
            )}

            {/* Tree */}
            <div className="flex-1 overflow-y-auto pb-4">
              {tree.map(node => (
                <TreeNode key={node.id} node={node} depth={0}
                  openFileId={openFileId} renamingId={renamingId}
                  draggingId={draggingId} dragOverFolderId={dragOverFolderId}
                  onSelect={handleSelectFile} onToggle={handleToggleFolder}
                  onRename={handleRename}
                  onStartRename={id => setRenamingId(id)}
                  onCancelRename={() => setRenamingId(null)}
                  onContext={handleContext}
                  onDragStart={handleDragStart}
                  onDragEnterFolder={handleDragEnterFolder}
                  onDragLeaveFolder={handleDragLeaveFolder}
                  onDropOnFolder={handleDropOnFolder}
                />
              ))}
            </div>

          </aside>

          {/* ══ CENTER: Editor + Tabs ══ */}
          <section className={`flex-1 ${bg} flex flex-col overflow-hidden`}>
            <div className={`flex items-center ${bg2} border-b ${border} shrink-0`}>
              {([
                { id: "editor",      icon: "code",      label: "Editor"      },
                { id: "hyperparams", icon: "tune",      label: "Hyperparams" },
                { id: "metrics",     icon: "analytics", label: "Metrics"     },
                { id: "checkpoints", icon: "bookmarks", label: "Checkpoints" },
              ] as { id: TabId; icon: string; label: string }[]).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id ? "border-primary text-primary" : `border-transparent ${textDim} hover:${text}`
                  }`}>
                  <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
              {activeTab === "editor" && (
                <div className={`ml-auto pr-4 text-[10px] ${textDim} hidden md:flex items-center gap-3`}>
                  <span>{editorCode.split("\n").length} lines</span>
                </div>
              )}
            </div>

            {/* Open files (IDE tabs) */}
            {activeTab === "editor" && openTabIds.length > 0 && (
              <div className={`flex items-center gap-0.5 px-1 border-b ${border} ${bg2} overflow-x-auto shrink-0`}>
                {openTabIds.map((tid) => {
                  const node = findNode(tree, tid);
                  const name = node?.kind === "file" ? node.name : tid;
                  const active = tid === openFileId;
                  return (
                    <div
                      key={tid}
                      role="presentation"
                      className={`group flex items-stretch max-w-[160px] shrink-0 rounded-t border border-b-0 transition-colors ${
                        active
                          ? "bg-slate-950 text-white border-slate-700"
                          : `border-transparent ${textDim} hover:bg-white/5`
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectFile(tid)}
                        className="flex flex-1 min-w-0 items-center gap-1 px-2 py-1.5 text-[11px] text-left rounded-tl"
                      >
                        <span className="material-symbols-outlined text-[12px] shrink-0 opacity-70">description</span>
                        <span className="truncate font-medium">{name}</span>
                        {active && unsaved && <span className="text-amber-400 shrink-0">●</span>}
                      </button>
                      <button
                        type="button"
                        title="Close tab"
                        aria-label={`Close ${name}`}
                        onClick={(e) => handleCloseTab(tid, e)}
                        className="shrink-0 rounded-tr px-1 py-1.5 opacity-60 hover:opacity-100 hover:bg-white/10"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Editor tab */}
            {activeTab === "editor" && (
              openFileId ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-auto flex font-mono text-xs md:text-sm leading-relaxed min-h-0">
                  <div ref={lineNosRef} className={`${textDim} text-right px-3 pt-4 select-none shrink-0 text-[11px] leading-relaxed overflow-hidden`}>
                    {editorCode.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <pre
                      ref={highlightRef}
                      aria-hidden="true"
                      className={`absolute inset-0 p-4 pl-0 text-[12px] md:text-sm leading-relaxed font-mono pointer-events-none whitespace-pre overflow-auto ${text}`}
                      dangerouslySetInnerHTML={{ __html: highlightPythonLike(editorCode) }}
                    />
                    <textarea ref={textareaRef} value={editorCode}
                      onChange={e => { setEditorCode(e.target.value); setUnsaved(true); }}
                      onKeyDown={handleTabKey}
                      onScroll={handleEditorScroll}
                      onSelect={updateCursorPos}
                      onClick={updateCursorPos}
                      onKeyUp={updateCursorPos}
                      className="absolute inset-0 w-full h-full bg-transparent outline-none resize-none whitespace-pre p-4 pl-0 text-[12px] md:text-sm leading-relaxed font-mono text-transparent caret-orange-300"
                      spellCheck={false} />
                  </div>
                  </div>
                  {/* Status bar */}
                  <div className={`shrink-0 flex items-center justify-between gap-2 px-3 py-1 text-[10px] border-t ${border} ${theme === "dark" ? "bg-slate-900" : "bg-slate-100"} ${textDim}`}>
                    <span className="font-mono">
                      Ln {cursorLine}, Col {cursorCol}
                    </span>
                    <span className="hidden sm:inline">{languageFromFileName(openFileName)}</span>
                    <span className="hidden md:inline">UTF-8</span>
                    <span className="truncate max-w-[40%] text-right opacity-80">{openFileId ? pathMap[openFileId] ?? openFileName : ""}</span>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${textDim}`}>
                  <span className="material-symbols-outlined text-5xl opacity-30">description</span>
                  <p className="text-sm">Select a file to edit</p>
                  <button onClick={() => createNewFile(null)}
                    className="text-xs px-3 py-1.5 rounded border border-dashed border-slate-600 hover:border-blue-500 hover:text-blue-400 transition-colors">
                    + New File
                  </button>
                </div>
              )
            )}

            {/* Hyperparams tab */}
            {activeTab === "hyperparams" && (
              <div className={`flex-1 overflow-auto p-4 md:p-6 space-y-4 ${text}`}>
                <p className={`text-xs ${textDim} mb-4`}>Define your own training hyperparameters for this project. Changes apply on the next run.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    { key: "learningRate", label: "Learning Rate", type: "text",   hint: "e.g. 0.001" },
                    { key: "batchSize",    label: "Batch Size",    type: "number", hint: "e.g. 64"    },
                    { key: "epochs",       label: "Epochs",        type: "number", hint: "e.g. 20"    },
                    { key: "dropout",      label: "Dropout",       type: "text",   hint: "0 – 1"      },
                    { key: "hiddenSize",   label: "Hidden Size",   type: "number", hint: "e.g. 128"   },
                  ] as { key: keyof HyperParams; label: string; type: string; hint: string }[]).map(field => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className={`text-xs font-medium ${textDim}`}>{field.label}</label>
                      <input type={field.type} value={hyperParams[field.key]} placeholder={field.hint}
                        onChange={e => setHyperParams(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={`px-3 py-2 rounded-lg border ${border} ${bg2} ${text} text-sm outline-none focus:border-primary transition-colors`} />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className={`text-xs font-medium ${textDim}`}>Optimizer</label>
                    <select value={hyperParams.optimizer}
                      onChange={e => setHyperParams(prev => ({ ...prev, optimizer: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border ${border} ${bg2} ${text} text-sm outline-none focus:border-primary`}>
                      <option value="">— Select optimizer —</option>
                      {["Adam", "SGD", "AdamW", "RMSProp", "Adagrad"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className={`mt-6 rounded-xl border ${border} p-4 ${bg2} text-xs ${textDim}`}>
                  <p className="font-semibold mb-2" style={{ color: primary }}>Generated config preview</p>
                  <pre className="whitespace-pre-wrap">
{`optimizer = optim.${hyperParams.optimizer}(model.parameters(), lr=${hyperParams.learningRate})
criterion = nn.CrossEntropyLoss()
EPOCHS = ${hyperParams.epochs}  BATCH = ${hyperParams.batchSize}
DROPOUT = ${hyperParams.dropout}  HIDDEN = ${hyperParams.hiddenSize}`}
                  </pre>
                </div>
              </div>
            )}

            {/* Metrics tab */}
            {activeTab === "metrics" && (
              <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Best Acc",    value: bestAcc  ? `${bestAcc.toFixed(1)}%`  : "—", icon: "emoji_events",  color: "#34d399" },
                    { label: "Final Loss",  value: lastLoss ? lastLoss.toFixed(4)        : "—", icon: "trending_down", color: primary   },
                    { label: "Epoch",       value: currentEpoch ? `${currentEpoch}/${hyperParams.epochs || "—"}` : "—", icon: "loop", color: "#f59e0b" },
                    { label: "Checkpoints", value: checkpoints.length.toString(),              icon: "bookmarks",     color: "#a78bfa" },
                  ].map(kpi => (
                    <div key={kpi.label} className={`rounded-xl border ${border} ${bg2} p-3 flex flex-col gap-1`}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: kpi.color }}>{kpi.icon}</span>
                      <span className={`text-xl font-bold ${text}`}>{kpi.value}</span>
                      <span className={`text-[10px] ${textDim}`}>{kpi.label}</span>
                    </div>
                  ))}
                </div>
                {lossPoints.length > 0 && (
                  <div className={`rounded-xl border ${border} overflow-hidden`}>
                    <div className={`${bg2} px-4 py-2 text-[10px] font-semibold uppercase tracking-wider ${textDim} border-b ${border}`}>Training History</div>
                    <div className="overflow-x-auto">
                      <table className={`w-full text-xs ${text}`}>
                        <thead>
                          <tr className={`border-b ${border} ${bg2}`}>
                            <th className="px-4 py-2 text-left font-medium">Epoch</th>
                            <th className="px-4 py-2 text-left font-medium">Loss</th>
                            <th className="px-4 py-2 text-left font-medium">Accuracy</th>
                            <th className="px-4 py-2 text-left font-medium">Δ Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lossPoints.map((p, i) => {
                            const delta = i > 0 ? p.loss - lossPoints[i - 1].loss : null;
                            return (
                              <tr key={p.epoch} className={`border-b ${border} hover:${bg2}`}>
                                <td className="px-4 py-1.5">{p.epoch}</td>
                                <td className="px-4 py-1.5 font-mono">{p.loss.toFixed(4)}</td>
                                <td className="px-4 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`flex-1 h-1.5 rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                                      <div className="h-full rounded-full" style={{ width: `${p.acc}%`, background: "#34d399" }} />
                                    </div>
                                    <span className="font-mono w-12 text-right">{p.acc.toFixed(1)}%</span>
                                  </div>
                                </td>
                                <td className={`px-4 py-1.5 font-mono text-[11px] ${delta === null ? textDim : delta < 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(4)}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className={`rounded-xl border ${border} p-4 ${bg2}`}>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${textDim} mb-3`}>Confusion Matrix</div>
                  <ConfusionMatrix trained={trainDone} />
                </div>
              </div>
            )}

            {/* Checkpoints tab */}
            {activeTab === "checkpoints" && (
              <div className="flex-1 overflow-auto p-4 md:p-6 space-y-3">
                {checkpoints.length === 0 ? (
                  <div className={`text-center py-12 ${textDim} text-sm`}>
                    <span className="material-symbols-outlined text-4xl block mb-2">bookmarks</span>
                    No checkpoints yet. Run training to auto-save every 5 epochs.
                  </div>
                ) : checkpoints.map(ck => (
                  <div key={ck.epoch} className={`flex items-center justify-between rounded-xl border ${border} ${bg2} px-4 py-3`}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-violet-400">bookmark</span>
                      <div>
                        <p className={`text-sm font-medium ${text}`}>ckpt_epoch{ck.epoch}.pt</p>
                        <p className={`text-[11px] ${textDim}`}>Epoch {ck.epoch} · Loss {ck.loss.toFixed(4)} · Acc {ck.acc.toFixed(1)}% · {ck.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className={`text-[11px] px-2.5 py-1 rounded border ${border} ${textDim}`}>Load</button>
                      <button className="text-[11px] px-2.5 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ══ RIGHT PANEL ══ */}
          <aside className={`w-80 md:w-96 border-l ${border} flex flex-col shrink-0 ${bg}`}>
            <div className={`flex items-center ${bg2} border-b ${border} shrink-0`}>
              {([
                { id: "visualization", label: "Chart",    icon: "show_chart" },
                { id: "console",       label: "Console",  icon: "terminal"   },
                { id: "insights",      label: "Insights", icon: "lightbulb"  },
              ] as { id: RightPanelTab; label: string; icon: string }[]).map(tab => (
                <button key={tab.id} onClick={() => setRightPanelTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    rightPanelTab === tab.id ? "border-primary text-primary" : `border-transparent ${textDim} hover:${text}`
                  }`}>
                  <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {rightPanelTab === "visualization" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`px-3 py-1.5 flex items-center justify-between border-b ${border} ${bg2}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${textDim}`}>Live Charts</span>
                  <div className="flex items-center gap-2">
                    {running && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                    <span className={`text-[10px] ${currentEpoch ? "text-emerald-400" : textDim}`}>
                      {currentEpoch ? `Epoch ${currentEpoch}/${hyperParams.epochs || "—"}` : "Idle"}
                    </span>
                  </div>
                </div>
                <div className="p-3 border-b border-slate-800 h-44 flex flex-col gap-1">
                  <span className={`text-[10px] ${textDim}`}>Training Loss & Validation Accuracy</span>
                  <div className="flex-1"><LossChart points={lossPoints} theme={theme} /></div>
                  <div className="flex gap-4 text-[10px] justify-center mt-0.5">
                    <div className="flex items-center gap-1"><div className="w-3 h-0.5" style={{ background: primary }} /><span className={textDim}>Loss</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-emerald-400" /><span className={textDim}>Acc</span></div>
                  </div>
                </div>
                <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
                  <span className={`text-[10px] ${textDim}`}>Accuracy</span>
                  <div className={`h-3 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${bestAcc ?? 0}%`, background: `linear-gradient(90deg,${primary},#34d399)` }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className={textDim}>0%</span>
                    <span className="text-emerald-400 font-semibold">{bestAcc ? `${bestAcc.toFixed(1)}%` : "—"}</span>
                    <span className={textDim}>100%</span>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Parameters", value: "—" },
                    { label: "Input",      value: "—" },
                    { label: "Hidden",     value: hyperParams.hiddenSize || "—" },
                    { label: "Classes",    value: "—" },
                    { label: "Optimizer",  value: hyperParams.optimizer || "—" },
                    { label: "LR",         value: hyperParams.learningRate || "—" },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg border ${border} ${bg2} px-2 py-1.5`}>
                      <div className={`text-[9px] uppercase tracking-wider ${textDim}`}>{s.label}</div>
                      <div className={`text-xs font-mono font-semibold ${text} mt-0.5`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightPanelTab === "console" && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className={`px-3 py-1.5 flex items-center justify-between border-b ${border} ${bg2}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${textDim}`}>Console</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Clear log"
                      onClick={() => setLogs([">> Console cleared."])}
                      className={`${textDim} hover:${text} p-1 rounded`}
                    >
                      <span className="material-symbols-outlined text-[14px]">mop</span>
                    </button>
                    <button
                      type="button"
                      title="Copy all"
                      onClick={() => navigator.clipboard.writeText(logs.join("\n")).catch(() => {})}
                      className={`${textDim} hover:${text} p-1 rounded`}
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-y-auto font-mono text-[11px] space-y-0.5">
                  {logs.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith("[stderr]") || /Error|Traceback|Exception/i.test(line)
                          ? "text-rose-400 break-words"
                          : line.startsWith(">>")
                            ? textDim
                            : line.includes("✅") || line.includes("✓")
                              ? "text-emerald-400"
                              : line.includes("⏸") || line.includes("⛔")
                                ? "text-amber-400"
                                : text
                      }
                    >
                      {line || <br />}
                    </div>
                  ))}
                  {running && <div className={`animate-pulse ${textDim}`}>_</div>}
                </div>
                <div className={`shrink-0 border-t ${border} px-2 py-2 ${bg2}`}>
                  <label className={`block text-[9px] uppercase tracking-wider ${textDim} mb-1`}>Input (notes)</label>
                  <input
                    type="text"
                    value={consoleInputLine}
                    onChange={(e) => setConsoleInputLine(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && consoleInputLine.trim()) {
                        setLogs((p) => [...p, `>> ${consoleInputLine.trim()}`]);
                        setConsoleInputLine("");
                      }
                    }}
                    placeholder="Type here and press Enter — adds a line to the log (does not run Python)"
                    className={`w-full rounded-lg border ${border} bg-black/30 px-2.5 py-2 text-[11px] font-mono outline-none focus:ring-2 focus:ring-primary/25 ${text}`}
                  />
                </div>
              </div>
            )}

            {rightPanelTab === "insights" && (
              <div className="flex-1 overflow-auto p-3 space-y-3">
                <p className={`text-[11px] ${textDim}`}>AI-powered training tips based on your current metrics.</p>
                {[
                  { icon: "tips_and_updates", color: "#f59e0b", title: "Learning Rate",
                    body: trainDone && bestAcc && bestAcc > 85
                      ? "Great accuracy! Try reducing LR by 10× for fine-tuning."
                      : "Current LR looks reasonable. Monitor loss for instability." },
                  { icon: "psychology", color: "#a78bfa", title: "Overfitting Risk",
                    body: lossPoints.length > 5
                      ? "Loss is steadily decreasing — no signs of overfitting yet."
                      : "Run more epochs to detect potential overfitting." },
                  { icon: "speed", color: "#34d399", title: "Batch Size",
                    body: hyperParams.batchSize
                      ? `Batch ${hyperParams.batchSize}: larger batches often train faster; smaller batches can generalize better.`
                      : "Set batch size in Hyperparams to compare with your training runs." },
                  { icon: "architecture", color: primary, title: "Architecture",
                    body: `Hidden ${hyperParams.hiddenSize || "—"} + dropout ${hyperParams.dropout || "—"} — tune these for your dataset and model.` },
                ].map(tip => (
                  <div key={tip.title} className={`rounded-xl border ${border} ${bg2} p-3 flex gap-3`}>
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: tip.color }}>{tip.icon}</span>
                    <div>
                      <p className={`text-xs font-semibold ${text} mb-0.5`}>{tip.title}</p>
                      <p className={`text-[11px] ${textDim} leading-relaxed`}>{tip.body}</p>
                    </div>
                  </div>
                ))}
                {trainDone && (
                  <div className="rounded-xl border p-3 flex gap-3" style={{ borderColor: `${primary}40`, background: `${primary}10` }}>
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: primary }}>auto_awesome</span>
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: primary }}>Training Complete</p>
                      <p className={`text-[11px] ${textDim} leading-relaxed`}>
                        Best accuracy {bestAcc?.toFixed(1)}%. Consider exporting or submitting for evaluation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </main>
      </div>

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <div className="fixed z-50 rounded-lg border border-slate-700 bg-slate-800 shadow-xl py-1 text-xs text-slate-200 min-w-[160px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={e => e.stopPropagation()}>
          {(ctxMenu.kind === "folder" || ctxMenu.kind === "root") && (
            <>
              <button className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center gap-2"
                onClick={() => createNewFile(ctxMenu.nodeId)}>
                <span className="material-symbols-outlined text-[14px] text-blue-400">note_add</span> New File
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center gap-2"
                onClick={() => createNewFolder(ctxMenu.nodeId)}>
                <span className="material-symbols-outlined text-[14px] text-yellow-400">create_new_folder</span> New Folder
              </button>
              <div className="my-1 border-t border-slate-700" />
            </>
          )}
          {ctxMenu.nodeId && (
            <>
              <button className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center gap-2"
                onClick={() => { setRenamingId(ctxMenu.nodeId!); setCtxMenu(null); }}>
                <span className="material-symbols-outlined text-[14px] text-slate-400">edit</span> Rename
              </button>
              {ctxMenu.kind === "file" && (
                <button className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center gap-2"
                  onClick={() => { handleSelectFile(ctxMenu.nodeId!); setCtxMenu(null); }}>
                  <span className="material-symbols-outlined text-[14px] text-slate-400">open_in_new</span> Open
                </button>
              )}
              <div className="my-1 border-t border-slate-700" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-red-900/50 text-red-400 flex items-center gap-2"
                onClick={() => handleDelete(ctxMenu.nodeId!)}>
                <span className="material-symbols-outlined text-[14px]">delete</span> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Shortcuts modal ── */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Keyboard shortcuts</h3>
              <button type="button" onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-white/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-4"><span>Save file</span><kbd className="px-2 py-0.5 rounded bg-slate-800 text-xs">⌘/Ctrl + S</kbd></li>
              <li className="flex justify-between gap-4"><span>Find in file</span><kbd className="px-2 py-0.5 rounded bg-slate-800 text-xs">⌘/Ctrl + F</kbd></li>
              <li className="flex justify-between gap-4"><span>Train (simulated)</span><kbd className="px-2 py-0.5 rounded bg-slate-800 text-xs">⌘/Ctrl + Enter</kbd></li>
              <li className="flex justify-between gap-4"><span>Run current .py (server when API up)</span><kbd className="px-2 py-0.5 rounded bg-slate-800 text-xs">⌘/Ctrl + Shift + Enter</kbd></li>
              <li className="flex justify-between gap-4"><span>Indent</span><kbd className="px-2 py-0.5 rounded bg-slate-800 text-xs">Tab</kbd></li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Workspace is stored in the <strong>database</strong> per project (debounced sync). The browser keeps a backup in <strong>localStorage</strong> if the API is unreachable. Export JSON for offline backup.
            </p>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={[
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 pointer-events-none transition-all",
          toast.ok
            ? "bg-slate-800 border border-emerald-500/50 text-emerald-300"
            : "bg-slate-800 border border-red-500/50 text-red-300",
        ].join(" ")}>
          <span className="material-symbols-outlined text-[15px]">{toast.ok ? "drive_file_move" : "error"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
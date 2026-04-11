"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { patchNote } from "@/lib/studentNotesApi";
import { primary } from "@/lib/theme";

const SCENE_VERSION = 3 as const;

export type ShapeKind = "rect" | "ellipse" | "line" | "arrow" | "triangle";

/** One drawable object on the board (supports drag via tx, ty in normalized space). */
export type CanvasItem =
  | {
      id: string;
      type: "freehand";
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      points: { nx: number; ny: number }[];
      tx: number;
      ty: number;
    }
  | {
      id: string;
      type: "curve";
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      points: { nx: number; ny: number }[];
      tx: number;
      ty: number;
    }
  | {
      id: string;
      type: ShapeKind;
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      nx1: number;
      ny1: number;
      nx2: number;
      ny2: number;
      tx: number;
      ty: number;
    }
  | {
      id: string;
      type: "text";
      color: string;
      nx: number;
      ny: number;
      text: string;
      /** Font height as fraction of min(canvas w,h) */
      fontNorm: number;
      tx: number;
      ty: number;
    };

type PersistedScene = { v: typeof SCENE_VERSION; items: CanvasItem[] };

const COLORS = [
  { hex: "#fafafa", label: "White" },
  { hex: primary, label: "Orange" },
  { hex: "#facc15", label: "Yellow" },
  { hex: "#4ade80", label: "Green" },
  { hex: "#60a5fa", label: "Blue" },
  { hex: "#c084fc", label: "Purple" },
  { hex: "#fb7185", label: "Rose" },
  { hex: "#94a3b8", label: "Slate" },
];

const SHAPE_TOOLS: { id: ShapeKind; label: string }[] = [
  { id: "rect", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "line", label: "Straight line" },
  { id: "arrow", label: "Arrow line" },
  { id: "triangle", label: "Triangle" },
];

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ToolIconFrame({
  active,
  title,
  ariaLabel,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
        active ? "bg-orange-500/25 text-orange-200 ring-1 ring-orange-500/35" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      }`}
    >
      <span className="pointer-events-none [&_svg]:h-[18px] [&_svg]:w-[18px]" aria-hidden>
        {children}
      </span>
    </button>
  );
}

function IconDraw() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19h9" />
      <path d="M18 2 22 6 7 21H3v-4L18 2z" />
    </svg>
  );
}

function IconCurve() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M3 18c4-8 8-14 18-14" />
    </svg>
  );
}

function IconText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 7V5h16v2" />
      <path d="M9 21h6" />
      <path d="M12 5v16" />
    </svg>
  );
}

function IconSelect() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.66 7.66-2.51L3 3z" />
      <path d="m13 13 6 6" />
    </svg>
  );
}

function IconShapeRect() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
    </svg>
  );
}

function IconShapeEllipse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <ellipse cx="12" cy="12" rx="9" ry="6" />
    </svg>
  );
}

function IconShapeLine() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}

function IconShapeArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="18" x2="17" y2="6" />
      <polyline points="11,6 17,6 17,12" />
    </svg>
  );
}

function IconShapeTriangle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
      <path d="M12 4 20 19H4L12 4z" />
    </svg>
  );
}

function shapeIcon(id: ShapeKind) {
  switch (id) {
    case "rect":
      return <IconShapeRect />;
    case "ellipse":
      return <IconShapeEllipse />;
    case "line":
      return <IconShapeLine />;
    case "arrow":
      return <IconShapeArrow />;
    case "triangle":
      return <IconShapeTriangle />;
  }
}

/** Legacy v2 stroke → v3 item */
type LegacyStroke =
  | {
      tool: "freehand";
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      points: { nx: number; ny: number }[];
    }
  | {
      tool: ShapeKind;
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      nx1: number;
      ny1: number;
      nx2: number;
      ny2: number;
    };

function legacyToItems(strokes: LegacyStroke[]): CanvasItem[] {
  return strokes.map((s) => {
    const id = newId();
    const t = { tx: 0, ty: 0 };
    if (s.tool === "freehand") {
      return { id, type: "freehand", ...s, ...t };
    }
    return { id, type: s.tool, color: s.color, widthNorm: s.widthNorm, mode: s.mode, nx1: s.nx1, ny1: s.ny1, nx2: s.nx2, ny2: s.ny2, ...t };
  });
}

function validateItem(raw: unknown): CanvasItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string") return null;
  const tx = typeof o.tx === "number" ? o.tx : 0;
  const ty = typeof o.ty === "number" ? o.ty : 0;

  if (o.type === "text" && typeof o.color === "string" && typeof o.nx === "number" && typeof o.ny === "number" && typeof o.text === "string") {
    const fontNorm = typeof o.fontNorm === "number" ? o.fontNorm : 0.028;
    return { id: o.id, type: "text", color: o.color, nx: o.nx, ny: o.ny, text: o.text, fontNorm, tx, ty };
  }

  if (o.type === "curve" && typeof o.color === "string" && typeof o.widthNorm === "number" && (o.mode === "pen" || o.mode === "highlighter") && Array.isArray(o.points)) {
    return {
      id: o.id,
      type: "curve",
      color: o.color,
      widthNorm: o.widthNorm,
      mode: o.mode,
      points: o.points as { nx: number; ny: number }[],
      tx,
      ty,
    };
  }

  if (o.type === "freehand" && typeof o.color === "string" && typeof o.widthNorm === "number" && (o.mode === "pen" || o.mode === "highlighter") && Array.isArray(o.points)) {
    return {
      id: o.id,
      type: "freehand",
      color: o.color,
      widthNorm: o.widthNorm,
      mode: o.mode,
      points: o.points as { nx: number; ny: number }[],
      tx,
      ty,
    };
  }

  if (
    (o.type === "rect" ||
      o.type === "ellipse" ||
      o.type === "line" ||
      o.type === "arrow" ||
      o.type === "triangle") &&
    typeof o.color === "string" &&
    typeof o.widthNorm === "number" &&
    (o.mode === "pen" || o.mode === "highlighter") &&
    typeof o.nx1 === "number" &&
    typeof o.ny1 === "number" &&
    typeof o.nx2 === "number" &&
    typeof o.ny2 === "number"
  ) {
    return {
      id: o.id,
      type: o.type,
      color: o.color,
      widthNorm: o.widthNorm,
      mode: o.mode,
      nx1: o.nx1,
      ny1: o.ny1,
      nx2: o.nx2,
      ny2: o.ny2,
      tx,
      ty,
    };
  }
  return null;
}

function parseScene(json: string | null | undefined): CanvasItem[] {
  if (!json?.trim()) return [];
  try {
    const o = JSON.parse(json) as { v?: number; strokes?: unknown[]; items?: unknown[] };

    if (o.v === 3 && Array.isArray(o.items)) {
      return o.items.map(validateItem).filter((x): x is CanvasItem => x != null);
    }

    if (o.v === 2 && Array.isArray(o.strokes)) {
      const strokes = o.strokes.filter((s): s is LegacyStroke => s != null && typeof s === "object" && "tool" in (s as object));
      return legacyToItems(strokes);
    }

    if (o.v === 1 && Array.isArray(o.strokes)) {
      const out: LegacyStroke[] = [];
      for (const s of o.strokes) {
        if (!s || typeof s !== "object") continue;
        const r = s as Record<string, unknown>;
        if (
          typeof r.color === "string" &&
          typeof r.widthNorm === "number" &&
          (r.mode === "pen" || r.mode === "highlighter") &&
          Array.isArray(r.points)
        ) {
          out.push({
            tool: "freehand",
            color: r.color,
            widthNorm: r.widthNorm,
            mode: r.mode,
            points: r.points as { nx: number; ny: number }[],
          });
        }
      }
      return legacyToItems(out);
    }
  } catch {
    /* ignore */
  }
  return [];
}

function serializeScene(items: CanvasItem[]): string {
  return JSON.stringify({ v: SCENE_VERSION, items } satisfies PersistedScene);
}

type DrawTool = "select" | "freehand" | "curve" | "text" | ShapeKind;

type CurrentDrawing =
  | {
      kind: "freehand" | "curve";
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      points: { nx: number; ny: number }[];
    }
  | {
      kind: "shape";
      shape: ShapeKind;
      color: string;
      widthNorm: number;
      mode: "pen" | "highlighter";
      nx1: number;
      ny1: number;
      nx2: number;
      ny2: number;
    };

function applyStrokeStyle(
  ctx: CanvasRenderingContext2D,
  s: { color: string; widthNorm: number; mode: "pen" | "highlighter" },
  minDim: number
) {
  const lw = s.widthNorm * minDim;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (s.mode === "highlighter") {
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = Math.max(lw * 3.2, 14);
  } else {
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(lw, 1.2);
  }
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number
) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - Math.PI / 6), y2 - size * Math.sin(ang - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(ang + Math.PI / 6), y2 - size * Math.sin(ang + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: { nx: number; ny: number }[],
  w: number,
  h: number,
  tx: number,
  ty: number
) {
  if (points.length < 2) return;
  const p0 = points[0]!;
  ctx.moveTo((p0.nx + tx) * w, (p0.ny + ty) * h);
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    ctx.lineTo((p.nx + tx) * w, (p.ny + ty) * h);
  }
}

/** Smooth curve through sampled points (quadratic midpoints). */
function drawSmoothCurve(
  ctx: CanvasRenderingContext2D,
  points: { nx: number; ny: number }[],
  w: number,
  h: number,
  tx: number,
  ty: number
) {
  if (points.length < 2) return;
  const P = points.map((p) => ({ x: (p.nx + tx) * w, y: (p.ny + ty) * h }));
  if (P.length === 2) {
    ctx.moveTo(P[0]!.x, P[0]!.y);
    ctx.lineTo(P[1]!.x, P[1]!.y);
    return;
  }
  ctx.moveTo(P[0]!.x, P[0]!.y);
  for (let i = 1; i < P.length - 1; i++) {
    const xc = (P[i]!.x + P[i + 1]!.x) / 2;
    const yc = (P[i]!.y + P[i + 1]!.y) / 2;
    ctx.quadraticCurveTo(P[i]!.x, P[i]!.y, xc, yc);
  }
  const last = P[P.length - 1]!;
  const prev = P[P.length - 2]!;
  ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
}

function drawShapeStroke(
  ctx: CanvasRenderingContext2D,
  s: Extract<CanvasItem, { type: ShapeKind }>,
  w: number,
  h: number,
  minDim: number
) {
  applyStrokeStyle(ctx, s, minDim);
  const tx = s.tx;
  const ty = s.ty;
  const x1 = (Math.min(s.nx1, s.nx2) + tx) * w;
  const y1 = (Math.min(s.ny1, s.ny2) + ty) * h;
  const x2 = (Math.max(s.nx1, s.nx2) + tx) * w;
  const y2 = (Math.max(s.ny1, s.ny2) + ty) * h;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rw = (x2 - x1) / 2;
  const rh = (y2 - y1) / 2;

  ctx.beginPath();
  switch (s.type) {
    case "rect":
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      break;
    case "ellipse":
      if (rw > 0 && rh > 0) ctx.ellipse(cx, cy, Math.abs(rw), Math.abs(rh), 0, 0, Math.PI * 2);
      break;
    case "line":
      ctx.moveTo((s.nx1 + tx) * w, (s.ny1 + ty) * h);
      ctx.lineTo((s.nx2 + tx) * w, (s.ny2 + ty) * h);
      break;
    case "arrow": {
      const ax1 = (s.nx1 + tx) * w;
      const ay1 = (s.ny1 + ty) * h;
      const ax2 = (s.nx2 + tx) * w;
      const ay2 = (s.ny2 + ty) * h;
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.stroke();
      ctx.globalAlpha = s.mode === "highlighter" ? 0.38 : 1;
      const head = Math.max(10, ctx.lineWidth * 3);
      drawArrowHead(ctx, ax1, ay1, ax2, ay2, head);
      ctx.globalAlpha = 1;
      return;
    }
    case "triangle": {
      const apexX = (x1 + x2) / 2;
      const apexY = y1;
      const baseY = y2;
      ctx.moveTo(x1, baseY);
      ctx.lineTo(x2, baseY);
      ctx.lineTo(apexX, apexY);
      ctx.closePath();
      break;
    }
    default:
      break;
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFreehand(
  ctx: CanvasRenderingContext2D,
  s: Extract<CanvasItem, { type: "freehand" }>,
  w: number,
  h: number,
  minDim: number
) {
  if (s.points.length < 2) return;
  applyStrokeStyle(ctx, s, minDim);
  ctx.beginPath();
  drawPolyline(ctx, s.points, w, h, s.tx, s.ty);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCurveItem(
  ctx: CanvasRenderingContext2D,
  s: Extract<CanvasItem, { type: "curve" }>,
  w: number,
  h: number,
  minDim: number
) {
  if (s.points.length < 2) return;
  applyStrokeStyle(ctx, s, minDim);
  ctx.beginPath();
  drawSmoothCurve(ctx, s.points, w, h, s.tx, s.ty);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawTextItem(ctx: CanvasRenderingContext2D, s: Extract<CanvasItem, { type: "text" }>, w: number, h: number, minDim: number) {
  const fs = Math.max(10, s.fontNorm * minDim);
  ctx.font = `600 ${fs}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = s.color;
  ctx.globalAlpha = 1;
  const x = (s.nx + s.tx) * w;
  const y = (s.ny + s.ty) * h + fs;
  ctx.fillText(s.text, x, y);
}

function itemBBox(item: CanvasItem): { minX: number; minY: number; maxX: number; maxY: number } {
  const pad = 0.012;
  switch (item.type) {
    case "freehand":
    case "curve": {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of item.points) {
        const nx = p.nx + item.tx;
        const ny = p.ny + item.ty;
        minX = Math.min(minX, nx);
        minY = Math.min(minY, ny);
        maxX = Math.max(maxX, nx);
        maxY = Math.max(maxY, ny);
      }
      return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
    }
    case "text": {
      const charW = item.fontNorm * 0.55;
      const tw = Math.max(charW * item.text.length, charW * 3);
      const th = item.fontNorm * 1.2;
      const nx = item.nx + item.tx;
      const ny = item.ny + item.ty;
      return { minX: nx - pad, minY: ny - pad, maxX: nx + tw + pad, maxY: ny + th + pad };
    }
    default: {
      const nx1 = item.nx1 + item.tx;
      const ny1 = item.ny1 + item.ty;
      const nx2 = item.nx2 + item.tx;
      const ny2 = item.ny2 + item.ty;
      return {
        minX: Math.min(nx1, nx2) - pad,
        minY: Math.min(ny1, ny2) - pad,
        maxX: Math.max(nx1, nx2) + pad,
        maxY: Math.max(ny1, ny2) + pad,
      };
    }
  }
}

function hitTest(nx: number, ny: number, item: CanvasItem): boolean {
  const b = itemBBox(item);
  return nx >= b.minX && nx <= b.maxX && ny >= b.minY && ny <= b.maxY;
}

type Props = {
  noteId: number;
  noteTitle?: string;
  sceneJson: string | null;
  onSceneSaved?: () => void;
};

export function StudentNotesCanvas({ noteId, noteTitle = "Note", sceneJson, onSceneSaved }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<CanvasItem[]>(parseScene(sceneJson));
  const currentRef = useRef<CurrentDrawing | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    id: string;
    startPointerNx: number;
    startPointerNy: number;
    origTx: number;
    origTy: number;
  } | null>(null);

  const [items, setItems] = useState<CanvasItem[]>(() => parseScene(sceneJson));
  const [color, setColor] = useState(COLORS[1]!.hex);
  const [mode, setMode] = useState<"pen" | "highlighter">("pen");
  const [drawTool, setDrawTool] = useState<DrawTool>("freehand");
  const [saveHint, setSaveHint] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState<{ nx: number; ny: number; px: number; py: number } | null>(null);
  const [textDraft, setTextDraft] = useState("");

  useEffect(() => {
    const next = parseScene(sceneJson);
    setItems(next);
    itemsRef.current = next;
    setSelectedId(null);
  }, [noteId, sceneJson]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = wrap.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w < 1 || h < 1) return;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, w, h);

    const grid = 28;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }

    const minDim = Math.min(w, h);
    const list: CanvasItem[] = [...itemsRef.current];

    if (currentRef.current) {
      const cur = currentRef.current;
      if (cur.kind === "freehand") {
        list.push({
          id: "__preview__",
          type: "freehand",
          color: cur.color,
          widthNorm: cur.widthNorm,
          mode: cur.mode,
          points: cur.points,
          tx: 0,
          ty: 0,
        });
      } else if (cur.kind === "curve") {
        list.push({
          id: "__preview__",
          type: "curve",
          color: cur.color,
          widthNorm: cur.widthNorm,
          mode: cur.mode,
          points: cur.points,
          tx: 0,
          ty: 0,
        });
      } else if (cur.kind === "shape") {
        list.push({
          id: "__preview__",
          type: cur.shape,
          color: cur.color,
          widthNorm: cur.widthNorm,
          mode: cur.mode,
          nx1: cur.nx1,
          ny1: cur.ny1,
          nx2: cur.nx2,
          ny2: cur.ny2,
          tx: 0,
          ty: 0,
        });
      }
    }

    for (const it of list) {
      if (it.id === "__preview__") {
        if (it.type === "freehand") drawFreehand(ctx, it, w, h, minDim);
        else if (it.type === "curve") drawCurveItem(ctx, it, w, h, minDim);
        else if (it.type !== "text") drawShapeStroke(ctx, it, w, h, minDim);
        continue;
      }
      if (it.type === "freehand") drawFreehand(ctx, it, w, h, minDim);
      else if (it.type === "curve") drawCurveItem(ctx, it, w, h, minDim);
      else if (it.type === "text") drawTextItem(ctx, it, w, h, minDim);
      else drawShapeStroke(ctx, it, w, h, minDim);
    }

    if (selectedId) {
      const sel = itemsRef.current.find((x) => x.id === selectedId);
      if (sel) {
        const b = itemBBox(sel);
        ctx.strokeStyle = "rgba(255,122,26,0.85)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(b.minX * w, b.minY * h, (b.maxX - b.minX) * w, (b.maxY - b.minY) * h);
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }, [selectedId]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const r = wrap.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(r.width));
      const cssH = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const c = canvas.getContext("2d");
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [draw, noteId]);

  useLayoutEffect(() => {
    draw();
  }, [draw, items]);

  const scheduleSave = useCallback(
    (next: CanvasItem[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveHint("saving");
      saveTimerRef.current = setTimeout(async () => {
        const json = serializeScene(next);
        const r = await patchNote(noteId, { scene_json: json });
        if (r.ok) {
          onSceneSaved?.();
          setSaveHint("saved");
          window.setTimeout(() => setSaveHint("idle"), 1600);
        } else {
          setSaveHint("idle");
        }
      }, 650);
    },
    [noteId, onSceneSaved]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      void patchNote(noteId, { scene_json: serializeScene(itemsRef.current) });
    };
  }, [noteId]);

  const widthNorm = mode === "highlighter" ? 0.018 : 0.0032;

  function pushItem(it: CanvasItem) {
    setItems((prev) => {
      const next = [...prev, it];
      itemsRef.current = next;
      scheduleSave(next);
      return next;
    });
  }

  function applyDragTransform(id: string, tx: number, ty: number) {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, tx, ty } : it));
      itemsRef.current = next;
      return next;
    });
  }

  function findHit(nx: number, ny: number): string | null {
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const it = itemsRef.current[i]!;
      if (hitTest(nx, ny, it)) return it.id;
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const br = canvas.getBoundingClientRect();
    const nx = (e.clientX - br.left) / br.width;
    const ny = (e.clientY - br.top) / br.height;

    if (drawTool === "select") {
      const id = findHit(nx, ny);
      setSelectedId(id);
      if (id) {
        const it = itemsRef.current.find((x) => x.id === id);
        if (it) {
          dragRef.current = {
            id,
            startPointerNx: nx,
            startPointerNy: ny,
            origTx: it.tx,
            origTy: it.ty,
          };
        }
      } else {
        dragRef.current = null;
      }
      canvas.setPointerCapture(e.pointerId);
      draw();
      return;
    }

    if (drawTool === "text") {
      setTextPrompt({ nx, ny, px: e.clientX - br.left, py: e.clientY - br.top });
      setTextDraft("");
      return;
    }

    if (drawTool === "freehand") {
      currentRef.current = {
        kind: "freehand",
        color,
        widthNorm,
        mode,
        points: [{ nx, ny }, { nx, ny }],
      };
    } else if (drawTool === "curve") {
      currentRef.current = {
        kind: "curve",
        color,
        widthNorm,
        mode,
        points: [{ nx, ny }, { nx, ny }],
      };
    } else {
      currentRef.current = {
        kind: "shape",
        shape: drawTool,
        color,
        widthNorm,
        mode,
        nx1: nx,
        ny1: ny,
        nx2: nx,
        ny2: ny,
      };
    }
    canvas.setPointerCapture(e.pointerId);
    draw();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const br = canvas.getBoundingClientRect();
    const nx = (e.clientX - br.left) / br.width;
    const ny = (e.clientY - br.top) / br.height;

    if (drawTool === "select" && dragRef.current) {
      const d = dragRef.current;
      const newTx = d.origTx + (nx - d.startPointerNx);
      const newTy = d.origTy + (ny - d.startPointerNy);
      applyDragTransform(d.id, newTx, newTy);
      draw();
      return;
    }

    if (!currentRef.current) return;

    const cur = currentRef.current;
    if (cur.kind === "freehand" || cur.kind === "curve") {
      cur.points.push({ nx, ny });
    } else if (cur.kind === "shape") {
      cur.nx2 = nx;
      cur.ny2 = ny;
    }
    draw();
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (drawTool === "select") {
      if (dragRef.current) {
        scheduleSave(itemsRef.current);
      }
      dragRef.current = null;
      draw();
      return;
    }

    if (!currentRef.current) return;

    const cur = currentRef.current;
    currentRef.current = null;
    const id = newId();

    if (cur.kind === "freehand") {
      if (cur.points.length >= 2) {
        pushItem({
          id,
          type: "freehand",
          color: cur.color,
          widthNorm: cur.widthNorm,
          mode: cur.mode,
          points: cur.points,
          tx: 0,
          ty: 0,
        });
      }
    } else if (cur.kind === "curve") {
      if (cur.points.length >= 2) {
        pushItem({
          id,
          type: "curve",
          color: cur.color,
          widthNorm: cur.widthNorm,
          mode: cur.mode,
          points: cur.points,
          tx: 0,
          ty: 0,
        });
      }
    } else if (cur.kind === "shape") {
      const br = canvas?.getBoundingClientRect();
      const dx = Math.abs(cur.nx2 - cur.nx1) * (br?.width ?? 1);
      const dy = Math.abs(cur.ny2 - cur.ny1) * (br?.height ?? 1);
      if (dx * dx + dy * dy >= 9) {
        pushItem({
          id,
          type: cur.shape,
          color: cur.color,
          widthNorm: cur.widthNorm,
          mode: cur.mode,
          nx1: cur.nx1,
          ny1: cur.ny1,
          nx2: cur.nx2,
          ny2: cur.ny2,
          tx: 0,
          ty: 0,
        });
      }
    }
    draw();
  }

  function commitText() {
    if (!textPrompt) return;
    const t = textDraft.trim();
    if (t) {
      pushItem({
        id: newId(),
        type: "text",
        color,
        nx: textPrompt.nx,
        ny: textPrompt.ny,
        text: t,
        fontNorm: 0.032,
        tx: 0,
        ty: 0,
      });
    }
    setTextPrompt(null);
    setTextDraft("");
    draw();
  }

  function undo() {
    setItems((prev) => {
      const next = prev.slice(0, -1);
      itemsRef.current = next;
      scheduleSave(next);
      return next;
    });
    setSelectedId(null);
  }

  function clearAll() {
    if (!window.confirm("Clear the whole canvas?")) return;
    setItems([]);
    itemsRef.current = [];
    setSelectedId(null);
    scheduleSave([]);
    draw();
  }

  const canvasCursor =
    drawTool === "select" ? "cursor-grab active:cursor-grabbing" : drawTool === "text" ? "cursor-text" : "cursor-crosshair";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-orange-500/20 bg-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-800/80 bg-zinc-900/90 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-xs font-medium text-zinc-500 sm:inline">{noteTitle}</span>
          <div className="mx-1 h-5 w-px bg-zinc-700/80" aria-hidden />

          <div className="flex flex-wrap items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                onClick={() => setColor(c.hex)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  color === c.hex ? "border-white ring-2 ring-orange-500/50" : "border-zinc-600 hover:border-zinc-400"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <div className="mx-1 h-5 w-px bg-zinc-700/80" aria-hidden />

          <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-zinc-700/80 p-1" role="toolbar" aria-label="Drawing tools">
            <ToolIconFrame
              active={drawTool === "select"}
              title="Select and drag"
              ariaLabel="Select and drag"
              onClick={() => {
                setDrawTool("select");
                setTextPrompt(null);
              }}
            >
              <IconSelect />
            </ToolIconFrame>
            <ToolIconFrame
              active={drawTool === "freehand"}
              title="Freehand draw"
              ariaLabel="Freehand draw"
              onClick={() => setDrawTool("freehand")}
            >
              <IconDraw />
            </ToolIconFrame>
            <ToolIconFrame
              active={drawTool === "curve"}
              title="Curve line"
              ariaLabel="Curve line"
              onClick={() => setDrawTool("curve")}
            >
              <IconCurve />
            </ToolIconFrame>
            <ToolIconFrame
              active={drawTool === "text"}
              title="Text"
              ariaLabel="Text"
              onClick={() => setDrawTool("text")}
            >
              <IconText />
            </ToolIconFrame>
            {SHAPE_TOOLS.map(({ id, label }) => (
              <ToolIconFrame
                key={id}
                active={drawTool === id}
                title={label}
                ariaLabel={label}
                onClick={() => setDrawTool(id)}
              >
                {shapeIcon(id)}
              </ToolIconFrame>
            ))}
          </div>

          <div className="mx-1 h-5 w-px bg-zinc-700/80" aria-hidden />

          <div className="flex rounded-lg border border-zinc-700/80 p-0.5">
            <button
              type="button"
              onClick={() => setMode("pen")}
              disabled={drawTool === "text"}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                mode === "pen" ? "bg-orange-500/25 text-orange-100" : "text-zinc-400 hover:text-zinc-200"
              } disabled:opacity-40`}
            >
              Pen
            </button>
            <button
              type="button"
              onClick={() => setMode("highlighter")}
              disabled={drawTool === "text"}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                mode === "highlighter" ? "bg-amber-500/25 text-amber-100" : "text-zinc-400 hover:text-zinc-200"
              } disabled:opacity-40`}
            >
              Highlighter
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-zinc-500" aria-live="polite">
              {saveHint === "saving" && "Saving…"}
              {saveHint === "saved" && "Saved"}
            </span>
            <button
              type="button"
              onClick={undo}
              disabled={items.length === 0}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-red-500/30 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-950/40"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600">
          Select: click an object, then drag to move. Text: click to type. Curve: smooth line. Shapes: drag to size. v3 format saves positions.
        </p>
      </div>

      <div ref={wrapRef} className="relative min-h-0 flex-1 bg-zinc-950">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 touch-none ${canvasCursor}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
        {textPrompt && (
          <div
            className="absolute z-20 flex flex-col gap-1 rounded-lg border border-orange-500/30 bg-zinc-900 p-2 shadow-xl"
            style={{ left: textPrompt.px, top: textPrompt.py, minWidth: 200, transform: "translate(-4px,-4px)" }}
          >
            <input
              autoFocus
              className="w-full rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-orange-500/50"
              placeholder="Type text…"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitText();
                }
                if (e.key === "Escape") {
                  setTextPrompt(null);
                  setTextDraft("");
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300" onClick={() => setTextPrompt(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-orange-600/80 px-2 py-1 text-xs font-medium text-white hover:bg-orange-500"
                onClick={commitText}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

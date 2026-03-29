/**
 * Brand palette: deep black surfaces + vivid orange CTAs.
 * Tailwind reads matching CSS variables from globals.css.
 */
export const theme = {
  /** Primary orange — buttons & key actions */
  primary: "#ff7a1a",
  /** Darker orange (hover / emphasis) */
  primaryDark: "#ea580c",
  /** Mid orange */
  primaryMid: "#fb923c",
  /** Light orange (highlights) */
  primaryLight: "#fdba74",
  /** Near-black app shell */
  backgroundDark: "#030303",
  /** Elevated surface */
  surface: "#0c0c0f",
  white: "#ffffff",
} as const;

export const primary = theme.primary;

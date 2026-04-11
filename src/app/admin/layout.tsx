/** Routes under /admin — login is public; (panel) routes use AdminGate + shell. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

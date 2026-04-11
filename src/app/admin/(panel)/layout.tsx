import { AdminGate } from "../AdminGate";
import { AdminShell } from "../AdminShell";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}

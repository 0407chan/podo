import type { PropsWithChildren } from "react";
import { Sidebar } from "../components/sidebar/Sidebar";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

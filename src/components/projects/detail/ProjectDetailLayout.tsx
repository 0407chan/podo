import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export function ProjectDetailLayout({ left, right }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "start",
        justifyContent: "start",
      }}
    >
      <div
        style={{
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "calc(100vh - 48px)",
        }}
      >
        {left}
      </div>
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
      >
        {right}
      </div>
    </div>
  );
}

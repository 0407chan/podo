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
        padding: 16,
        alignItems: "start",
        justifyContent: "start",
        background: "#FAFAFB",
      }}
    >
      <div
        style={{
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "sticky",
          top: 16,
          alignSelf: "flex-start",

          height: "100%",
          overflow: "auto",
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

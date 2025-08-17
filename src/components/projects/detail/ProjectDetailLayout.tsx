import { Col, Row } from "antd";
import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export function ProjectDetailLayout({ left, right }: Props) {
  return (
    <Row
      gutter={16}
      wrap={false}
      style={{ height: "calc(100vh - 48px)", overflow: "hidden" }}
    >
      <Col
        flex="340px"
        style={{ display: "grid", gap: 12, height: "100%", overflow: "hidden" }}
      >
        {left}
      </Col>
      <Col
        flex="auto"
        style={{ display: "grid", gap: 12, height: "100%", overflow: "hidden" }}
      >
        {right}
      </Col>
    </Row>
  );
}

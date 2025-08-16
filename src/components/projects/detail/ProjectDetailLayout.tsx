import { Col, Row } from "antd";
import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export function ProjectDetailLayout({ left, right }: Props) {
  return (
    <Row gutter={16} wrap={false}>
      <Col flex="340px" style={{ display: "grid", gap: 12 }}>
        {left}
      </Col>
      <Col flex="auto" style={{ display: "grid", gap: 12 }}>
        {right}
      </Col>
    </Row>
  );
}

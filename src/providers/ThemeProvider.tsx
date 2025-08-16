import { ConfigProvider, theme } from "antd";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {},
      }}
    >
      {children}
    </ConfigProvider>
  );
}

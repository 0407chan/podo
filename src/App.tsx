import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { QueryProvider } from "./providers/QueryProvider";
import { SessionGate } from "./providers/SessionGate.tsx";
import { ThemeProvider } from "./providers/ThemeProvider";

function App() {
  return (
    <QueryProvider>
      <SessionGate>
        <ThemeProvider>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/projects" replace />} />
                <Route
                  path="/projects"
                  element={
                    <div style={{ color: "#6b7280" }}>
                      프로젝트를 왼쪽에서 선택해줘
                    </div>
                  }
                />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </ThemeProvider>
      </SessionGate>
    </QueryProvider>
  );
}

export default App;

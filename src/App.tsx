import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { LandingPage } from "./pages/LandingPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { QueryProvider } from "./providers/QueryProvider";
import { RequireAuth } from "./providers/RequireAuth";
import { SessionGate } from "./providers/SessionGate.tsx";
import { ThemeProvider } from "./providers/ThemeProvider";

function App() {
  return (
    <QueryProvider>
      <SessionGate>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/projects"
                element={
                  <RequireAuth>
                    <MainLayout>
                      <div style={{ color: "#6b7280" }}>
                        프로젝트를 왼쪽에서 선택해주세요
                      </div>
                    </MainLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <RequireAuth>
                    <MainLayout>
                      <ProjectDetailPage />
                    </MainLayout>
                  </RequireAuth>
                }
              />
              <Route path="/invite" element={<InviteAcceptPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </SessionGate>
    </QueryProvider>
  );
}

export default App;

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Shell from "./components/Shell";
import Desk from "./pages/Desk";
import Orders from "./pages/Orders";
import Rates from "./pages/Rates";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        {(user) => (
          <Routes>
            <Route element={<Shell user={user} />}>
              <Route index element={<Navigate to="/desk" replace />} />
              <Route path="/desk" element={<Desk />} />
              <Route path="/desk/:id" element={<Desk />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/rates" element={<Rates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/desk" replace />} />
            </Route>
          </Routes>
        )}
      </AuthGate>
    </BrowserRouter>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Shell from "./components/Shell";
import Landing from "./site/Landing";
import Desk from "./pages/Desk";
import Orders from "./pages/Orders";
import Rates from "./pages/Rates";
import Settings from "./pages/Settings";
import Today from "./pages/Today";

// "/" is the public site. Everything else is the maker's console, behind sign-in.
function Console() {
  return <AuthGate>{(user) => <Shell user={user} />}</AuthGate>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Console />}>
          <Route path="/today" element={<Today />} />
          <Route path="/desk" element={<Desk />} />
          <Route path="/desk/:id" element={<Desk />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/rates" element={<Rates />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

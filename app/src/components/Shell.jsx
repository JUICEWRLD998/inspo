import { NavLink, Outlet } from "react-router-dom";
import { studioApi, useAsync, StudioContext } from "../api/studio";
import { Badge } from "./ui";
import styles from "./Shell.module.css";

const NAV = [
  { to: "/desk", label: "Desk" },
  { to: "/orders", label: "Orders" },
  { to: "/rates", label: "Rates" },
  { to: "/settings", label: "Settings" },
];

export default function Shell({ user }) {
  const studio = useAsync(studioApi.loadStudio, []);
  const { maker, rateCard } = studio.data ?? {};
  const sample = maker?.data_origin === "sample" || rateCard?.data_origin === "sample";

  return (
    <StudioContext.Provider value={{ ...(studio.data ?? {}), user, reload: studio.reload }}>
      <div className={styles.frame}>
        <header className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.name}>{maker?.brand?.replace(/ \(sample data\)$/, "") ?? "Cake desk"}</span>
            {sample && <Badge tone="check">Sample data</Badge>}
          </div>
        </header>
        <nav className={styles.nav} aria-label="Studio">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className={styles.main}>
          {studio.error && <p role="alert" className={styles.alert}>Could not load the studio: {String(studio.error.message ?? studio.error)}</p>}
          {!studio.loading && !maker && !studio.error ? (
            <p role="alert" className={styles.alert}>No studio is set up yet: there is no maker record.</p>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </StudioContext.Provider>
  );
}

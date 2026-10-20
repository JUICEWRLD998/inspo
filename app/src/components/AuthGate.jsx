import { useEffect, useState } from "react";
import { studioApi } from "../api/studio";
import styles from "./AuthGate.module.css";

// The console is for the maker only. Quotes and customers are admin-only on the server; this gate is the UX.
export default function AuthGate({ children }) {
  const [state, setState] = useState({ status: "loading", user: null });

  useEffect(() => {
    let live = true;
    studioApi.me().then(
      (user) => live && setState({ status: user?.role === "admin" ? "ok" : "forbidden", user }),
      () => live && setState({ status: "anon", user: null }),
    );
    return () => {
      live = false;
    };
  }, []);

  if (state.status === "ok") return children(state.user);
  return (
    <main className={styles.wrap} aria-live="polite">
      {state.status === "loading" && <p className={styles.quiet}>Opening the studio…</p>}
      {state.status === "anon" && (
        <>
          <h1>Maker sign in</h1>
          <p className={styles.quiet}>This desk is for the baker. Sign in to see today's quotes.</p>
          <button className={styles.cta} onClick={studioApi.login}>Sign in</button>
        </>
      )}
      {state.status === "forbidden" && (
        <>
          <h1>This desk is private</h1>
          <p className={styles.quiet}>{state.user?.email} is signed in, but only the studio owner can open it.</p>
          <button className={styles.cta} onClick={studioApi.logout}>Sign out</button>
        </>
      )}
    </main>
  );
}

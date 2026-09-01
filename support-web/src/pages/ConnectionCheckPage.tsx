import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import BrandMark from "../components/BrandMark";
import StatusBanner from "../components/StatusBanner";
import { getApiBaseUrl, getHealth } from "../store/api/client";

type CheckState =
  | { status: "loading" }
  | { status: "ok"; body: string }
  | { status: "error"; message: string };

function healthFailure(err: unknown): CheckState {
  if (axios.isAxiosError(err) && err.response) {
    return {
      status: "error",
      message: `API ${err.response.status}: ${JSON.stringify(err.response.data)}`,
    };
  }
  const message =
    err instanceof Error
      ? err.message
      : "Request failed. Confirm the support server is on port 8002 and VITE_API_URL is set.";
  return { status: "error", message };
}

async function fetchHealth(): Promise<CheckState> {
  try {
    const body = (await getHealth()).trim();
    return { status: "ok", body: body || "ok" };
  } catch (err) {
    return healthFailure(err);
  }
}

export default function ConnectionCheckPage() {
  const { isAuthenticated } = useAuth();
  const [check, setCheck] = useState<CheckState>({ status: "loading" });

  async function runCheck() {
    setCheck({ status: "loading" });
    setCheck(await fetchHealth());
  }

  useEffect(() => {
    let cancelled = false;
    void fetchHealth().then((result) => {
      if (!cancelled) setCheck(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-sidebar-brand">
          <BrandMark />
        </div>
      </aside>
      <main className="shell-main">
        <p className="kicker">Diagnostics</p>
        <h1 className="page-title">API connection</h1>
        <p className="lede">Confirms the browser can reach the support server.</p>

        <section className="card">
          <dl className="meta">
            <div>
              <dt>API</dt>
              <dd>
                <code>{getApiBaseUrl()}</code>
              </dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>
                <code>{window.location.origin}</code>
              </dd>
            </div>
          </dl>

          {check.status === "loading" ? <p className="muted">Checking /health…</p> : null}

          <StatusBanner
            notice={
              check.status === "ok"
                ? { type: "ok", message: `Connected. Health ${check.body}` }
                : check.status === "error"
                  ? { type: "error", message: check.message }
                  : null
            }
          />

          <div className="card-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void runCheck()}
              disabled={check.status === "loading"}
            >
              Check again
            </button>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="btn btn-ghost">
              {isAuthenticated ? "Back to dashboard" : "Sign in"}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

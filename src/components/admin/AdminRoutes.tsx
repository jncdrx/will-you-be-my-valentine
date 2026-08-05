import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdmin } from "../../lib/auth";
import { isSupabaseConfigured } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * Protects /admin/* routes. Redirects to /admin/login if not an admin.
 */
export function AdminRoutes() {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ok" | "deny">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (active) setStatus("deny");
        return;
      }
      try {
        const admin = await isAdmin();
        if (active) setStatus(admin ? "ok" : "deny");
      } catch {
        if (active) setStatus("deny");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (status === "deny") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
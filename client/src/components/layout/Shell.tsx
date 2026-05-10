import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

const HIDE_NAV_PATHS = ["/practice"];

export default function Shell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-20 safe-bottom"}`}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

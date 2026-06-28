import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-club-black text-white">
      <Sidebar role={user.role} />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        role={user.role}
      />
      <div className="min-w-0 lg:pl-72">
        <Navbar
          onLogout={handleLogout}
          onMenu={() => setIsMobileNavOpen(true)}
          user={user}
        />
        <main className="mx-auto w-full max-w-7xl min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav role={user.role} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getDueReviews } from "../api/exercises";
import DueReviewsPopup from "./Duereviewspopup";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Re-evaluated on every route change, since localStorage changes don't
  // trigger a re-render on their own.
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  const [popupOpen, setPopupOpen] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    async function checkDue() {
      try {
        const data = await getDueReviews();
        if (!cancelled) {
          setDueCount(data.length);
          if (data.length > 0) setPopupOpen(true);
        }
      } catch (err) {
        console.log(err);
      }
    }
    checkDue();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-body-md text-base h-16 flex items-center transition-colors duration-200 ${
      isActive
        ? "text-primary font-bold border-b-2 border-tertiary-container"
        : "text-on-surface-variant hover:text-primary"
    }`;

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 h-16 bg-surface/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-8">
        <span className="font-display-lg text-2xl font-semibold text-primary tracking-tight">
          MathGen
        </span>
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/" className={linkClass}>
            Exercise Generator
          </NavLink>
          <NavLink to="/trends" className={linkClass}>
            Trend Analysis
          </NavLink>
          {isLoggedIn && (
            <NavLink to="/my-exercises" className={linkClass}>
              My Exercises
            </NavLink>
          )}
        </div>
      </div>

      <div className="hidden md:flex gap-6 items-center">
        {isLoggedIn && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPopupOpen((open) => !open)}
              aria-label="Due reviews"
              className="relative text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {dueCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {dueCount}
                </span>
              )}
            </button>
            {popupOpen && <DueReviewsPopup onClose={() => setPopupOpen(false)} />}
          </div>
        )}

        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="font-body-md text-base text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            Log Out
          </button>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>
              Log In
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
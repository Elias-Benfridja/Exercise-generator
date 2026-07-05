import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-body-md text-base h-16 flex items-center transition-colors duration-200 ${
      isActive
        ? "text-primary font-bold border-b-2 border-tertiary-container"
        : "text-on-surface-variant hover:text-primary"
    }`;

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
        </div>
      </div>
    </nav>
  );
}
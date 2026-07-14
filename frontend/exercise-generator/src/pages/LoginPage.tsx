import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError("Login failed. Please try again.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 pt-32 pb-24 px-4 max-w-md mx-auto">
      {/* Login Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-surface-container p-8 transition-all duration-300 hover:shadow-[0px_8px_30px_rgba(24,29,58,0.08)]">
        <div className="text-center mb-8">
          <h1 className="font-display-lg text-headline-lg text-primary mb-2">
            Welcome Back
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Continue your mathematical journey.
          </p>
        </div>

        {error && (
          <p className="text-error text-sm font-semibold text-center mb-6">
            {error}
          </p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant px-1" htmlFor="username">
              Username
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                person
              </span>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg py-4 pl-12 pr-4 text-on-surface font-body-md transition-all outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="font-label-md text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <a className="font-label-sm text-tertiary-container hover:underline" href="#">
                Forgot?
              </a>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                lock
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg py-4 pl-12 pr-4 text-on-surface font-body-md transition-all outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative bg-on-tertiary-container text-white rounded-lg font-label-md py-3 w-full flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-tertiary-container/20 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In
                <span className="material-symbols-outlined text-[20px]">login</span>
              </span>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-surface-container text-center space-y-3">
          <p className="font-label-md text-on-surface-variant">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-bold hover:underline ml-1">
              Register
            </Link>
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-label-sm text-on-surface-variant hover:text-primary underline underline-offset-4 decoration-outline-variant hover:decoration-primary transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </div>

      {/* Academic Quote Decoration */}
      <div className="mt-12 text-center max-w-xs mx-auto opacity-40">
        <p className="italic font-body-md text-on-surface-variant">
          "Pure mathematics is, in its way, the poetry of logical ideas."
        </p>
        <p className="font-label-sm mt-2">— Albert Einstein</p>
      </div>
    </main>
  );
}
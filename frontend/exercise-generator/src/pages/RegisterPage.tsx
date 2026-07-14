import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/login");
    } catch (err) {
      setError("Error creating user");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grow pt-32 pb-24 px-4 max-w-md mx-auto">
      {/* Registration Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-surface-container p-8">
        <div className="mb-8">
          <h1 className="font-display-lg text-display-lg text-primary mb-2">
            Create Account
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Join the community of precision in practice.
          </p>
        </div>

        {error && (
          <p className="text-error text-sm font-semibold text-center mb-6">
            {error}
          </p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="space-y-2 group">
            <label className="font-label-md text-on-surface-variant ml-1" htmlFor="username">
              Username
            </label>
            <div className="relative form-input-container">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                person
              </span>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="euler_1707"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg py-4 px-12 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-on-surface placeholder:text-outline-variant"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2 group">
            <label className="font-label-md text-on-surface-variant ml-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative form-input-container">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                mail
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="leonhard@academy.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg py-4 px-12 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-on-surface placeholder:text-outline-variant"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2 group">
            <label className="font-label-md text-on-surface-variant ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative form-input-container">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                lock
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg py-4 px-12 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-on-surface placeholder:text-outline-variant"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-on-tertiary-container text-white rounded-lg font-label-md py-3 w-full flex items-center justify-center gap-2 shadow-sm hover:brightness-110 active:scale-[0.98] transition-all mt-8 disabled:opacity-70"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Register Account
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center pt-6 border-t border-surface-container">
          <p className="font-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-label-md text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-outline-variant hover:decoration-primary"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative Academic Element */}
      <div className="mt-12 flex justify-center opacity-10">
        <div className="grid grid-cols-3 gap-8">
          <span className="material-symbols-outlined text-4xl">functions</span>
          <span className="material-symbols-outlined text-4xl">incognito</span>
          <span className="material-symbols-outlined text-4xl">architecture</span>
        </div>
      </div>
    </main>
  );
}
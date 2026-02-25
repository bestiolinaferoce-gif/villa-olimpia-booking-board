"use client";

import Image from "next/image";
import { useState } from "react";

const SESSION_KEY = "villa-olimpia:auth";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) === "1";
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function submit() {
    const password = process.env.NEXT_PUBLIC_APP_PASSWORD ?? "caccapanna73";
    if (value === password) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setValue("");
    }
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <Image src="/logo-villa-olimpia.png" alt="Villa Olimpia" width={72} height={72} className="auth-logo" />
        <div className="auth-titles">
          <h1>Villa Olimpia</h1>
          <p>Booking Board</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="auth-form"
        >
          <input
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            className="auth-input"
          />
          {error && <span className="field-error">Password non corretta</span>}
          <button type="submit" className="primary-btn auth-btn">
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}

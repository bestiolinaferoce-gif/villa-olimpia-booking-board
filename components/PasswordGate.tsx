"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AUTH_SESSION_KEY } from "@/lib/authSession";

export function PasswordGate({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  /** Es. messaggio contestuale per route dedicate (es. Preventivi). */
  subtitle?: string;
}) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_SESSION_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function submit() {
    const fromEnv = process.env.NEXT_PUBLIC_APP_PASSWORD;
    const password =
      typeof fromEnv === "string" && fromEnv.trim().length > 0
        ? fromEnv.trim()
        : "caccapanna73";
    if (value.trim() === password) {
      sessionStorage.setItem(AUTH_SESSION_KEY, "1");
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
          {subtitle ? (
            <p className="auth-subtitle">{subtitle}</p>
          ) : null}
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

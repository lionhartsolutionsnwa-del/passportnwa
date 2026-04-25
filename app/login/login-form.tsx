"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRef = (searchParams.get("ref") ?? "").replace(/^@/, "").slice(0, 30);
  const [mode, setMode] = useState<Mode>(initialRef ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState(initialRef);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (initialRef) setReferralCode(initialRef);
  }, [initialRef]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setMsg(error.message);
        return;
      }
      setStatus("ok");
      router.push("/");
      router.refresh();
      return;
    }

    // Sign up
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setStatus("error");
      setMsg("Username must be 3-30 letters, numbers, or underscores.");
      return;
    }

    if (!phone.trim()) {
      setStatus("error");
      setMsg("Phone number is required for account security.");
      return;
    }

    const cleanedRef = referralCode.trim().replace(/^@/, "");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username,
          phone: phone || null,
          email_marketing_consent: emailMarketing,
          sms_marketing_consent: smsMarketing,
          referred_by_username: cleanedRef || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMsg(error.message);
      return;
    }

    // If email confirmation is OFF, signUp returns a session and the user is logged in.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setStatus("ok");
      router.push("/welcome");
      router.refresh();
    } else {
      setStatus("ok");
      setMsg("Check your email to confirm your account, then sign in.");
      setMode("signin");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Passport NWA" className="size-20 mx-auto rounded-full" />
          <h1 className="font-serif text-3xl mt-5 text-[var(--pp-ink)]">Passport NWA</h1>
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-[var(--pp-ink-soft)] mt-1">
            Northwest Arkansas
          </div>
          <div className="fleuron mt-6">⌑</div>
        </div>

        <div className="flex gap-1 p-1 bg-white/60 border border-[var(--pp-cream-dark)] rounded-full mb-6">
          <ModeTab active={mode === "signin"} onClick={() => setMode("signin")}>Sign in</ModeTab>
          <ModeTab active={mode === "signup"} onClick={() => setMode("signup")}>Create account</ModeTab>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <div>
                <label className="eyebrow">Display name</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="eyebrow">Handle</label>
                <div className="mt-1 flex items-center input p-0">
                  <span className="px-3 font-mono text-[var(--pp-ink-soft)]">@</span>
                  <input
                    required
                    pattern="[a-zA-Z0-9_]{3,30}"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourhandle"
                    className="flex-1 py-3 pr-3 bg-transparent outline-none font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="eyebrow">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input mt-1"
            />
          </div>

          <div>
            <label className="eyebrow">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input mt-1"
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label className="eyebrow">Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(479) 555-0100"
                  className="input mt-1"
                />
                <p className="font-mono text-[10px] text-[var(--pp-ink-soft)] mt-1.5">
                  For account security and service messages. We won't text you marketing unless you opt in below.
                </p>
              </div>

              <div>
                <label className="eyebrow">Referral code (optional)</label>
                <div className="mt-1 flex items-center input p-0">
                  <span className="px-3 font-mono text-[var(--pp-ink-soft)]">@</span>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.replace(/^@/, ""))}
                    placeholder="friend's username"
                    className="flex-1 py-3 pr-3 bg-transparent outline-none font-mono"
                  />
                </div>
                {referralCode && (
                  <p className="font-serif italic text-[var(--pp-forest)] text-xs mt-1.5">
                    You and @{referralCode} will each earn +25 points when you join.
                  </p>
                )}
              </div>

              <div className="postcard p-3 flex flex-col gap-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailMarketing}
                    onChange={(e) => setEmailMarketing(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs font-serif text-[var(--pp-ink)]">
                    Email me about new restaurants, perks, and Passport NWA news. Unsubscribe anytime.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsMarketing}
                    onChange={(e) => setSmsMarketing(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs font-serif text-[var(--pp-ink)]">
                    Text me deals and perks (msg & data rates apply; reply STOP to quit). Completely optional.
                  </span>
                </label>
              </div>

              <p className="font-serif italic text-[10px] text-[var(--pp-ink-soft)]">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="text-[var(--pp-burgundy)] underline">Terms</Link> and{" "}
                <Link href="/privacy" className="text-[var(--pp-burgundy)] underline">Privacy Policy</Link>.
              </p>
            </>
          )}

          <button
            disabled={status === "loading"}
            className="btn-primary py-4 text-sm mt-2"
          >
            {status === "loading"
              ? "..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>

          {msg && (
            <p
              className={`font-serif italic text-sm text-center mt-2 ${
                status === "error" ? "text-red-700" : "text-[var(--pp-forest)]"
              }`}
            >
              {msg}
            </p>
          )}
        </form>

        <p className="text-center font-serif italic text-[var(--pp-ink-soft)] text-sm mt-8">
          "All who wander are not lost — most are just hungry."
        </p>

        <div className="text-center mt-8">
          <div className="eyebrow">For Restaurants</div>
          <Link
            href="/restaurant-signup"
            className="mt-3 inline-block btn-ghost"
          >
            Register your restaurant →
          </Link>
        </div>
      </div>
    </main>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase transition ${
        active ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)]" : "text-[var(--pp-ink-soft)]"
      }`}
    >
      {children}
    </button>
  );
}

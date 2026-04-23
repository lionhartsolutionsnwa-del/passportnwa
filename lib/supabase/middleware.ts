import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DEV-ONLY: auto-login as this email on localhost. Never fires in production.
const DEV_AUTO_LOGIN_EMAIL = "btrwrk.ai@gmail.com";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && process.env.NODE_ENV === "development" && DEV_AUTO_LOGIN_EMAIL) {
    try {
      const admin = createAdminClient();
      // Ensure dev user exists
      const { data: list } = await admin.auth.admin.listUsers();
      let devUser = list.users.find((u) => u.email === DEV_AUTO_LOGIN_EMAIL);
      if (!devUser) {
        const created = await admin.auth.admin.createUser({
          email: DEV_AUTO_LOGIN_EMAIL,
          email_confirm: true,
          user_metadata: { username: "passport_ceo", display_name: "Passport CEO" },
        });
        devUser = created.data.user ?? undefined;
      }

      // Generate a magic link, extract the OTP hash, exchange it for a session
      const link = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: DEV_AUTO_LOGIN_EMAIL,
      });
      const tokenHash = link.data.properties?.hashed_token;
      if (tokenHash) {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      }
    } catch (err) {
      console.error("[dev-auto-login] failed:", err);
    }
  }

  return response;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
  timeoutMs = 3000
) {
  return Promise.race([
    supabase.auth.getUser(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase getUser timeout")), timeoutMs)
    ),
  ]);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const result = await getUserWithTimeout(supabase);
    user = (result as any).data?.user ?? null;
  } catch {
    // Si falla o tarda, permitir acceso al login sin sesión
    user = null;
  }

  // Proteger rutas de admin
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login") &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Si está en login y ya tiene sesión, redirigir al admin
  if (
    request.nextUrl.pathname === "/admin/login" &&
    user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

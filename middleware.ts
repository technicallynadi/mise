import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Runs on every request. It (1) keeps the Supabase auth session fresh and
// (2) gates the API: reads (GET) stay public so anyone can browse recipes, but
// anything that writes data or spends money (create / update / delete /
// generate) requires a signed-in user. This is enforced on the server, so it
// can't be bypassed from the client.
export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (isApi && isMutation && !user) {
    return NextResponse.json(
      { error: "Unauthorized — sign in to continue." },
      { status: 401 }
    );
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

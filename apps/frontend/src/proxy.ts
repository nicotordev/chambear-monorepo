import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type MiddlewareConfig } from "next/server";
import { getCookie } from "cookies-next/server";
import backend from "./lib/backend";

// 1. Define Route Groups
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);
// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);
// Routes strictly for authentication (login/signup)
const isAuthRoute = createRouteMatcher([
  "/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isRoot = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  console.info(`[Middleware] Processing ${req.method} ${path}`);

  // 1. Skip API routes and static assets early
  if (isApiRoute(req) || isRoot(req)) {
    return NextResponse.next();
  }

  // 2. Handle Unauthenticated Users trying to access Protected Routes
  if (!userId && isProtectedRoute(req)) {
    console.info(
      `[Middleware] Unauthorized access to ${path}. Redirecting to sign-in.`
    );
    await auth.protect();
  }

  // 3. If user is NOT logged in and not on a protected route (e.g. landing page), allow.
  if (!userId) {
    return NextResponse.next();
  }

  // --- Authenticated Logic Below ---

  // 4. Fetch User Data to check Onboarding Status
  // Note: Fetching data in Middleware can add latency. Ensure api.getUser is fast.
  const _auth = await auth();
  const token = await _auth.getToken();
  const user = await backend.user.getMe(token || undefined).catch((err) => {
    console.error("[Middleware] Failed to fetch user:", err);
    return null;
  });

  // Simplified logic to check if onboarding is complete
  // Adjust this based on your exact DB structure
  const profiles = user?.profiles;
  const profilesLength = Number(profiles?.length);
  const currentProfileId = await getCookie("chambear_current_profile_id", {
    req,
  });
  const currentProfile =
    profilesLength > 0
      ? profiles?.find((profile) => profile.id === currentProfileId)
      : profilesLength > 0
      ? profiles?.[0]
      : null;
  const isOnboarded = !!currentProfile?.onboardingCompleted;

  console.info(
    `[Middleware] User: ${userId} | Onboarded: ${isOnboarded} | Path: ${path}`
  );

  // 5. Redirect Logic Matrix

  // CASE A: User is logged in but trying to access Auth pages (Sign In/Up)
  if (isAuthRoute(req)) {
    const target = isOnboarded ? "/dashboard" : "/onboarding";
    console.info(
      `[Middleware] Auth route accessed by logged in user. Redirecting to ${target}`
    );
    return NextResponse.redirect(new URL(target, req.url));
  }

  // CASE B: User is Onboarded
  if (isOnboarded) {
    // If they try to go to onboarding again, kick them to dashboard
    if (path.startsWith("/onboarding")) {
      console.info(`[Middleware] Already onboarded. Redirecting to dashboard.`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Allow access to dashboard or other protected routes
    return NextResponse.next();
  }

  // CASE C: User is NOT Onboarded
  if (!isOnboarded) {
    // If they are NOT on the onboarding page, force them there
    if (!path.startsWith("/onboarding")) {
      console.info(
        `[Middleware] Onboarding incomplete. Redirecting to /onboarding.`
      );
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    // If they are already on /onboarding, allow access
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config: MiddlewareConfig = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

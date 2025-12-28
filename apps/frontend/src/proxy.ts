import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  console.info(`[Middleware] Processing ${req.method} ${req.nextUrl.pathname}`);

  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    console.info(`[Middleware] Route is protected: ${req.nextUrl.pathname}`);
    await auth.protect();
  }

  const _auth = await auth();
  const _clerkClient = await clerkClient();

  if (!_auth.userId) {
    return NextResponse.next();
  }

  const { privateMetadata } = await _clerkClient.users.getUser(_auth.userId);
  const isOnBoarded = privateMetadata?.onboardingCompleted;

  console.info(
    `[Middleware] User: ${_auth.userId}, Onboarding completed: ${!!isOnBoarded}`
  );

  const dashboardURL = req.nextUrl.clone();
  dashboardURL.pathname = "/dashboard";

  if (isOnBoarded) {
    if (isOnboardingRoute(req)) {
      if (req.nextUrl.href === dashboardURL.href) return NextResponse.next();
      console.info(`[Middleware] Redirecting to dashboard`);
      return NextResponse.redirect(dashboardURL);
    } else {
      return NextResponse.next();
    }
  }

  const onboardingURL = req.nextUrl.clone();
  onboardingURL.pathname = "/onboarding";

  if (req.nextUrl.href === onboardingURL.href) return NextResponse.next();
  console.info(`[Middleware] Redirecting to onboarding`);
  return NextResponse.redirect(onboardingURL);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

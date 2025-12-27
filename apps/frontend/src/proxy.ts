import { clerkClient, clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req)) return NextResponse.next();
  if (isProtectedRoute(req)) await auth.protect();
  const _auth = await auth();
  const _clerkClient = await clerkClient();

  if (!_auth.userId) {
    return NextResponse.next();
  }

  const { privateMetadata } = await _clerkClient.users.getUser(_auth.userId);
  const isOnBoarded = privateMetadata?.onboardingCompleted;

  const dashboardURL = req.nextUrl.clone();
  dashboardURL.pathname = "/dashboard";

  if (isOnBoarded) {
    if (req.nextUrl.href === dashboardURL.href) return NextResponse.next();
    return NextResponse.redirect(dashboardURL);
  }

  const onboardingURL = req.nextUrl.clone();
  onboardingURL.pathname = "/onboarding";

  if (req.nextUrl.href === onboardingURL.href) return NextResponse.next();
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

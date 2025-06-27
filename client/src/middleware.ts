export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!login|register|_next|favicon.ico|api\/auth\/.*).*)"
  ]
}; 
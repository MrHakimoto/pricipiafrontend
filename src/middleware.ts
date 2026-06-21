// src/middleware.ts
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const publicRoutes = [
    "/login",
    "/terms",
    "/privacy",
    "/contact",
    "/definir-senha",
    "/magic-login",
  ];

  const isPublicPage = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Usuário não logado tentando acessar página protegida → vai pro login
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário logado tentando entrar no /login → manda pra home
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    const homeUrl = new URL("/home", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
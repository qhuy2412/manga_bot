import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("admin_token")?.value;
    const { pathname } = request.nextUrl;

    // Bảo vệ các route bắt đầu bằng /dashboard
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Nếu đã đăng nhập, chuyển hướng từ /login hoặc / sang /dashboard
    if (pathname === "/login" || pathname === "/") {
        if (token) {
            const dashboardUrl = new URL("/dashboard", request.url);
            return NextResponse.redirect(dashboardUrl);
        }
        
        // Nếu vào trang chủ / mà chưa đăng nhập, chuyển hướng sang /login
        if (pathname === "/") {
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/"]
};

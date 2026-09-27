import { SSR_API_URL as BACKEND } from "$lib/config";

export const fallback = async ({ request, params, cookies }) => {
    const path = params.path;
    const url = `${BACKEND}/api/${path}`;

    const headers = new Headers(request.headers);
    const token = cookies.get("token");
    if (token) headers.set("Cookie", `token=${token}`);

    const res = await fetch(url, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
    });

    const responseHeaders = new Headers(res.headers);
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
        const tokenMatch = setCookie.match(/token=([^;]+)/);
        if (tokenMatch) {
            cookies.set("token", tokenMatch[1], {
                httpOnly: true,
                sameSite: "strict",
                path: "/",
                maxAge: 60 * 60,
            });
        }
        responseHeaders.delete("set-cookie");
    }

    return new Response(res.body, {
        status: res.status,
        headers: responseHeaders,
    });
};

import { redirect } from "@sveltejs/kit";

export function GET() {
    redirect(307, "/keyboard/index.html");
}

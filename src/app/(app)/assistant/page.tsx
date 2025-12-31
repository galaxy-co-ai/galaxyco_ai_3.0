import { redirect } from "next/navigation";

/**
 * /assistant page - Redirects to /dashboard
 *
 * The Neptune AI assistant is now integrated into the dashboard as a side panel.
 * This redirect ensures any old links or bookmarks still work.
 */
export default function AssistantPage() {
  redirect("/dashboard");
}

import type { Metadata } from "next";
import StaffLogin from "@/components/staff/StaffLogin";
import { staffSession } from "@/lib/requireStaff";

export const metadata: Metadata = { title: "Staff sign in" };
export const dynamic = "force-dynamic";

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; need?: string }> }) {
  const params = await searchParams;
  // Only ever redirect to our own paths — never an absolute URL (open redirect).
  const raw = params.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
  const session = await staffSession();
  return (
    <div className="whitewash flex min-h-[100svh] items-center justify-center px-4 py-14">
      <StaffLogin next={next} needAdmin={params.need === "admin"} signedInAs={session?.role ?? null} />
    </div>
  );
}

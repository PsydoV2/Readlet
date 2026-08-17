import type { ReactNode } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:py-20">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

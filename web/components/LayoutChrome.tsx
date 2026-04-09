"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LayoutChrome({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/";
  // Standalone homepage: no header/footer
  if (pathname === "/") {
    return <>{children}</>;
  }
  const isFullBleedPage = pathname.startsWith("/exchange");
  // Default: show header/footer
  return (
    <>
      <Header />
      <main className={isFullBleedPage ? "" : "inner-page-shell"}>{children}</main>
      <Footer />
    </>
  );
}

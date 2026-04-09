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
  // Default: show header/footer
  return (
    <div className="inner-app">
      <Header />
      <main className="inner-page-shell">{children}</main>
      <Footer />
    </div>
  );
}

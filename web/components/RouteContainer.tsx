"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

export default function RouteContainer({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/";
  // Full-bleed for Exchange route
  return <>{children}</>;
  if (pathname.startsWith("/exchange")) {
    return <>{children}</>;
  }
  // Default: center content using Bootstrap container
  return <div className="container">{children}</div>;
}

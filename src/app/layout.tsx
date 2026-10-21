import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = { title: "RiceLeafXNet — AI Rice Leaf Disease Detection & Remedies", description: "Deep learning based rice leaf disease classification with instant remedies, severity analysis and field history." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className="text-slate-900 antialiased">{children}</body></html>;
}

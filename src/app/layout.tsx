import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "GCSE Science Revision | AQA Biology, Chemistry, Physics", template: "%s | GCSE Science Revision" },
  description:
    "Free AQA GCSE Science revision: notes, diagrams, flashcards, exam-style questions and required practicals for Biology, Chemistry, Physics and Combined Science Trilogy.",
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{children}</main>
        <footer className="no-print border-t border-line py-8 text-center text-sm text-muted">
          <p>Written for the AQA GCSE specifications 8461, 8462, 8463 and 8464. Not affiliated with or endorsed by AQA.</p>
        </footer>
      </body>
    </html>
  );
}

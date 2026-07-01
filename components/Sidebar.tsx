"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/", label: "New recipe" },
    { href: "/recipes", label: "Recipes" },
    { href: "/cookbooks", label: "Cookbooks" },
  ];

  return (
    <aside className="w-64 bg-butcher-paper border-r border-outline-gray flex flex-col">
      <div className="p-6 flex-1">
        <h1 className="font-spectral text-logo text-text-charcoal mb-8">
          mise
        </h1>

        <nav className="space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block mise-sidebar-link ${
                pathname === link.href ? "text-text-charcoal font-medium" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-outline-gray text-sm">
        {user ? (
          <>
            <div className="text-text-charcoal/50 truncate mb-2">
              {user.email}
            </div>
            <button onClick={signOut} className="mise-sidebar-link">
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="mise-sidebar-link">
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

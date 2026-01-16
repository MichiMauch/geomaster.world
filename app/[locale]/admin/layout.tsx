"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Globe,
  Image,
  Users,
  UsersRound,
  Gamepad2,
  ScrollText,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Inhalte",
    icon: <MapPin className="w-5 h-5" />,
    children: [
      { label: "Länder", href: "/admin/content/countries" },
      { label: "Welt-Quizze", href: "/admin/content/world" },
      { label: "Bild-Maps", href: "/admin/content/images" },
    ],
  },
  {
    label: "Benutzer",
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: "User", href: "/admin/users" },
      { label: "Gruppen", href: "/admin/users/groups" },
    ],
  },
  {
    label: "Analytics",
    icon: <Gamepad2 className="w-5 h-5" />,
    children: [
      { label: "Spiele", href: "/admin/analytics/games" },
      { label: "Logs", href: "/admin/analytics/logs" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const [expandedSections, setExpandedSections] = useState<string[]>(["Inhalte", "Benutzer", "Analytics"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = session?.user?.isSuperAdmin ?? false;

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isSuperAdmin) {
      router.push(`/${locale}`);
    }
  }, [session, status, isSuperAdmin, router, locale]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    const fullHref = `/${locale}${href}`;
    if (href === "/admin") {
      return pathname === fullHref;
    }
    return pathname?.startsWith(fullHref);
  };

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <div key={item.label}>
          {item.href ? (
            <Link
              href={`/${locale}${item.href}`}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive(item.href)
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ) : (
            <>
              <button
                onClick={() => toggleSection(item.label)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {expandedSections.includes(item.label) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expandedSections.includes(item.label) && item.children && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={`/${locale}${child.href}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "block px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive(child.href)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-1 border-b border-glass-border px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-text-primary">Admin</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-text-secondary hover:text-text-primary"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-surface-1 border-r border-glass-border transform transition-transform duration-200",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-glass-border">
          <h2 className="text-lg font-semibold text-text-primary">Admin</h2>
        </div>
        <div className="p-4">
          <NavContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-surface-1 border-r border-glass-border">
        <div className="p-4 border-b border-glass-border">
          <h2 className="text-lg font-semibold text-text-primary">Admin</h2>
          <p className="text-sm text-text-secondary">GeoMaster World</p>
        </div>
        <div className="p-4">
          <NavContent />
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

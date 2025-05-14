import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import HeaderButtons from "./HeaderButtons";

interface HeaderProps {
  navItems: Array<{
    path: string;
    label: string;
    icon: React.ReactNode;
  }>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  scrolled: boolean;
}

const Header: React.FC<HeaderProps> = ({
  navItems,
  mobileMenuOpen,
  setMobileMenuOpen,
  scrolled
}) => {
  const location = useLocation();

  // Check if path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-[var(--background)]/95 backdrop-blur-md shadow-md"
        : "bg-[var(--background)]"
    }`}>
      {/* Top notification bar */}
      <div className="bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/10 py-1.5 px-4 text-center text-xs md:text-sm">
        <span className="font-medium text-[var(--primary)]">New!</span> Check out our latest predictions with <span className="font-medium text-[var(--primary)]">copiable game codes</span>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 z-20">
            <div className="relative">
              <span className="text-2xl font-extrabold premium-text">BetSightly</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#F5A623] to-transparent"></div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  isActive(item.path)
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center z-20">
            {/* Theme toggle buttons */}
            <HeaderButtons className="hidden md:flex mr-2" />

            {/* Mobile menu button */}
            <button
              className="p-2 rounded-lg md:hidden hover:bg-[var(--secondary)] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 bg-[var(--background)]/95 backdrop-blur-md z-10 transition-all duration-300 md:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 pt-20 pb-6">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center ${
                  isActive(item.path)
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border-l-4 border-[var(--primary)] pl-3"
                    : "text-[var(--foreground)] hover:bg-[var(--secondary)]/50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="pt-4 mt-4 border-t border-[var(--border)]">
              <div className="mb-4">
                <HeaderButtons className="flex justify-center" />
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

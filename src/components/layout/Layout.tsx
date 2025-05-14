import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Target, BarChart2, RefreshCw, Award, PieChart, Settings, Calendar } from "lucide-react";
import { useBreakpoints } from "../../hooks/useMediaQuery";
import OfflineIndicator from "../common/OfflineIndicator";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isMobile } = useBreakpoints();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Navigation items with Lucide icons
  const navItems = [
    { path: "/", label: "Home", icon: <Home size={isMobile ? 20 : 16} /> },
    { path: "/predictions", label: "Predictions", icon: <Target size={isMobile ? 20 : 16} /> },
    { path: "/fixtures", label: "Fixtures", icon: <Calendar size={isMobile ? 20 : 16} /> },
    { path: "/results", label: "Results", icon: <BarChart2 size={isMobile ? 20 : 16} /> },
    { path: "/rollover", label: "Rollover", icon: <RefreshCw size={isMobile ? 20 : 16} /> },
    { path: "/punters", label: "Punters", icon: <Award size={isMobile ? 20 : 16} /> },
    { path: "/analytics", label: "Analytics", icon: <PieChart size={isMobile ? 20 : 16} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={isMobile ? 20 : 16} /> }
  ];

  // We'll implement real notifications later

  // Check if path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Offline status indicator */}
      <OfflineIndicator />

      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/95 backdrop-blur-xl shadow-lg"
          : "bg-black"
      }`}>
        {/* Main header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex-1">
              <Link to="/" className="flex items-center space-x-2 z-20 group w-fit">
                <div className="relative">
                  <span className="text-2xl font-sans font-bold premium-text group-hover:scale-105 transition-transform duration-300">BetSightly</span>
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 flex items-center ${
                    isActive(item.path)
                      ? "text-amber-400 border-b-2 border-amber-500"
                      : "text-gray-400 hover:text-amber-400 border-b-2 border-transparent hover:border-amber-500/30"
                  }`}
                >
                  <span className={`mr-2 ${isActive(item.path) ? "text-amber-400" : "text-gray-500"}`}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center z-20 flex-1 justify-end">
              {/* Mobile menu button */}
              <button
                className="p-2.5 rounded-lg md:hidden hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={24} className="text-amber-400" /> : <Menu size={24} className="text-amber-400" />}
              </button>

              {/* Empty space for visual balance on desktop */}
              <div className="hidden md:block w-[100px]"></div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`fixed inset-0 bg-black/98 backdrop-blur-xl z-10 transition-all duration-300 md:hidden ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="container mx-auto px-4 pt-20 pb-6">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-3 text-base font-medium transition-all duration-200 flex items-center ${
                    isActive(item.path)
                      ? "text-amber-400 border-l-2 border-amber-500 pl-3"
                      : "text-gray-400 hover:text-amber-400 border-l-2 border-transparent hover:border-amber-500/30 hover:pl-3"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={`mr-3 ${isActive(item.path) ? "text-amber-400" : "text-gray-500"}`}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}


            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className={`transition-all duration-300 ${isMobile ? 'space-y-4' : 'space-y-8'}`}>
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--background)] py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-xl font-extrabold premium-text">BetSightly</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Sports betting predictions for soccer, basketball, and mixed games.
                Track performance and make informed decisions with our expert analysis.
              </p>
              <div className="mt-4 flex space-x-3">
                <a href="#" className="p-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-full transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="p-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-full transition-colors dark:bg-[#1A1A27] dark:hover:bg-[#2A2A3C]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="p-2 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-full transition-colors dark:bg-[#1A1A27] dark:hover:bg-[#2A2A3C]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-4 text-[var(--primary)]">Quick Links</h3>
              <ul className="space-y-2 text-sm grid grid-cols-2">
                {navItems.map((item) => (
                  <li key={item.path} className="col-span-1">
                    <Link
                      to={item.path}
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center"
                    >
                      <span className="mr-2 text-[var(--primary)]">›</span>
                      {item.label}
                    </Link>
                  </li>
                ))}

                <li className="col-span-1">
                  <a href="#" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center">
                    <span className="mr-2 text-[var(--primary)]">›</span>
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-4 text-[var(--primary)]">Disclaimer</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                BetSightly provides predictions for informational purposes only.
                We do not encourage gambling, and all users should bet responsibly
                and in accordance with local laws.
              </p>
              <div className="mt-4 p-3 bg-[var(--secondary)] rounded-lg border border-[var(--border)] light-card-effect">
                <h4 className="text-xs font-semibold mb-1 text-[var(--primary)]">Responsible Gambling</h4>
                <p className="text-xs text-[var(--muted-foreground)]">
                  If you or someone you know has a gambling problem, please call the National Problem Gambling Helpline at 1-800-522-4700.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              &copy; {new Date().getFullYear()} BetSightly. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Terms
              </a>
              <a href="#" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Privacy
              </a>
              <a href="#" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;


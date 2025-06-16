import { Link, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-gray-900 dark:text-cyan-400 font-bold text-2xl">PDFolio</span>
          </Link>

          {/* Navigation Links & Theme Toggle */}
          <div className="flex items-center space-x-6">
            {/*}
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                className={`text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-cyan-400 transition ${
                  location.pathname === link.path ? "border-b-2 border-blue-500 dark:border-cyan-400 pb-1" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
            */}
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="ml-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

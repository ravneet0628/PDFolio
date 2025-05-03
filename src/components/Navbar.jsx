import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-white font-bold text-2xl">PDFolio</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-6">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                className={`text-gray-300 hover:text-white transition ${
                  location.pathname === link.path ? "border-b-2 border-blue-500 pb-1" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 py-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p>
          © {new Date().getFullYear()} <span className="font-semibold text-cyan-500 dark:text-cyan-400">PDFolio</span>. All rights reserved.
        </p>
        <div className="mt-2 flex justify-center space-x-4">
          <a href="https://github.com/ravneet0628" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-cyan-400 underline underline-offset-2">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

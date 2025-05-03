function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p>© {new Date().getFullYear()} DocFusion. All rights reserved.</p>
        <div className="mt-2 flex justify-center space-x-4">
          <a href="https://yourwebsite.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Website</a>
          <a href="mailto:support@docfusion.com" className="hover:text-white">Support</a>
          <a href="https://github.com/yourgithub" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

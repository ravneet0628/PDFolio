import { useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const toolCategories = [
    {
      category: "File Management",
      tools: [
        { name: "Merge PDFs", link: "/merge", comingSoon: false },
        { name: "Split PDFs", link: "/split", comingSoon: false },
        { name: "Reorder Pages", link: "/reorder", comingSoon: false },
        { name: "Extract Pages", link: "/extract", comingSoon: false },
        { name: "Rotate Pages", link: "/rotate", comingSoon: false },
        { name: "Delete Pages", link: "/delete", comingSoon: false },
        { name: "Duplicate Pages", link: "/duplicate", comingSoon: false },
      ],
    },
    {
      category: "Tools",
      tools: [
        { name: "Compress PDF", link: "/compress", comingSoon: false },
        { name: "Password Protect PDF", link: "/password-protect", comingSoon: true },
        { name: "Add Page Numbers", link: "/add-page-numbers", comingSoon: true },
        { name: "Add Watermark", link: "/add-watermark", comingSoon: true },
      ],
    },
    {
      category: "Conversion",
      tools: [
        { name: "PDF to JPG", link: "/pdf-to-jpg", comingSoon: false },
        { name: "JPG to PDF", link: "/jpg-to-pdf", comingSoon: false },
        { name: "Word to PDF", link: "/word-to-pdf", comingSoon: true },
        { name: "Excel to PDF", link: "/excel-to-pdf", comingSoon: true },
        { name: "PPT to PDF", link: "/ppt-to-pdf", comingSoon: true },
      ],
    },

  ];

  const bgColors = [
    'bg-blue-600',
    'bg-green-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-yellow-500',
    'bg-indigo-600',
    'bg-red-600',
  ];

  const filteredCategories = toolCategories.map(category => ({
    ...category,
    tools: category.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  return (
    <div className="p-6 md:p-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to PDFolio 📄✨</h1>
        <p className="text-gray-400 max-w-xl mx-auto">Your one-stop solution to manage, edit, and transform PDFs easily and securely!</p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-10">
        <input
          type="text"
          placeholder="Search for a tool..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-3 w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500">
          No tools found matching "<span className="italic">{searchQuery}</span>"
        </div>
      ) : (
        filteredCategories.map((category, idx) => (
          <div key={idx} className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">{category.category}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {category.tools.map((tool, toolIdx) => (
                <div
                  key={toolIdx}
                  className={`p-6 rounded-lg shadow-md transition-transform transform hover:scale-105 ${bgColors[(toolIdx + idx) % bgColors.length]} relative`}
                >
                  <Link to={tool.link}>
                    <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                    <p className="text-sm text-gray-100">Start now →</p>
                  </Link>

                  {/* Coming Soon Badge */}
                  {tool.comingSoon && (
                    <div className="absolute top-2 right-2 bg-black text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
                      Coming Soon
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Home;

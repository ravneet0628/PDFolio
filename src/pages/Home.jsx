import { ArrowRightIcon, DocumentDuplicateIcon, ScissorsIcon, ArrowsRightLeftIcon, ArrowPathIcon, ArrowDownTrayIcon, TrashIcon, Squares2X2Icon, LockClosedIcon, PencilSquareIcon, PhotoIcon, HashtagIcon, EyeDropperIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const actions = [
	{
		title: 'Merge PDFs',
		description: 'Combine multiple PDF files into one.',
		href: '/merge',
		icon: DocumentDuplicateIcon,
		iconColor: 'text-blue-600',
		iconBg: 'bg-blue-50',
		comingSoon: false,
	},
	{
		title: 'Split PDFs',
		description: 'Split a PDF into multiple smaller files.',
		href: '/split',
		icon: ScissorsIcon,
		iconColor: 'text-green-600',
		iconBg: 'bg-green-50',
		comingSoon: false,
	},
	{
		title: 'Reorder Pages',
		description: 'Drag and drop to rearrange PDF pages.',
		href: '/reorder',
		icon: ArrowsRightLeftIcon,
		iconColor: 'text-purple-600',
		iconBg: 'bg-purple-50',
		comingSoon: false,
	},
	{
		title: 'Extract Pages',
		description: 'Extract specific pages from a PDF.',
		href: '/extract',
		icon: ArrowDownTrayIcon,
		iconColor: 'text-pink-600',
		iconBg: 'bg-pink-50',
		comingSoon: false,
	},
	{
		title: 'Rotate Pages',
		description: 'Rotate one or more pages in your PDF.',
		href: '/rotate',
		icon: ArrowPathIcon,
		iconColor: 'text-yellow-600',
		iconBg: 'bg-yellow-50',
		comingSoon: false,
	},
	{
		title: 'Delete Pages',
		description: 'Remove unwanted pages from your PDF.',
		href: '/delete',
		icon: TrashIcon,
		iconColor: 'text-red-600',
		iconBg: 'bg-red-50',
		comingSoon: false,
	},
	{
		title: 'Duplicate Pages',
		description: 'Copy and insert pages within your PDF.',
		href: '/duplicate',
		icon: DocumentDuplicateIcon,
		iconColor: 'text-cyan-600',
		iconBg: 'bg-cyan-50',
		comingSoon: false,
	},
	{
		title: 'Compress PDF',
		description: 'Reduce the file size of your PDF.',
		href: '/compress',
		icon: Squares2X2Icon,
		iconColor: 'text-indigo-600',
		iconBg: 'bg-indigo-50',
		comingSoon: false,
	},
	{
		title: 'Add Page Numbers',
		description: 'Insert page numbers with custom style.',
		href: '/page-numbering',
		icon: HashtagIcon,
		iconColor: 'text-sky-600',
		iconBg: 'bg-sky-50',
		comingSoon: false,
	},
	{
		title: 'PDF to JPG',
		description: 'Convert PDF pages to high-quality images.',
		href: '/pdf-to-jpg',
		icon: PhotoIcon,
		iconColor: 'text-orange-600',
		iconBg: 'bg-orange-50',
		comingSoon: false,
	},
	{
		title: 'JPG to PDF',
		description: 'Combine images into a single PDF.',
		href: '/jpg-to-pdf',
		icon: PhotoIcon,
		iconColor: 'text-fuchsia-600',
		iconBg: 'bg-fuchsia-50',
		comingSoon: false,
	},
	// Add more as needed
];

const categories = [
	{
		name: 'File Management',
		actions: [
			actions[0], // Merge PDFs
			actions[1], // Split PDFs
			actions[2], // Reorder Pages
			actions[3], // Extract Pages
			actions[4], // Rotate Pages
			actions[5], // Delete Pages
			actions[6], // Duplicate Pages
		],
	},
	{
		name: 'Tools',
		actions: [
			actions[7], // Compress PDF
			actions[8], // Add Page Numbers
		],
	},
	{
		name: 'Conversion',
		actions: [
			actions[9], // PDF to JPG
			actions[10], // JPG to PDF
		],
	},
];

function Card({ className, children }) {
	return (
		<div className={
			`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col gap-4 p-6 relative transition hover:shadow-md h-full ${className}`
		}>
			{children}
		</div>
	);
}

function Home() {
	const [searchQuery, setSearchQuery] = useState('');

	// Filter actions by search
	const filteredCategories = categories
		.map((category) => ({
			...category,
			actions: category.actions.filter((action) => action.title.toLowerCase().includes(searchQuery.toLowerCase())),
		}))
		.filter((category) => category.actions.length > 0);

	return (
		<div className="p-6 md:p-12 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
			<div className="text-center mb-10">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
					Welcome to PDFolio <span role="img" aria-label="PDF">📄</span>
				</h1>
				<p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
					Your one-stop solution to manage, edit, and transform PDFs easily and securely!
				</p>
			</div>

			{/* Search Bar */}
			<div className="flex justify-center mb-10">
				<input
					type="text"
					placeholder="Search for a tool..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="p-3 w-full max-w-md rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{filteredCategories.length === 0 ? (
				<div className="text-center text-gray-500 dark:text-gray-400">
					No tools found matching "<span className="italic">{searchQuery}</span>"
				</div>
			) : (
				filteredCategories.map((category, idx) => (
					<div key={category.name} className="mb-12">
						<h2 className="text-xl font-semibold mb-4 pl-2 text-gray-900 dark:text-gray-100">{category.name}</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{category.actions.map((action) => (
								<Card key={action.title}>
									<div className="flex items-center gap-4 h-full">
										<span className={`rounded-lg p-3 ${action.iconBg} ${action.iconColor} ring-2 ring-inset ring-gray-100 dark:ring-gray-800`}>
											<action.icon className="h-6 w-6" aria-hidden="true" />
										</span>
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
												<Link to={action.href} className="focus:outline-none">
													<span className="absolute inset-0" aria-hidden="true" />
													{action.title}
												</Link>
											</h3>
											<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
										</div>
										<ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition" />
									</div>
									{action.comingSoon && (
										<span className="absolute top-4 right-4 bg-black dark:bg-gray-800 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
											Coming Soon
										</span>
									)}
								</Card>
							))}
						</div>
					</div>
				))
			)}
		</div>
	);
}

export default Home;

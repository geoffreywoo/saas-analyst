import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">SaaS Analyst</h1>
      </div>
      
      <nav className="space-y-2">
        <Link 
          href="/" 
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          Dashboard
        </Link>
        <Link 
          href="/customers" 
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          Customers
        </Link>
        <Link 
          href="/chat" 
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
        </Link>
      </nav>
    </div>
  );
} 
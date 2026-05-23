import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 border-t-4 border-emerald-500">
      <div className="bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-700">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">404 - Not Found</h2>
        <p className="text-slate-400 mb-8">The page you are looking for does not exist.</p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

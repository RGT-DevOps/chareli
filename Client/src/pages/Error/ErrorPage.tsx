import { Link } from 'react-router-dom';

const ErrorPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Oops!</h1>
        <p className="text-gray-700 mb-4">Sorry, an unexpected error has occurred.</p>
        <p className="text-gray-500 mb-6">The page you're looking for might not exist or has been moved.</p>
        <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Go back to Home
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;

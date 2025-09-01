import React from 'react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  // You could add a logging service here, like Sentry, Datadog, etc.
  // For now, we'll just log to the console.
  console.error("Caught by Error Boundary:", error);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Oups ! Quelque chose s'est mal passé.</h1>
        <p className="text-lg mb-8">Nous sommes désolés pour la gêne occasionnée. Veuillez réessayer.</p>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          Réessayer
        </button>
        {/* In a development environment, you might want to display the error message */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-4 bg-gray-200 rounded-lg text-left">
            <h3 className="font-bold">Détails de l'erreur (Mode Dev) :</h3>
            <pre className="text-sm whitespace-pre-wrap">{error.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
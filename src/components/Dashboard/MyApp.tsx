import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function MyApp() {
  const appUrl = 'https://liastock.netlify.app';

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-8">Mon Application</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <QRCodeSVG value={appUrl} size={256} />
      </div>
      <p className="mt-8 text-lg text-gray-600">
        Scannez ce code QR pour accéder à l'application
      </p>
    </div>
  );
}

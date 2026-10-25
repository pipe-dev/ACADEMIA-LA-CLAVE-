import type {Metadata, Viewport} from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'AfinApp',
  description: 'A voice tuner for the 12 musical notes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-[#f8f9ff] dark:bg-[#071322]" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#071322" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f8f9ff" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://is1-ssl.mzstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://googlevideo.com" />
        <script src="https://www.youtube.com/iframe_api" async></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Quicksand:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#f8f9ff] dark:bg-[#071322] text-[#0b1c30] dark:text-[#d3e4fe]" suppressHydrationWarning>
          <div className="flex flex-col min-h-screen bg-[#f8f9ff] dark:bg-[#071322]">
            <main className="flex-1 overflow-x-hidden relative">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
          {/* Toasts globales (errores de micrófono, permisos, etc.) — fuera
              del ErrorBoundary para que sobrevivan a un crash de la vista */}
          <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('trycloudflare.com') || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.port === '9005';
                if (isDev) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (let name of names) caches.delete(name);
                    });
                  }
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

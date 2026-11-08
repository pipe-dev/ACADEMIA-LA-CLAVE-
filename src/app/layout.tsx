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
        <link rel="icon" type="image/png" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
              // ZERO CACHE ENFORCEMENT: Unregister all service workers and wipe CacheStorage
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var i = 0; i < registrations.length; i++) {
                      registrations[i].unregister();
                    }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var j = 0; j < names.length; j++) {
                      caches.delete(names[j]);
                    }
                  });
                }
                try {
                  localStorage.removeItem('laclave_offline_content_v1');
                  localStorage.removeItem('laclave_offline_queue_v1');
                } catch(e) {}
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

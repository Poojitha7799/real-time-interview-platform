'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const handleSignOutAction = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    window.location.href = '/register';
  };

  const isLiveRoom = pathname?.includes('/room/') || pathname?.includes('/live-');

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-neutral-950 text-neutral-200 antialiased font-sans" suppressHydrationWarning={true}>
        
        {!isLiveRoom && (
          <nav className="h-14 border-b border-neutral-900 bg-neutral-950 px-8 flex items-center justify-between select-none shrink-0" suppressHydrationWarning={true}>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 cursor-pointer">
                <span className="text-purple-500 font-bold text-sm">⚡</span>
                <span className="font-black text-sm tracking-tight text-neutral-100 uppercase font-mono">InterviewFlow</span>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-xs font-mono font-bold uppercase tracking-wider">
                <a href="/analytics" className="text-neutral-400 hover:text-neutral-200 transition">Analytics Hub</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSignOutAction}
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-200 transition"
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}

        {children}

      </body>
    </html>
  );
}
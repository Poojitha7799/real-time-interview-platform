import React from 'react';
import './globals.css';

export const metadata = {
  title: 'InterviewFlow Core',
  description: 'Real-time technical assessment engine matrix'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-200 antialiased selection:bg-purple-500/30">
        {children}
      </body>
    </html>
  );
}
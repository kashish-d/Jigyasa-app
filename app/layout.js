import { Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '800'] });

export const metadata = { title: 'What matters most?', description: 'Spread 100 points across 3 priorities.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={sora.className}>{children}</body>
    </html>
  );
}

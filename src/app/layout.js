import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'RestaurantOS',
  description: 'Restaurant Menu Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
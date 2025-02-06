import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'RestaurantOS',
  description: 'Restaurant Menu Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
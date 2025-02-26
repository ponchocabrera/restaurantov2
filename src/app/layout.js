import './globals.css';
import { Providers } from './providers';
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata = {
  title: 'RestaurantOS',
  description: 'Restaurant Menu Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Providers>
            <div className="relative">
              {children}
            </div>
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
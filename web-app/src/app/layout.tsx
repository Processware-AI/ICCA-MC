import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/layout/AuthProvider';

export const metadata: Metadata = {
  title: '이카산악회',
  description: 'ICCA Mountain Club - 이카산악회 회원 관리 시스템',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontFamily: 'Pretendard, sans-serif' },
          }}
        />
      </body>
    </html>
  );
}

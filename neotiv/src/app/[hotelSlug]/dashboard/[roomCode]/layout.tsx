import { Suspense } from 'react';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-slate-900" />}>
      {children}
    </Suspense>
  );
}

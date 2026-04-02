import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home, MessageCircle, ConciergeBell } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';

export default async function MobileAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelSlug: string; sessionId: string }>;
}) {
  const { hotelSlug, sessionId } = await params;
  const supabase = await createServerClient();

  // Validate session
  const { data: session } = await supabase
    .from('mobile_sessions')
    .select('*, rooms(room_code), hotels(name)')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
        <span className="text-5xl mb-4">⚠️</span>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Session</h1>
        <p className="text-slate-500">Please scan the QR code on your TV again.</p>
      </div>
    );
  }

  const isExpired = new Date(session.expires_at).getTime() < new Date().getTime();
  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
        <span className="text-5xl mb-4">⏱️</span>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Session Expired</h1>
        <p className="text-slate-500">For your security, this session has expired after 1 hour. Please scan the QR code on your TV to continue.</p>
      </div>
    );
  }

  const roomCode = session.rooms?.room_code || 'Unknown Room';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Mobile App Header */}
      <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-50">
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight truncate">
            {session.hotels?.name || 'Hotel Portal'}
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Room {roomCode}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100">
          {roomCode}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom,16px)] max-w-md mx-auto">
        <Link href={`/${hotelSlug}/mobile/${sessionId}`} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href={`/${hotelSlug}/mobile/${sessionId}/services`} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
          <ConciergeBell className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Services</span>
        </Link>
        <Link href={`/${hotelSlug}/mobile/${sessionId}/chat`} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-600 transition-colors">
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <span className="text-[10px] font-semibold">Chat</span>
        </Link>
      </nav>
    </div>
  );
}

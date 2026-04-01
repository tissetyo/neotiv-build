'use client';

interface Props {
  guestName: string;
  guestPhotoUrl: string | null;
  roomCode: string;
}

export default function GuestCard({ guestName, guestPhotoUrl, roomCode }: Props) {
  return (
    <div className="tv-widget-light h-full flex items-center justify-between tv-focusable" tabIndex={0}>
      <div className="flex items-center gap-[0.6vw]">
        <p className="text-slate-600 text-[0.7vw] font-medium">Hello</p>
        <div className="bg-slate-900/5 rounded-full px-[0.8vw] py-[0.3vw] border border-slate-900/10">
          <span className="text-slate-900 text-[0.85vw] font-bold">{guestName || 'Stephen Hawk'}</span>
        </div>
        <div className="w-[2.5vw] h-[2.5vw] rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
          <img src={guestPhotoUrl || '/avatar.png'} alt="Guest" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="text-right text-slate-900">
        <p className="text-[0.55vw] font-bold tracking-widest text-slate-500 uppercase">Room</p>
        <p className="text-[2vw] font-bold leading-none text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>{roomCode}</p>
      </div>
    </div>
  );
}

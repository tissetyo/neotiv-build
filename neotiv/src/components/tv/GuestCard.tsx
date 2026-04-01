'use client';

interface Props {
  guestName: string;
  guestPhotoUrl: string | null;
  roomCode: string;
}

export default function GuestCard({ guestName, guestPhotoUrl, roomCode }: Props) {
  return (
    <div className="tv-widget h-full flex items-center justify-between tv-focusable" tabIndex={0}>
      <div className="flex items-center gap-[0.6vw]">
        <p className="text-white/60 text-[0.7vw] tv-text-shadow">Hello</p>
        <div className="bg-white/10 rounded-full px-[0.8vw] py-[0.3vw] border border-white/15">
          <span className="text-white text-[0.85vw] font-semibold tv-text-shadow">{guestName || 'Stephen Hawk'}</span>
        </div>
        <div className="w-[2.5vw] h-[2.5vw] rounded-full overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
          <img src={guestPhotoUrl || '/avatar.png'} alt="Guest" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="text-right text-white">
        <p className="text-[0.55vw] font-medium tracking-widest text-white/50 uppercase">Room</p>
        <p className="text-[2vw] font-bold leading-none tv-text-shadow" style={{ fontFamily: 'Georgia, serif' }}>{roomCode}</p>
      </div>
    </div>
  );
}

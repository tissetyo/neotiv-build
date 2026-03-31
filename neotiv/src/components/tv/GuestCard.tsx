'use client';

interface Props {
  guestName: string;
  guestPhotoUrl: string | null;
  roomCode: string;
}

export default function GuestCard({ guestName, guestPhotoUrl, roomCode }: Props) {
  return (
    <div className="tv-widget flex items-center justify-between flex-1">
      <div className="flex items-center gap-[0.8vw]">
        <div className="w-[3.5vw] h-[3.5vw] rounded-full overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
          <img src={guestPhotoUrl || '/avatar.png'} alt="Guest" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-white/70 text-[0.8vw] tv-text-shadow">Welcome</p>
          <p className="text-white text-[1.1vw] font-bold tv-text-shadow leading-tight">{guestName || 'Stephen Hawk'}</p>
        </div>
      </div>
      <div className="text-right text-white">
        <p className="text-[0.7vw] font-medium tracking-widest text-white/60 tv-text-shadow uppercase">Room</p>
        <p className="text-[2.5vw] font-bold leading-none tv-text-shadow" style={{ fontFamily: 'Georgia, serif' }}>{roomCode}</p>
      </div>
    </div>
  );
}

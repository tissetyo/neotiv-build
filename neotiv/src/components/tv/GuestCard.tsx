'use client';

interface Props {
  guestName: string;
  guestPhotoUrl: string | null;
  roomCode: string;
}

export default function GuestCard({ guestName, guestPhotoUrl, roomCode }: Props) {
  const firstName = guestName?.split(' ').pop() || 'Guest';

  return (
    <div className="tv-widget flex items-center justify-between flex-1 min-h-[10vh] max-h-[12vh]">
      <div className="flex items-center gap-[1vw]">
        <div className="flex flex-col">
          <span className="text-white text-[1.2vw] tv-text-shadow leading-none mb-1">Hello</span>
          <span className="bg-slate-700/80 text-white px-[1vw] py-[0.5vh] rounded-full text-[1.2vw] font-semibold border border-white/20 tv-text-shadow">
            {guestName || 'Stephen Hawk'}
          </span>
        </div>
        <div className="w-[4vw] h-[4vw] rounded-full overflow-hidden border-[0.2vw] border-white/30 shadow-md">
          <img src={guestPhotoUrl || '/avatar.png'} alt="Guest" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="text-right text-white ml-[1vw]">
        <p className="text-[1vw] font-medium tracking-wider tv-text-shadow">Room</p>
        <p className="text-[3vw] font-bold leading-none tv-text-shadow" style={{ fontFamily: 'var(--font-display)' }}>{roomCode}</p>
      </div>
    </div>
  );
}

'use client';

interface Props {
  guestName: string;
  guestPhotoUrl: string | null;
  roomCode: string;
}

export default function GuestCard({ guestName, guestPhotoUrl, roomCode }: Props) {
  const firstName = guestName?.split(' ').pop() || 'Guest';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-white text-[20px]">Hello</span>
        <span className="bg-slate-700/80 text-white px-4 py-1.5 rounded-full text-[18px] font-semibold border border-white/10">
          {guestName || 'Stephen Hawk'}
        </span>
        <div className="w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-white/30">
          <img src={guestPhotoUrl || '/avatar.png'} alt="Guest" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="text-right text-white ml-4">
        <p className="text-[15px] font-medium tracking-wider">Room</p>
        <p className="text-[48px] font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{roomCode}</p>
      </div>
    </div>
  );
}

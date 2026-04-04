'use client';

interface Props {
  guestName: string;
  guestPhotoUrl: string | null;
  roomCode: string;
  onClick?: () => void;
}

export default function GuestCard({ guestName, guestPhotoUrl, roomCode, onClick }: Props) {
  if (!guestName) {
    return (
      <div className="tv-widget-light h-full flex flex-col items-center justify-center tv-focusable cursor-pointer" tabIndex={0} onClick={onClick}>
        <span className="text-slate-500 text-[1.2vw] font-bold mb-[0.5vh]">Room {roomCode}</span>
        <span className="text-slate-400 text-[0.6vw] tracking-wider uppercase font-semibold">Vacant</span>
      </div>
    );
  }

  // The Reference mockup displays:
  // [Hello]  [guest photo overlapping a text pane] | [Room 417]
  return (
    <div className="h-full flex items-center justify-between tv-focusable tv-widget-transparent bg-transparent pl-4 pr-6 py-2 cursor-pointer" tabIndex={0} onClick={onClick}>
      <div className="flex items-center">
         <div className="flex flex-col justify-center items-end mr-[1vw]">
            <span className="text-white text-[1.1vw] font-medium leading-none">Hello</span>
         </div>
         <div className="bg-teal-900/40 backdrop-blur-md rounded-full pl-[1.5vw] pr-[2.5vw] py-[0.6vw] border border-white/20 relative flex items-center shadow-2xl">
            <span className="text-white text-[1.4vw] font-semibold whitespace-nowrap">{guestName}</span>
            <div className="absolute right-[-2vw] w-[5vw] h-[5vw] rounded-full overflow-hidden border-[3px] border-teal-50 shadow-lg z-10 bg-slate-200 flex-shrink-0">
               <img src={guestPhotoUrl || '/avatar.png'} alt="Guest" className="w-full h-full object-cover" />
            </div>
         </div>
      </div>
      
      <div className="flex items-center pl-[3vw]">
         <div className="w-px h-[4vw] bg-white/40 mr-[1.5vw]"></div>
         <div className="flex flex-col text-white">
            <span className="text-[1.1vw] font-medium leading-tight">Room</span>
            <span className="text-[3vw] font-bold leading-none tracking-tight">{roomCode}</span>
         </div>
      </div>
    </div>
  );
}

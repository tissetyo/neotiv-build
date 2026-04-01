'use client';

interface Props {
  location: string;
  hotelName: string;
}

export default function MapWidget({ location, hotelName }: Props) {
  const query = encodeURIComponent(`${hotelName}, ${location}`);
  const apiKey = typeof window !== 'undefined' ? '' : '';

  return (
    <div className="tv-widget h-full tv-focusable overflow-hidden p-0" tabIndex={0}>
      <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-800 relative flex items-center justify-center">
        {(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY.includes('your_')) ? (
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}&q=${query}&zoom=15`}
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-center text-white/60">
            <div>
              <span className="text-[40px]">🗺️</span>
              <p className="text-[14px] mt-2">{location || 'Kuta, Bali'}</p>
              <p className="text-[12px] mt-1">Map Preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

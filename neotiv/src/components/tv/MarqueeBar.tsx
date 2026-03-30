'use client';

export default function MarqueeBar() {
  const announcements = [
    'Lorem ipsum dolor sit amet consectetur. Sit urna orci posuere eget.',
    'Lorem ipsum dolor sit amet consectetur. Sit urna orci posuere eget.',
    'Lorem ipsum dolor sit amet consectetur. Sit urna orci posuere eget.',
  ];

  const text = announcements.join('  •  ');
  const duration = Math.max(text.length / 8, 20);

  return (
    <div className="w-full h-full overflow-hidden flex items-center"
      style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="whitespace-nowrap animate-marquee text-white/80 text-[15px]"
        style={{ animationDuration: `${duration}s` }}>
        {text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{text}
      </div>
    </div>
  );
}

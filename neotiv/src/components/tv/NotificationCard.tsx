'use client';

interface Props {
  roomId: string | null;
}

export default function NotificationCard({ roomId }: Props) {
  // In production, this would use Supabase Realtime subscription
  const notification = {
    title: 'Title Notification',
    body: 'Lorem ipsum dolor sit amet consectetur. Scelerisque ipsum nisi elementum elementum faucibus etiam nunc turpis. Adipiscing nunc sit mattis varius tellus molestie id enim a. Amet adipiscing porttitor nunc integer auctor sed duis dolor enim. Feugiat libero sit dolor risus justo.',
    created_at: new Date().toISOString(),
  };

  const dateStr = new Date(notification.created_at).toLocaleString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="tv-widget h-full flex flex-col tv-focusable" tabIndex={0}>
      <div className="flex items-center justify-between mb-3">
        <span className="tv-badge-red">Notification</span>
        <span className="text-white/50 text-[13px]">{dateStr}</span>
      </div>
      <h3 className="text-white text-[20px] font-bold mb-2">{notification.title}</h3>
      <p className="text-white/60 text-[15px] leading-relaxed flex-1 overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
        {notification.body}
      </p>
    </div>
  );
}

import { redirect } from 'next/navigation';

export default function HotelPage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  // Hotel root redirects to frontoffice for logged-in staff
  return redirect('/');
}

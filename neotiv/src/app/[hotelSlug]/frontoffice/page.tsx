import { redirect } from 'next/navigation';

export default async function FrontofficePage({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = await params;
  redirect(`/${hotelSlug}/frontoffice/rooms`);
}

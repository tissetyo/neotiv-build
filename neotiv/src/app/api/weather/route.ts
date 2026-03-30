import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const city = request.nextUrl.searchParams.get('city');
  if (!city) {
    return NextResponse.json({ error: 'City required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
      { next: { revalidate: 600 } } // cache 10 min
    );

    if (!res.ok) {
      return NextResponse.json({ temp: 24, icon: '☁️', description: 'Partly cloudy', city });
    }

    const data = await res.json();
    return NextResponse.json({
      temp: Math.round(data.main.temp),
      icon: data.weather?.[0]?.icon || '02d',
      description: data.weather?.[0]?.description || 'Clear',
      city: data.name || city,
    });
  } catch {
    return NextResponse.json({ temp: 24, icon: '☁️', description: 'Partly cloudy', city });
  }
}

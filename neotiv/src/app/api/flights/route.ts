import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const airport = request.nextUrl.searchParams.get('airport');
  if (!airport) {
    return NextResponse.json({ error: 'Airport IATA code required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey || apiKey === 'your_aviationstack_key') {
      // Return mock data if no API key
      return NextResponse.json({ flights: getMockFlights() });
    }

    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${airport}&limit=12`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json({ flights: getMockFlights() });
    }

    const data = await res.json();
    const flights = (data.data || []).map((f: Record<string, unknown>) => {
      const dep = f.departure as Record<string, unknown> | undefined;
      const arr = f.arrival as Record<string, unknown> | undefined;
      const flight = f.flight as Record<string, unknown> | undefined;
      const airline = f.airline as Record<string, unknown> | undefined;
      return {
        flightNumber: (flight?.iata as string) || 'N/A',
        airline: (airline?.name as string) || 'Unknown',
        time: dep?.scheduled ? new Date(dep.scheduled as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
        destination: (arr?.airport as string) || 'Unknown',
        gate: (dep?.gate as string) || '-',
        status: mapFlightStatus(f.flight_status as string),
      };
    });

    return NextResponse.json({ flights });
  } catch {
    return NextResponse.json({ flights: getMockFlights() });
  }
}

function mapFlightStatus(status: string): string {
  switch (status) {
    case 'scheduled': return 'on_schedule';
    case 'delayed': return 'delay';
    case 'cancelled': return 'closed';
    case 'active': return 'gate_open';
    case 'landed': return 'check_in';
    default: return 'on_schedule';
  }
}

function getMockFlights() {
  return [
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'last_call' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'closed' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'on_schedule' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'on_schedule' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'gate_open' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'delay' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'on_schedule' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'on_schedule' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'on_schedule' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'check_in' },
    { flightNumber: 'KL-123', airline: 'Citilink', time: '19:15', destination: 'Jakarta', gate: '10', status: 'check_in' },
  ];
}

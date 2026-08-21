import React from 'react';
import { Card } from '../Components/Card';
import { Badge } from '../Components/Badge';
import { Building, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export function ReservationsPage() {
  const dummyReservations = [
    { id: 1, hotel: 'Carlton Hotel', location: 'Antananarivo', dates: '10/09 - 12/09/2026', status: 'Confirmed', client: 'Patrick & Nadine', room: '1 Double Room (B&B)' },
    { id: 2, hotel: 'Vakona Forest Lodge', location: 'Andasibe', dates: '13/09 - 15/09/2026', status: 'Pending', client: 'Patrick & Nadine', room: '1 Double Room (HB)' },
    { id: 3, hotel: 'Isalo Rock Lodge', location: 'Ranohira', dates: '20/10 - 22/10/2026', status: 'Requested', client: 'Frank Mentzel', room: '2 Twin Rooms' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Hotel Reservations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dummyReservations.map(res => (
          <Card key={res.id} className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{res.hotel}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mt-1">
                    <MapPin size={12} /> {res.location}
                  </div>
                </div>
              </div>
              <Badge type={res.status === 'Confirmed' ? 'success' : res.status === 'Pending' ? 'warning' : 'info'}>
                {res.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-gray-100 dark:border-neutral-800">
              <div>
                <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Client</div>
                <div className="text-sm font-bold">{res.client}</div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Dates</div>
                <div className="text-sm font-bold flex items-center gap-2"><Calendar size={14} /> {res.dates}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Room Type</div>
                <div className="text-sm font-bold">{res.room}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

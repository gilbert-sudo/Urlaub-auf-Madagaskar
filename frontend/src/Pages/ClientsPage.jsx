import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClients } from '../store/slices/clientsSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { Plus, Mail, Phone, MapPin } from 'lucide-react';

export function ClientsPage() {
  const dispatch = useDispatch();
  const { items: clients, status } = useSelector((state) => state.clients);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchClients());
    }
  }, [dispatch, status]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Clients Directory</h1>
        <Button variant="primary">
          <Plus size={20} /> Add Client
        </Button>
      </div>

      <Card className="overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
              <th className="p-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Client Name</th>
              <th className="p-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Contact Info</th>
              <th className="p-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Total Pax</th>
              <th className="p-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50/30 dark:hover:bg-slate-700/50 transition-colors">
                <td className="p-4 font-bold">{client.name}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 text-sm text-gray-500">
                    <span className="flex items-center gap-2"><Mail size={14} /> {client.email}</span>
                    <span className="flex items-center gap-2"><Phone size={14} /> {client.phone || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-4 font-bold text-gray-500">{client.paxAdults + client.paxChildren}</td>
                <td className="p-4 text-right">
                  <Button variant="secondary" className="inline-flex py-1 px-3 text-xs">View Profile</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

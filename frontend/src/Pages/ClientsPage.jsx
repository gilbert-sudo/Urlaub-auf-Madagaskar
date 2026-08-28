import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClients } from '../store/slices/clientsSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { Plus, Mail, Phone, MapPin, Users } from 'lucide-react';

export function ClientsPage() {
  const dispatch = useDispatch();
  const { items: clients, status } = useSelector((state) => state.clients);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchClients());
    }
  }, [dispatch, status]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">Clients Directory</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Manage all your client information and history</p>
        </div>
        <Button variant="primary">
          <Plus size={18} /> Add Client
        </Button>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Client Name</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Contact Info</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Pax</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {status === 'loading' && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div></td>
                  <td className="p-5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  </td>
                  <td className="p-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8"></div></td>
                  <td className="p-5 text-right"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 ml-auto"></div></td>
                </tr>
              ))}
              
              {status !== 'loading' && clients.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No clients found</h3>
                      <p className="text-sm mt-1">Add your first client to get started.</p>
                    </div>
                  </td>
                </tr>
              )}

              {status !== 'loading' && clients.map(client => (
                <tr key={client._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="p-5 font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{client.name}</td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {client.email}</span>
                      <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {client.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-5 font-bold text-slate-500">{client.paxAdults + client.paxChildren}</td>
                  <td className="p-5 text-right">
                    <Button variant="ghost" className="inline-flex py-1.5 px-3 text-xs border border-slate-200 dark:border-slate-700">View Profile</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

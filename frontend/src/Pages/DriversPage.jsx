import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDrivers, deleteDriver } from '../store/slices/driversSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { Plus, Mail, Phone, Edit2, Trash2, Car, Users, Eye } from 'lucide-react';
import { DriverModal } from '../Components/DriverModal';
import { ProfileViewerModal } from '../Components/ProfileViewerModal';
import { toast } from 'sonner';

export function DriversPage() {
  const dispatch = useDispatch();
  const { items: drivers, status } = useSelector((state) => state.drivers);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [viewProfileDriver, setViewProfileDriver] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDrivers());
    }
  }, [dispatch, status]);

  const handleOpenModal = (driver = null) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await dispatch(deleteDriver(id)).unwrap();
        toast.success('Driver deleted successfully');
      } catch (error) {
        toast.error('Failed to delete driver');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">Drivers Directory</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Manage all your drivers and their status</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Driver
        </Button>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Driver Name</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Contact Info</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vehicle Info</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
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
                  <td className="p-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
                  <td className="p-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                  <td className="p-5 text-right"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 ml-auto"></div></td>
                </tr>
              ))}
              
              {status !== 'loading' && drivers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Car size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No drivers found</h3>
                      <p className="text-sm mt-1">Add your first driver to get started.</p>
                    </div>
                  </td>
                </tr>
              )}

              {status !== 'loading' && drivers.map(driver => (
                <tr key={driver._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td 
                    className="p-5 font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-primary transition-colors cursor-pointer"
                    onClick={() => setViewProfileDriver(driver)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                        {driver.avatar ? (
                          <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-500 text-sm font-bold">{driver.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span>{driver.name}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      {driver.email && <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {driver.email}</span>}
                      {driver.phone && <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {driver.phone}</span>}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 text-[13px] font-medium text-slate-500">
                      {driver.vehicleType && <span className="font-semibold text-slate-700 dark:text-slate-300">{driver.vehicleType}</span>}
                      {driver.languages && driver.languages.length > 0 && <span>{driver.languages.join(', ')}</span>}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      driver.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      driver.status === 'On Trip' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {driver.status || 'Available'}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setViewProfileDriver(driver)}
                        className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(driver)}
                        className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors"
                        title="Edit Driver"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(driver._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete Driver"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <DriverModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        driver={selectedDriver}
      />
      <ProfileViewerModal
        isOpen={!!viewProfileDriver}
        onClose={() => setViewProfileDriver(null)}
        data={viewProfileDriver}
        type="driver"
      />
    </div>
  );
}

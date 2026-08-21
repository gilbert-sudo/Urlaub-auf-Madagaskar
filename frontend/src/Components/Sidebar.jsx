import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Home, Map, Calendar, Users, FileText } from 'lucide-react';

const menuItems = [
  { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
  { path: '/trips', icon: <Map size={20} />, label: 'Trips & Itineraries' },
  { path: '/reservations', icon: <Calendar size={20} />, label: 'Reservations' },
  { path: '/clients', icon: <Users size={20} />, label: 'Clients' },
  { path: '/documents', icon: <FileText size={20} />, label: 'Documents' },
];

export function Sidebar() {
  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-gray-900 text-gray-400 p-6 flex flex-col gap-8 z-40">
      <div className="flex items-center gap-3 text-2xl font-black text-brand-primary">
        <MapPin size={32} />
        <div>Urlaub <span className="text-white">Madagaskar</span></div>
      </div>
      
      <nav className="flex-1">
        <ul className="flex flex-col gap-2">
          {menuItems.map(item => (
            <li key={item.path}>
              <NavLink 
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold ${
                    isActive 
                      ? 'bg-brand-primary/10 text-brand-primary' 
                      : 'hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

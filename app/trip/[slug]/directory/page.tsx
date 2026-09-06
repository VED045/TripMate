'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  Car,
  Hotel,
  ShieldAlert,
  Plus,
  MapPin,
  MessageSquare,
  Copy,
  Trash2,
  Sparkles,
  ExternalLink,
  Compass,
  AlertTriangle,
  HeartPulse,
  X,
  UserCheck
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export interface TripContact {
  id: string;
  category: 'driver' | 'stay' | 'activity' | 'emergency' | 'other';
  title: string;
  name: string;
  phone: string;
  details?: string;
  location?: string;
}

const DEFAULT_EMERGENCY_CONTACTS: TripContact[] = [
  {
    id: 'em-1',
    category: 'emergency',
    title: 'National Emergency Helpline',
    name: 'All-in-One Emergency',
    phone: '112',
    details: 'Police, Fire, and Ambulance support 24/7 across India',
  },
  {
    id: 'em-2',
    category: 'emergency',
    title: 'Medical Ambulance',
    name: 'National Ambulance Service',
    phone: '108',
    details: 'Immediate medical rescue & emergency ambulance transport',
  },
  {
    id: 'em-3',
    category: 'emergency',
    title: 'Tourist Police & Assistance',
    name: 'Tourist Helpline',
    phone: '1363',
    details: 'Toll-free tourist safety & language support',
  },
  {
    id: 'em-4',
    category: 'emergency',
    title: 'Women Safety Helpline',
    name: 'National Commission for Women',
    phone: '1091',
    details: '24x7 Emergency assistance for women',
  },
];

export default function DirectoryPage() {
  const { trip } = useActiveTrip();
  const [contacts, setContacts] = useState<TripContact[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'driver' | 'stay' | 'activity' | 'emergency'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Contact Form
  const [newCat, setNewCat] = useState<'driver' | 'stay' | 'activity' | 'emergency' | 'other'>('driver');
  const [newTitle, setNewTitle] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDetails, setNewDetails] = useState('');

  useEffect(() => {
    if (!trip) return;
    const saved = localStorage.getItem(`tripmate_contacts_${trip.id}`);
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        setContacts(DEFAULT_EMERGENCY_CONTACTS);
      }
    } else {
      setContacts(DEFAULT_EMERGENCY_CONTACTS);
    }
  }, [trip]);

  const saveContacts = (updated: TripContact[]) => {
    setContacts(updated);
    if (trip) {
      localStorage.setItem(`tripmate_contacts_${trip.id}`, JSON.stringify(updated));
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Please provide a contact name and phone number');
      return;
    }

    const newEntry: TripContact = {
      id: `contact-${Date.now()}`,
      category: newCat,
      title: newTitle.trim() || `${newCat.toUpperCase()} Contact`,
      name: newName.trim(),
      phone: newPhone.trim(),
      details: newDetails.trim() || undefined,
    };

    const updated = [newEntry, ...contacts];
    saveContacts(updated);
    toast.success('Contact added to directory!');
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewName('');
    setNewPhone('');
    setNewDetails('');
  };

  const handleDelete = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    saveContacts(updated);
    toast.success('Contact removed');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const filtered = contacts.filter((c) => {
    if (activeTab === 'all') return true;
    return c.category === activeTab;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'driver':
        return <Car className="w-5 h-5 text-cyan-400" />;
      case 'stay':
        return <Hotel className="w-5 h-5 text-indigo-400" />;
      case 'activity':
        return <Compass className="w-5 h-5 text-pink-400" />;
      case 'emergency':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      default:
        return <Phone className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050711]">
      <TripHeader title="Trip Directory & Helpline" subtitle="Cab drivers, stay hosts, rentals & emergency numbers" />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-400" /> Trip Directory & SOS
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Store your driver contacts, villa caretakers, bike rentals, and 24/7 medical/police helplines.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: 'all', label: `All (${contacts.length})` },
            { key: 'driver', label: '🚗 Drivers & Cabs' },
            { key: 'stay', label: '🏨 Stays & Resorts' },
            { key: 'activity', label: '🏖️ Rentals & Guides' },
            { key: 'emergency', label: '🚨 Emergency & SOS' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeTab === key
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4 border ${item.category === 'emergency' ? 'border-rose-500/25 bg-rose-950/10' : ''
                }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-md">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400">
                        {item.title}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  {!item.id.startsWith('em-') && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {item.details && (
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {item.details}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{item.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
                <a
                  href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                  className="py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>

                <a
                  href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(item.phone)}
                  className="py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c1228] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-outfit text-white">Add Directory Contact</h2>
                    <p className="text-xs text-slate-400">Save drivers, hotels & local contacts</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full bg-[#0a0f24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="driver">🚗 Cab / Driver</option>
                    <option value="stay">🏨 Hotel / Villa Host</option>
                    <option value="activity">🏖️ Rentals / Activities / Guide</option>
                    <option value="emergency">🚨 Local Emergency / Doctor</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Innova Cab Driver, Villa Caretaker, Scooter Rental"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Additional Notes / Vehicle No.</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. White Innova MH-06-AB-1234, available 24/7"
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/25 active:scale-[0.99] transition-all"
                >
                  Save to Trip Directory
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  Car,
  Hotel,
  ShieldAlert,
  Plus,
  MapPin,
  Copy,
  Trash2,
  Sparkles,
  ExternalLink,
  Compass,
  AlertTriangle,
  HeartPulse,
  X,
  UserCheck,
  Heart,
  Navigation,
  Radio,
  Send,
  Users,
  ChevronDown,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { pickPhoneContacts, formatWhatsAppUrl } from '@/lib/contacts';
import { CustomSelect } from '@/components/ui/CustomSelect';

export interface TripContact {
  id: string;
  category: 'family' | 'driver' | 'stay' | 'activity' | 'emergency' | 'other';
  member_id?: string | null;
  member_name?: string | null;
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
  const { trip, members, currentMember } = useActiveTrip();
  const [contacts, setContacts] = useState<TripContact[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'family' | 'driver' | 'stay' | 'activity' | 'emergency'>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('my_family');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Contact Form State
  const [newCat, setNewCat] = useState<'family' | 'driver' | 'stay' | 'activity' | 'emergency' | 'other'>('family');
  const [newMemberId, setNewMemberId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDetails, setNewDetails] = useState('');

  useEffect(() => {
    if (currentMember) {
      setNewMemberId(currentMember.id);
    }
  }, [currentMember]);

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

    const assignedMember = members.find(m => m.id === newMemberId) || currentMember;

    const newEntry: TripContact = {
      id: `contact-${Date.now()}`,
      category: newCat,
      member_id: newCat === 'family' ? (assignedMember?.id || null) : null,
      member_name: newCat === 'family' ? (assignedMember?.name || null) : null,
      title: newTitle.trim() || (newCat === 'family' ? 'Family & Safe Contact' : `${newCat.toUpperCase()} Contact`),
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

  const handleSendLocationPing = (contact: TripContact) => {
    const msg = `Hi ${contact.name} 👋! Safety check-in from ${trip?.name || 'our trip'}: I'm safe & sound! 📍 Location Status: Checked in safely.`;
    const url = formatWhatsAppUrl(contact.phone, msg);
    window.open(url, '_blank');
    toast.success(`Location ping sent to ${contact.name}!`);
  };

  const handleSendHeartbeat = (contact: TripContact) => {
    const msg = `💓 SAFETY HEARTBEAT CHECK-IN: Hi ${contact.name}! All safe & well here on ${trip?.name || 'TripMate'} with the crew! 🎉`;
    const url = formatWhatsAppUrl(contact.phone, msg);
    window.open(url, '_blank');
    toast.success(`Heartbeat check-in sent to ${contact.name}!`);
  };

  // Filter contacts based on active tab and member filter dropdown
  const filtered = contacts.filter((c) => {
    if (activeTab !== 'all' && c.category !== activeTab) {
      return false;
    }

    if (c.category === 'family') {
      if (selectedMemberFilter === 'my_family' && currentMember) {
        return !c.member_id || c.member_id === currentMember.id;
      }
      if (selectedMemberFilter !== 'all' && selectedMemberFilter !== 'my_family') {
        return c.member_id === selectedMemberFilter;
      }
    }

    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'family':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'driver':
        return <Car className="w-5 h-5 text-cyan-500" />;
      case 'stay':
        return <Hotel className="w-5 h-5 text-indigo-500" />;
      case 'activity':
        return <Compass className="w-5 h-5 text-amber-500" />;
      case 'emergency':
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      default:
        return <Phone className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader title="Trip Directory & SOS" subtitle="Family safe contacts, cab drivers, stay hosts & emergency numbers" />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 space-y-6 pb-nav">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl raised-card bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-raised)]">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2b56ff]/10 border border-[#2b56ff]/20 flex items-center justify-center text-[#2b56ff] shrink-0 shadow-sm">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-[var(--text-primary)] flex items-center gap-2">
                Trip Directory & Family SOS
              </h2>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-1 leading-relaxed">
                Store family safe contacts (Mom, Dad), drivers, hotel caretakers & send 1-tap WhatsApp location pings or heartbeat checks.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-[#2b56ff] hover:bg-[#163ecf] text-white font-extrabold text-xs shadow-md shadow-[#2b56ff]/25 flex items-center gap-2 transition-all active:scale-95 shrink-0 font-outfit"
          >
            <Plus className="w-4 h-4" /> Add Directory Contact
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: 'all', label: `All (${contacts.length})` },
            { key: 'family', label: '👨‍👩‍👧 Family & Safe Contacts' },
            { key: 'driver', label: '🚗 Drivers & Cabs' },
            { key: 'stay', label: '🏨 Stays & Resorts' },
            { key: 'activity', label: '🏖️ Rentals & Guides' },
            { key: 'emergency', label: '🚨 Helpline & SOS' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={(e) => {
                setActiveTab(key as any);
                (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all font-outfit ${
                activeTab === key
                  ? 'bg-[#2b56ff] text-white font-extrabold shadow-md shadow-[#2b56ff]/25 border border-transparent'
                  : 'inset-card bg-[var(--surface-inset)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)] border border-[var(--border)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Family Member Filter Bar Dropdown (Visible on Family or All tabs) */}
        {(activeTab === 'family' || activeTab === 'all') && (
          <div className="raised-card bg-[var(--surface-raised)] border border-[var(--border)] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold font-outfit text-[var(--text-primary)]">
              <Users className="w-4 h-4 text-[#2b56ff]" />
              <span>Filter Family Contacts by Crew Member:</span>
            </div>

            <div className="w-full sm:w-auto">
              <CustomSelect
                value={selectedMemberFilter}
                onChange={setSelectedMemberFilter}
                options={[
                  ...(currentMember ? [{
                    value: 'my_family',
                    label: `📱 My Family Contacts (${currentMember.name}) [DEFAULT]`,
                    color: currentMember.color,
                  }] : []),
                  { value: 'all', label: '👥 All Crew Family Contacts' },
                  ...members.map((m) => ({
                    value: m.id,
                    label: `👤 ${m.name}'s Family Contacts`,
                    color: m.color,
                    isCreator: Boolean(m.is_admin || (trip?.created_by && m.id === trip.created_by) || (members.length > 0 && members[0]?.id === m.id)),
                  })),
                ]}
                className="w-full sm:w-auto min-w-[220px]"
              />
            </div>
          </div>
        )}

        {/* Contacts Grid */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center rounded-3xl raised-card bg-[var(--surface-raised)] border border-[var(--border)] space-y-2">
            <p className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
              No contacts found for this category
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Click &quot;Add Directory Contact&quot; to add family members, cab drivers, or emergency numbers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl raised-card bg-[var(--surface-raised)] flex flex-col justify-between space-y-4 border transition-all ${
                  item.category === 'family'
                    ? 'border-rose-500/30'
                    : item.category === 'emergency'
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : 'border-[var(--border)]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl inset-card bg-[var(--surface-inset)] border border-[var(--border)] flex items-center justify-center shadow-inner shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-[#2b56ff] block truncate">
                            {item.title}
                          </span>
                          {item.member_name && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[var(--surface-inset)] text-[var(--text-secondary)] border border-[var(--border)]">
                              {item.member_name}&apos;s Family
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-extrabold font-outfit text-[var(--text-primary)] tracking-tight truncate mt-0.5">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    {!item.id.startsWith('em-') && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {item.details && (
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-3 leading-relaxed">
                      {item.details}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs font-mono font-bold text-[#2b56ff] bg-[var(--surface-inset)] px-3 py-1.5 rounded-xl border border-[var(--border)] w-fit">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{item.phone}</span>
                  </div>
                </div>

                {/* Family Special Action Buttons */}
                {item.category === 'family' ? (
                  <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendLocationPing(item)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 font-outfit"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Location Ping 📍
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendHeartbeat(item)}
                        className="py-2.5 px-3 rounded-xl bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5 font-outfit"
                      >
                        <Heart className="w-3.5 h-3.5" /> Heartbeat Check 💓
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                        className="py-2 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors font-outfit"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                      </a>

                      <a
                        href={formatWhatsAppUrl(item.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors font-outfit"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp Chat
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Standard Action Buttons */
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)]">
                    <a
                      href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                      className="py-2.5 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors font-outfit"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                    </a>

                    <a
                      href={formatWhatsAppUrl(item.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors font-outfit"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" /> Chat
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.phone)}
                      className="py-2.5 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors font-outfit"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md raised-card bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#2b56ff]/10 border border-[#2b56ff]/20 flex items-center justify-center text-[#2b56ff] shadow-md">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-outfit text-[var(--text-primary)]">Add Directory Contact</h2>
                    <p className="text-xs text-[var(--text-muted)]">Save family numbers, drivers, hotels & local contacts</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl inset-card text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Import from Contacts Trigger */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    const results = await pickPhoneContacts();
                    if (results.length > 0) {
                      const picked = results[0];
                      if (picked.name) setNewName(picked.name);
                      if (picked.phone) setNewPhone(picked.phone);
                      toast.success(`Imported ${picked.name} from contacts!`);
                    } else {
                      toast.info('No contact picked or Contacts API not supported on this browser');
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-inner font-outfit"
                >
                  <Phone className="w-4 h-4 text-[#2b56ff]" /> Pick from Phone Contacts 📱
                </button>
              </div>

              <form onSubmit={handleAddContact} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Category</label>
                  <CustomSelect
                    value={newCat}
                    onChange={(val) => setNewCat(val as any)}
                    options={[
                      { value: 'family', label: '👨‍👩‍👧 Family & Safe Contact (Mom, Dad, Spouse)' },
                      { value: 'driver', label: '🚗 Cab / Driver' },
                      { value: 'stay', label: '🏨 Hotel / Villa Host' },
                      { value: 'activity', label: '🏖️ Rentals / Activities / Guide' },
                      { value: 'emergency', label: '🚨 Local Emergency / Doctor' },
                      { value: 'other', label: '📌 Other' },
                    ]}
                    className="w-full"
                  />
                </div>

                {newCat === 'family' && (
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Belongs to Member</label>
                    <CustomSelect
                      value={newMemberId}
                      onChange={setNewMemberId}
                      options={members.map((m) => ({
                        value: m.id,
                        label: `${m.name}${m.id === currentMember?.id ? ' (You)' : ''}`,
                        color: m.color,
                        isCreator: Boolean(m.is_admin || (trip?.created_by && m.id === trip.created_by) || (members.length > 0 && members[0]?.id === m.id)),
                      }))}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Title / Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Mom, Dad, Driver, Villa Host"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-outfit font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-outfit font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">Additional Notes / Vehicle No.</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Home address, available 24/7"
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-2xl bg-[#2b56ff] hover:bg-[#163ecf] text-white font-extrabold text-xs shadow-xl shadow-[#2b56ff]/20 active:scale-[0.99] transition-all font-outfit"
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

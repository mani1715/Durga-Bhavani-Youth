import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { Plus, Edit2, Archive, Play, BarChart3, X } from 'lucide-react';

interface EventData {
  id: string;
  name: string;
  description: string;
  financial_year: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  total_collections: number;
  total_expenses: number;
  net_balance: number;
}

export const Events: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshEvents } = useEvent();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [financialYear, setFinancialYear] = useState(new Date().getFullYear().toString());

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEvents();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/events/${currentEventId}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, financial_year: financialYear })
      });
      
      if (!res.ok) throw new Error('Failed to save event');
      
      setIsModalOpen(false);
      resetForm();
      fetchEvents();
      refreshEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setFinancialYear(new Date().getFullYear().toString());
    setIsEditing(false);
    setCurrentEventId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (evt: EventData) => {
    setName(evt.name);
    setDescription(evt.description);
    setFinancialYear(evt.financial_year);
    setIsEditing(true);
    setCurrentEventId(evt.id);
    setIsModalOpen(true);
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to activate event');
      fetchEvents();
      refreshEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to archive event');
      fetchEvents();
      refreshEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500">Loading events...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Management</h1>
          <p className="text-sm text-slate-500">Manage festival instances and financial years</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
          <button 
            onClick={openCreateModal}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> Create Event
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          No events found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div 
              key={evt.id} 
              className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col h-full ${
                evt.status === 'ACTIVE' ? 'border-l-4 border-l-amber-500 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{evt.name}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  evt.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  evt.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {evt.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1">{evt.financial_year}</p>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-grow">{evt.description || 'No description provided.'}</p>
              
              <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-2 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Collections</span>
                  <span className="font-semibold text-emerald-600">₹{evt.total_collections?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Expenses</span>
                  <span className="font-semibold text-red-600">₹{evt.total_expenses?.toLocaleString() || 0}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                  <span className="text-slate-700">Net Balance</span>
                  <span className={evt.net_balance >= 0 ? 'text-amber-600' : 'text-red-600'}>
                    ₹{evt.net_balance?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100">
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                  <>
                    <button 
                      onClick={() => openEditModal(evt)}
                      className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    {evt.status !== 'ACTIVE' && (
                      <button 
                        onClick={() => handleActivate(evt.id)}
                        className="px-3 py-1.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" /> Activate
                      </button>
                    )}
                    {evt.status === 'ACTIVE' && (
                      <button 
                        onClick={() => handleArchive(evt.id)}
                        className="px-3 py-1.5 text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" /> Archive
                      </button>
                    )}
                  </>
                )}
                <button className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium flex items-center gap-1.5 transition-colors ml-auto">
                  <BarChart3 className="h-3.5 w-3.5" /> Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {isEditing ? 'Edit Event' : 'Create Event'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. Vinayaka Chavithi 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year</label>
                <input 
                  type="text" 
                  required
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. 2026-2027"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-24 resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

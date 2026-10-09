import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Event {
  id: string;
  name: string;
  financial_year: string;
  status: string;
}

interface EventContextType {
  events: Event[];
  activeEvent: Event | null;
  setActiveEvent: (event: Event) => void;
  loading: boolean;
  refreshEvents: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent_state] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/settings/events', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized or session ended");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
          const stored = localStorage.getItem('activeEventId');
          const match = data.find((e: Event) => e.id === stored) || data.find((e: Event) => e.status === 'ACTIVE') || data[0];
          if (match) {
            setActiveEvent_state(match);
          }
        } else {
          setEvents([]);
        }
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const setActiveEvent = (event: Event) => {
    localStorage.setItem('activeEventId', event.id);
    setActiveEvent_state(event);
  };

  return (
    <EventContext.Provider value={{ events, activeEvent, setActiveEvent, loading, refreshEvents: fetchEvents }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvent must be used within EventProvider');
  return context;
};

import { useState } from 'react';
import { Calendar, Users, Clock, Plus } from 'lucide-react';
import { dummyEvents, dummyGroups } from '../data/dummyData';
import CreateEventModal from './CreateEvent';

export default function Events() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'my-events'>('upcoming');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const upcomingEvents = dummyEvents.filter(event => new Date(event.dateTime) > new Date());
  const pastEvents = dummyEvents.filter(event => new Date(event.dateTime) <= new Date());

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getEventStatus = (dateTime: string) => {
    const eventDate = new Date(dateTime);
    const now = new Date();
    const diffInHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) return 'ended';
    if (diffInHours < 24) return 'today';
    if (diffInHours < 168) return 'this-week';
    return 'upcoming';
  };

  const renderEvents = () => {
    let events = [];
    switch (activeTab) {
      case 'upcoming':
        events = upcomingEvents;
        break;
      case 'past':
        events = pastEvents;
        break;
      case 'my-events':
        events = dummyEvents; // All events for demo
        break;
    }

    return events.map(event => {
      const group = dummyGroups.find(g => g.id === event.groupId);
      const { date, time } = formatDateTime(event.dateTime);
      const status = getEventStatus(event.dateTime);
      const goingCount = event.responses.filter(r => r.response === 'going').length;
      const notGoingCount = event.responses.filter(r => r.response === 'not_going').length;

      return (
        <div key={event.id} className="card" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '20px' }}>
            <div className="flex items-start gap-4">
              {/* Date Card */}
              <div style={{
                minWidth: '80px',
                padding: '12px',
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {new Date(event.dateTime).getDate()}
                </div>
                <div style={{ fontSize: '12px' }}>
                  {new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>

              {/* Event Info */}
              <div style={{ flex: 1 }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                    {event.title}
                  </h3>
                  {status === 'today' && (
                    <span className="badge badge-primary">Today</span>
                  )}
                  {status === 'this-week' && (
                    <span className="badge">This Week</span>
                  )}
                </div>

                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {event.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{date}</span>
                  </div>
                  {group && (
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{group.title}</span>
                    </div>
                  )}
                </div>

                {/* Response Stats */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)'
                    }} />
                    <span style={{ fontSize: '13px' }}>
                      {goingCount} going
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-muted)'
                    }} />
                    <span style={{ fontSize: '13px' }}>
                      {notGoingCount} not going
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="btn-primary">
                    Going
                  </button>
                  <button className="btn-secondary">
                    Not Going
                  </button>
                  <button className="btn-ghost">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Events</h2>
            <button className="btn-primary" onClick={() => setIsCreateEventModalOpen(true)}>
              <Plus size={16} />
              Create Event
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              className={activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              className={activeTab === 'my-events' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setActiveTab('my-events')}
            >
              My Events ({dummyEvents.length})
            </button>
            <button
              className={activeTab === 'past' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setActiveTab('past')}
            >
              Past Events ({pastEvents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {renderEvents()}

      {/* Empty State */}
      {(activeTab === 'upcoming' && upcomingEvents.length === 0) ||
       (activeTab === 'past' && pastEvents.length === 0) ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} events
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {activeTab === 'upcoming' 
              ? "There are no upcoming events. Create one or join a group to see events!"
              : "No past events to show."
            }
          </p>
        </div>
      ) : null}

      <CreateEventModal 
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
      />
    </div>
  );
}

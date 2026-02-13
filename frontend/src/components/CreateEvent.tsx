import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import Modal from './Modal';
import '../styles/components/CreateEvent.css';

interface CreateEventProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEvent({ isOpen, onClose }: CreateEventProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Event" size="medium">
      <div className="create-event-form">
        <div className="form-group">
          <label htmlFor="title">Event Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter event title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            placeholder="Describe your event..."
            rows={4}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">
              <Calendar size={16} />
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">
              <Clock size={16} />
              Time *
            </label>
            <input
              type="time"
              id="time"
              name="time"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">
            <MapPin size={16} />
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="Event location (optional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventType">
            <Users size={16} />
            Event Type
          </label>
          <select
            id="eventType"
            name="eventType"
          >
            <option value="public">Public Event</option>
            <option value="private">Private Event</option>
            <option value="group">Group Only</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary">
            Create Event
          </button>
        </div>
      </div>
    </Modal>
  );
}

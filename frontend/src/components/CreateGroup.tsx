import { useState } from 'react';
import Modal from './Modal';
import { groupApi } from '../services/api';
import '../styles/components/CreateGroup.css';

interface CreateGroupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroup({ isOpen, onClose }: CreateGroupProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setErrorMessage('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Group title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const response = await groupApi.createGroup({
      title: trimmedTitle,
      description: description.trim(),
    });

    if (!response.success) {
      if (typeof response.error === 'string') {
        setErrorMessage(response.error);
      } else if (response.error?.message) {
        setErrorMessage(response.error.message);
      } else {
        setErrorMessage('Failed to create group.');
      }
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Group" size="medium">
      <form className="create-group-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Group Name *</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter group name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="What is your group about?"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </div>

        {errorMessage && <p className="form-error">{errorMessage}</p>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

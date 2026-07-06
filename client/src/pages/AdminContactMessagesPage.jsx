import { Archive, CheckCircle2, Inbox, Mail, Phone, RefreshCw, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api, apiErrorMessage } from '../services/api.js';
import { dateShort, statusLabel } from '../utils/format.js';

const contactStatuses = ['new', 'read', 'replied', 'archived'];

const contactStatusIcon = {
  new: Inbox,
  read: CheckCircle2,
  replied: Mail,
  archived: Archive
};

export const AdminContactMessagesPage = () => {
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-contact-messages', debouncedSearch, statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/admin/contact-messages', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter
        }
      });
      return data.data;
    }
  });

  const updateStatus = async (contactMessageId, nextStatus) => {
    try {
      await api.patch(`/admin/contact-messages/${contactMessageId}`, { status: nextStatus });
      setMessage('Contact message updated');
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const messages = data?.messages || [];
  const pagination = data?.pagination;

  return (
    <section className="admin-page section">
      <Seo title="Admin Contact Messages" noIndex />
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Contact messages</h1>
        </div>
        <div className="toolbar-actions">
          {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
          <button className="button dark" type="button" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      <div className="metric-grid compact contact-message-metrics">
        <article className="metric-card">
          <Inbox size={22} />
          <span>New inquiries</span>
          <strong>{isLoading ? <span className="spinner tiny" /> : data?.metrics?.newCount || 0}</strong>
        </article>
        <article className="metric-card">
          <Mail size={22} />
          <span>Shown messages</span>
          <strong>{isLoading ? <span className="spinner tiny" /> : pagination?.total || 0}</strong>
        </article>
      </div>

      {message ? <p className="form-note">{message}</p> : null}

      <div className="panel admin-contact-panel">
        <div className="admin-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone, message" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Contact message status">
            <option value="all">All statuses</option>
            {contactStatuses.map((status) => (
              <option value={status} key={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
          {pagination ? <span className="search-meta">{pagination.total} message(s)</span> : null}
        </div>

        {isLoading ? (
          <AdminLoadingState label="Loading contact messages" />
        ) : messages.length ? (
          <div className="admin-contact-list">
            {messages.map((contactMessage) => {
              const contactMessageId = contactMessage._id || contactMessage.id;
              const StatusIcon = contactStatusIcon[contactMessage.status] || Inbox;

              return (
                <article className={`admin-contact-card ${contactMessage.status}`} key={contactMessageId}>
                  <div className="admin-contact-card-heading">
                    <div>
                      <span className={`status-pill ${contactMessage.status}`}>
                        <StatusIcon size={14} />
                        {statusLabel(contactMessage.status)}
                      </span>
                      <h2>{contactMessage.name}</h2>
                      <span>{dateShort(contactMessage.createdAt)}</span>
                    </div>
                    <select
                      value={contactMessage.status}
                      onChange={(event) => updateStatus(contactMessageId, event.target.value)}
                      aria-label={`Status for ${contactMessage.name}`}
                    >
                      {contactStatuses.map((status) => (
                        <option value={status} key={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="admin-contact-message-text">{contactMessage.message}</p>

                  <div className="admin-contact-actions">
                    <a className="button compact" href={`mailto:${contactMessage.email}`}>
                      <Mail size={16} />
                      {contactMessage.email}
                    </a>
                    <a className="button compact secondary" href={`tel:${contactMessage.phone}`}>
                      <Phone size={16} />
                      {contactMessage.phone}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted">No contact messages found.</p>
        )}
      </div>
    </section>
  );
};

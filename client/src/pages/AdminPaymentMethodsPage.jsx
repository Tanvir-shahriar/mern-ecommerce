import { AlertTriangle, Banknote, Building2, CheckCircle2, Pencil, Plus, Save, Smartphone } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { api, apiErrorMessage } from '../services/api.js';

const methodMeta = {
  cash_on_delivery: {
    title: 'Cash on delivery',
    eyebrow: 'Pay on arrival',
    icon: Banknote
  },
  bank_transfer: {
    title: 'Bank transfer',
    eyebrow: 'Manual bank payment',
    icon: Building2
  },
  mobile_banking: {
    title: 'Mobile banking',
    eyebrow: 'Manual wallet payment',
    icon: Smartphone
  }
};

const methodOrder = ['cash_on_delivery', 'bank_transfer', 'mobile_banking'];
const paymentSystemOrder = ['bank_transfer', 'mobile_banking'];

const emptyMethod = {
  enabled: true,
  label: '',
  accountName: '',
  accountNumber: '',
  bankName: '',
  district: '',
  branchName: '',
  routingNumber: '',
  providerName: '',
  paymentType: '',
  instructions: ''
};

const normalizeForm = (settings) => ({
  methods: Object.fromEntries(
    methodOrder.map((key) => [
      key,
      {
        ...emptyMethod,
        ...(settings?.methods?.[key] || {})
      }
    ])
  )
});

const paymentSystemFields = (key, method = {}) => {
  if (key === 'bank_transfer') {
    return [
      ['Bank', method.bankName],
      ['District', method.district],
      ['Branch', method.branchName],
      ['Account name', method.accountName],
      ['Account number', method.accountNumber],
      ['Routing number', method.routingNumber]
    ].filter(([, value]) => value);
  }

  return [
    ['Provider', method.providerName],
    ['Payment type', method.paymentType],
    ['Account name', method.accountName],
    ['Wallet number', method.accountNumber]
  ].filter(([, value]) => value);
};

const paymentSystemTitle = (key, method = {}) => {
  if (key === 'bank_transfer') return method.bankName || method.label || methodMeta[key].title;
  return method.providerName || method.label || methodMeta[key].title;
};

export const AdminPaymentMethodsPage = () => {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      const { data } = await api.get('/admin/payment-methods');
      return data.data;
    }
  });

  useEffect(() => {
    if (settings) setForm(normalizeForm(settings));
  }, [settings]);

  const updateMethod = (key, patch) => {
    setForm((current) => ({
      ...current,
      methods: {
        ...current.methods,
        [key]: {
          ...current.methods[key],
          ...patch
        }
      }
    }));
  };

  const editPaymentSystem = (key) => {
    const section = document.getElementById(`payment-method-${key}`);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      section.querySelector('input:not([type="checkbox"]), textarea')?.focus({ preventScroll: true });
    }, 250);
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    try {
      const { data } = await api.patch('/admin/payment-methods', form);
      setMessage({ text: data.message || 'Payment methods saved', type: 'success' });
      queryClient.setQueryData(['admin-payment-methods'], data.data);
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    } catch (error) {
      setMessage({ text: apiErrorMessage(error), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Payment Methods" noIndex />
        <AdminNav />
        <AdminLoadingState label="Loading payment methods" />
      </section>
    );
  }

  if (isError || !form) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Payment Methods" noIndex />
        <AdminNav />
        <div className="panel">
          <p className="form-error">
            <AlertTriangle size={16} />
            {apiErrorMessage(error)}
          </p>
        </div>
      </section>
    );
  }

  const configuredPaymentSystems = paymentSystemOrder
    .map((key) => {
      const method = form.methods[key];
      return {
        key,
        method,
        fields: paymentSystemFields(key, method),
        meta: methodMeta[key],
        title: paymentSystemTitle(key, method)
      };
    })
    .filter((system) => system.fields.length > 0);

  return (
    <section className="admin-page section">
      <Seo title="Admin Payment Methods" noIndex />
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Manual payments</p>
          <h1>Payment methods</h1>
        </div>
        <div className="toolbar-actions">
          {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
          <button className="button primary" type="submit" form="payment-methods-form" disabled={saving}>
            <Save size={17} />
            {saving ? 'Saving...' : 'Save methods'}
          </button>
        </div>
      </div>

      {message.text ? (
        <p className={message.type === 'error' ? 'form-error admin-currency-message' : 'form-note admin-currency-message'}>
          {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {message.text}
        </p>
      ) : null}

      <section className="panel saved-payment-systems-panel">
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Saved systems</p>
            <h2>Bank and mobile accounts</h2>
          </div>
          <span>{configuredPaymentSystems.length} added</span>
        </div>

        {configuredPaymentSystems.length ? (
          <div className="saved-payment-system-list">
            {configuredPaymentSystems.map((system) => {
              const Icon = system.meta.icon;

              return (
                <article className="saved-payment-system-row" key={system.key}>
                  <span className="saved-payment-system-icon">
                    <Icon size={21} />
                  </span>
                  <div className="saved-payment-system-content">
                    <div className="saved-payment-system-heading">
                      <h3>{system.title}</h3>
                      <span className={system.method.enabled ? 'status-pill active' : 'status-pill blocked'}>
                        {system.method.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span>{system.meta.title}</span>
                    </div>
                    <dl className="saved-payment-system-fields">
                      {system.fields.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <button className="button compact" type="button" onClick={() => editPaymentSystem(system.key)}>
                    <Pencil size={15} />
                    Edit
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="saved-payment-system-empty">
            <div>
              <strong>No bank or mobile banking system has been added yet.</strong>
              <span>Add account details below to show them here.</span>
            </div>
            <div className="saved-payment-system-empty-actions">
              <button className="button compact" type="button" onClick={() => editPaymentSystem('bank_transfer')}>
                <Plus size={15} />
                Add bank
              </button>
              <button className="button compact" type="button" onClick={() => editPaymentSystem('mobile_banking')}>
                <Plus size={15} />
                Add mobile
              </button>
            </div>
          </div>
        )}
      </section>

      <form id="payment-methods-form" className="admin-payment-method-layout" onSubmit={saveSettings}>
        {methodOrder.map((key) => {
          const method = form.methods[key];
          const meta = methodMeta[key];
          const Icon = meta.icon;

          return (
            <article className="panel admin-payment-method-card" id={`payment-method-${key}`} key={key}>
              <div className="editor-card-heading">
                <div>
                  <p className="eyebrow">{meta.eyebrow}</p>
                  <h2>{meta.title}</h2>
                </div>
                <Icon size={22} />
              </div>

              <label className="checkbox-row currency-toggle-row">
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={(event) => updateMethod(key, { enabled: event.target.checked })}
                />
                Enable this payment method at checkout
              </label>

              <div className="payment-method-settings-grid">
                <label>
                  Checkout label
                  <input value={method.label} onChange={(event) => updateMethod(key, { label: event.target.value })} />
                </label>

                {key === 'bank_transfer' ? (
                  <>
                    <label>
                      Bank name
                      <input value={method.bankName} onChange={(event) => updateMethod(key, { bankName: event.target.value })} />
                    </label>
                    <label>
                      District
                      <input value={method.district} onChange={(event) => updateMethod(key, { district: event.target.value })} />
                    </label>
                    <label>
                      Branch
                      <input value={method.branchName} onChange={(event) => updateMethod(key, { branchName: event.target.value })} />
                    </label>
                    <label>
                      Routing number
                      <input value={method.routingNumber} onChange={(event) => updateMethod(key, { routingNumber: event.target.value })} />
                    </label>
                  </>
                ) : null}

                {key === 'mobile_banking' ? (
                  <>
                    <label>
                      Provider
                      <input value={method.providerName} onChange={(event) => updateMethod(key, { providerName: event.target.value })} placeholder="bKash, Nagad, Rocket..." />
                    </label>
                    <label>
                      Payment type
                      <input value={method.paymentType} onChange={(event) => updateMethod(key, { paymentType: event.target.value })} placeholder="Personal, merchant, agent..." />
                    </label>
                  </>
                ) : null}

                {key !== 'cash_on_delivery' ? (
                  <>
                    <label>
                      Account name
                      <input value={method.accountName} onChange={(event) => updateMethod(key, { accountName: event.target.value })} />
                    </label>
                    <label>
                      Account or wallet number
                      <input value={method.accountNumber} onChange={(event) => updateMethod(key, { accountNumber: event.target.value })} />
                    </label>
                  </>
                ) : null}

                <label className="span-2">
                  Customer instructions
                  <textarea value={method.instructions} onChange={(event) => updateMethod(key, { instructions: event.target.value })} />
                </label>
              </div>
            </article>
          );
        })}
      </form>
    </section>
  );
};

import { AlertTriangle, CheckCircle2, Globe2, RefreshCw, Save } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage } from '../services/api.js';
import { dateShort, money } from '../utils/format.js';

const toCurrencyForm = (settings) => ({
  autoDetect: settings?.autoDetect !== false,
  autoUpdateRates: settings?.autoUpdateRates !== false,
  fallbackCurrency: settings?.fallbackCurrency || 'BDT',
  currencies: (settings?.currencies || []).map((currency) => ({
    ...currency,
    bdtPerUnit: String(currency.bdtPerUnit ?? 1),
    enabled: currency.enabled !== false,
    manualRate: Boolean(currency.manualRate)
  }))
});

export const AdminCurrencyPage = () => {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { refreshCurrency } = useCurrency();

  const { data: settings, isLoading, isFetching } = useQuery({
    queryKey: ['admin-currency'],
    queryFn: async () => {
      const { data } = await api.get('/admin/currency');
      return data.data;
    }
  });

  useEffect(() => {
    if (settings) setForm(toCurrencyForm(settings));
  }, [settings]);

  const enabledCurrencies = useMemo(
    () => form?.currencies?.filter((currency) => currency.enabled) || [],
    [form]
  );

  const updateCurrency = (code, patch) => {
    setForm((current) => ({
      ...current,
      currencies: current.currencies.map((currency) =>
        currency.code === code ? { ...currency, ...patch } : currency
      )
    }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    try {
      const payload = {
        autoDetect: form.autoDetect,
        autoUpdateRates: form.autoUpdateRates,
        fallbackCurrency: form.fallbackCurrency,
        currencies: form.currencies.map((currency) => ({
          code: currency.code,
          enabled: currency.enabled,
          manualRate: currency.code === 'BDT' ? false : currency.manualRate,
          bdtPerUnit: Number(currency.bdtPerUnit || 1)
        }))
      };

      const { data } = await api.patch('/admin/currency', payload);
      setMessage({ text: data.message || 'Currency settings saved', type: 'success' });
      queryClient.setQueryData(['admin-currency'], data.data);
      await refreshCurrency();
    } catch (error) {
      setMessage({ text: apiErrorMessage(error), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const refreshRates = async () => {
    setRefreshing(true);
    setMessage({ text: '', type: 'success' });

    try {
      const { data } = await api.post('/admin/currency/refresh');
      setMessage({ text: data.message || 'Currency rates refreshed', type: 'success' });
      queryClient.setQueryData(['admin-currency'], data.data);
      await refreshCurrency();
    } catch (error) {
      setMessage({ text: apiErrorMessage(error), type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading || !form) {
    return (
      <section className="admin-page section">
        <AdminNav />
        <AdminLoadingState label="Loading currency controls" />
      </section>
    );
  }

  return (
    <section className="admin-page section">
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">International pricing</p>
          <h1>Currency controls</h1>
        </div>
        <div className="toolbar-actions">
          {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
          <button className="button dark" type="button" onClick={refreshRates} disabled={refreshing || saving}>
            <RefreshCw size={17} />
            {refreshing ? 'Refreshing...' : 'Refresh rates'}
          </button>
          <button className="button primary" type="submit" form="currency-settings-form" disabled={saving || refreshing}>
            <Save size={17} />
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>

      {message.text ? (
        <p className={message.type === 'error' ? 'form-error admin-currency-message' : 'form-note admin-currency-message'}>
          {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {message.text}
        </p>
      ) : null}

      <form id="currency-settings-form" className="admin-currency-layout" onSubmit={saveSettings}>
        <div className="panel admin-currency-card">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Behavior</p>
              <h2>Automatic customer currency</h2>
            </div>
            <Globe2 size={22} />
          </div>

          <div className="currency-control-grid">
            <label className="checkbox-row currency-toggle-row">
              <input
                type="checkbox"
                checked={form.autoDetect}
                onChange={(event) => setForm((current) => ({ ...current, autoDetect: event.target.checked }))}
              />
              Detect customer country and choose currency automatically
            </label>
            <label className="checkbox-row currency-toggle-row">
              <input
                type="checkbox"
                checked={form.autoUpdateRates}
                onChange={(event) => setForm((current) => ({ ...current, autoUpdateRates: event.target.checked }))}
              />
              Refresh non-manual exchange rates automatically
            </label>
            <label>
              Fallback currency
              <select
                value={form.fallbackCurrency}
                onChange={(event) => setForm((current) => ({ ...current, fallbackCurrency: event.target.value }))}
              >
                {enabledCurrencies.map((currency) => (
                  <option value={currency.code} key={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <aside className="panel admin-currency-card currency-rate-summary">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Base currency</p>
              <h2>BDT remains canonical</h2>
            </div>
          </div>
          <p>
            Product prices, inventory values, coupons, and order accounting are stored in BDT.
            Customer-facing storefront prices are converted from that base value at display time.
          </p>
          <div className="currency-provider-meta">
            <span>Provider</span>
            <strong>{settings.rateProvider?.name || 'Manual rates'}</strong>
            <span>Last refresh</span>
            <strong>{dateShort(settings.rateProvider?.lastFetchedAt) || 'Not refreshed yet'}</strong>
            <span>Next automatic refresh</span>
            <strong>{dateShort(settings.rateProvider?.nextFetchAt) || 'After first refresh'}</strong>
          </div>
          {settings.rateProvider?.lastError ? <p className="form-error">{settings.rateProvider.lastError}</p> : null}
        </aside>

        <div className="panel admin-currency-card span-2">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Rates</p>
              <h2>International display prices</h2>
            </div>
            <span>{enabledCurrencies.length} active</span>
          </div>

          <div className="currency-rate-table">
            <div className="currency-rate-head">
              <span>Currency</span>
              <span>Enabled</span>
              <span>BDT per 1 unit</span>
              <span>Source</span>
              <span>Example</span>
            </div>

            {form.currencies.map((currency) => {
              const bdtPerUnit = Number(currency.bdtPerUnit || 1);
              const example = bdtPerUnit > 0 ? 25000 / bdtPerUnit : 0;

              return (
                <article className="currency-rate-row" key={currency.code}>
                  <div className="currency-rate-name">
                    <strong>{currency.code}</strong>
                    <span>{currency.name}</span>
                  </div>
                  <label className="currency-enable">
                    <input
                      type="checkbox"
                      checked={currency.enabled}
                      disabled={currency.code === 'BDT'}
                      onChange={(event) => updateCurrency(currency.code, { enabled: event.target.checked })}
                    />
                    <span>{currency.enabled ? 'On' : 'Off'}</span>
                  </label>
                  <label className="currency-rate-input">
                    <input
                      type="number"
                      min="0.000001"
                      step="0.0001"
                      value={currency.bdtPerUnit}
                      disabled={currency.code === 'BDT'}
                      onChange={(event) =>
                        updateCurrency(currency.code, {
                          bdtPerUnit: event.target.value,
                          manualRate: true,
                          source: 'manual'
                        })
                      }
                    />
                  </label>
                  <label className="currency-source-toggle">
                    <input
                      type="checkbox"
                      checked={currency.manualRate}
                      disabled={currency.code === 'BDT'}
                      onChange={(event) => updateCurrency(currency.code, { manualRate: event.target.checked })}
                    />
                    <span>{currency.code === 'BDT' ? 'Base' : currency.manualRate ? 'Manual' : currency.source === 'api' ? 'API' : 'Fallback'}</span>
                  </label>
                  <strong className="currency-rate-example">
                    {currency.code === 'BDT'
                      ? money(25000)
                      : new Intl.NumberFormat(currency.locale || 'en-US', {
                          style: 'currency',
                          currency: currency.code,
                          currencyDisplay: 'narrowSymbol',
                          maximumFractionDigits: 2
                        }).format(example)}
                  </strong>
                </article>
              );
            })}
          </div>
        </div>
      </form>
    </section>
  );
};

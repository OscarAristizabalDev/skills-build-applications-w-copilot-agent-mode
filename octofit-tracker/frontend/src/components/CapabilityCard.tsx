import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, dataKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);

    getJson<Record<string, T[]>>(endpoint)
      .then((data) => {
        const records = data[dataKey];
        if (!Array.isArray(records)) throw new Error('The server returned an invalid response');
        if (active) setItems(records);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [endpoint, dataKey]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {loading ? <p role="status">Loading {title.toLowerCase()}...</p>
      : error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        : items.length === 0 ? <p>{emptyMessage}</p>
          : <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}

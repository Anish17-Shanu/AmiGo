import { useState } from "react";
import api, { apiErrorMessage } from "../../api/client";

const InsightsPanel = ({ products }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: response } = await api.get("/admin/advanced-analytics");
      setData(response);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not run analytics"));
    } finally {
      setLoading(false);
    }
  };

  const productById = new Map(products.map((product) => [product._id, product]));
  const recommendations = data?.recommendations?.recommendations || [];
  const segments = data?.segments?.segments || [];
  const segmentCounts = segments.reduce((counts, segment) => {
    const key = segment.segment;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return (
    <section className="card-glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold">ML insights</h2>
          <p className="text-xs text-slate-500">Recommendations and K-Means customer segments.</p>
        </div>
        <button type="button" onClick={run} disabled={loading} className="btn-primary">
          {loading ? "Running..." : "Run insights"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Run the analytics service to generate product recommendations and customer segments.
        </p>
      )}

      {data && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Recommended products
            </h3>
            {recommendations.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {recommendations.slice(0, 5).map((entry) => (
                  <li key={entry.product_id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-700">
                      {productById.get(entry.product_id)?.title || entry.product_id}
                    </span>
                    <span className="text-xs text-slate-500">{Number(entry.score).toFixed(3)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No recommendations yet.</p>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Customer segments
            </h3>
            {Object.keys(segmentCounts).length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(segmentCounts).map(([segment, count]) => (
                  <li key={segment} className="flex items-center justify-between gap-2">
                    <span className="text-slate-700">Segment {segment}</span>
                    <span className="text-xs text-slate-500">{count} customer(s)</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No segments yet. Orders from at least two customers are required.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default InsightsPanel;

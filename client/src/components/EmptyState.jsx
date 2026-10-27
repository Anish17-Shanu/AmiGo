const EmptyState = ({ title, description, action }) => (
  <div className="card-glass rounded-2xl p-8 text-center">
    <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
    {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;

import { useSocketFeed } from "../../context/SocketContext";

const LiveFeed = () => {
  const feed = useSocketFeed();
  const liveEvents = feed?.liveEvents || [];
  const clearEvents = feed?.clearEvents || (() => {});

  return (
    <section className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Live event stream</h2>
        {!!liveEvents.length && (
          <button type="button" onClick={clearEvents} className="btn-secondary px-3 py-1.5">
            Clear
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Admin-only events. Order, sales, and user activity events are scoped to admin sessions.
      </p>

      <div className="mt-4 max-h-80 space-y-2 overflow-auto">
        {liveEvents.map((event) => (
          <div key={event.id} className="rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <strong className="uppercase tracking-wide text-tide">{event.type}</strong>
              <span className="text-xs text-slate-500">
                {new Date(event.ts).toLocaleTimeString()}
              </span>
            </div>
            <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-600">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        ))}

        {!liveEvents.length && (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            No live events yet. Place a test order to see the stream update in real time.
          </p>
        )}
      </div>
    </section>
  );
};

export default LiveFeed;

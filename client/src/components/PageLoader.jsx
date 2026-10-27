const PageLoader = ({ label = "Loading..." }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
    <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-tide" />
    <span className="text-sm font-semibold">{label}</span>
  </div>
);

export default PageLoader;

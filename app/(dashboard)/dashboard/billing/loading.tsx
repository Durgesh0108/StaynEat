export default function Loading() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse" />
      <div className="card p-5 h-32 animate-pulse bg-gray-100 dark:bg-gray-800" />
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((i) => <div key={i} className="card p-5 h-64 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
      </div>
    </div>
  );
}

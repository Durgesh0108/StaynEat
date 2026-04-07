export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="card p-4 h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
      </div>
      <div className="card p-5 h-80 animate-pulse bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

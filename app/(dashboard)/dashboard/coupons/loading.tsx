export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
      {[1, 2, 3].map((i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
    </div>
  );
}

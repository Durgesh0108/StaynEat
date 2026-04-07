"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Copy, ChevronDown, ChevronRight, Globe } from "lucide-react";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  params?: { name: string; type: string; description: string }[];
  response?: string;
}

const METHOD_COLORS = {
  GET: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DELETE: "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400",
};

function EndpointCard({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) {
  const [open, setOpen] = useState(false);
  const fullPath = `${baseUrl}${endpoint.path}`;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className={`badge font-mono text-xs shrink-0 ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1 truncate">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">🔑 Auth</span>
        )}
        {open ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-sm text-gray-600 dark:text-gray-300">{endpoint.description}</p>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-900 dark:bg-gray-950 text-green-400 px-3 py-2 rounded-lg overflow-x-auto">
              {endpoint.method} {fullPath}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(`${endpoint.method} ${fullPath}`); toast.success("Copied!"); }}
              className="btn-secondary text-xs px-2 py-1.5 shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Parameters</p>
              <div className="space-y-1">
                {endpoint.params.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 text-xs">
                    <code className="text-primary-600 dark:text-primary-400 font-mono shrink-0">{p.name}</code>
                    <span className="text-gray-400 shrink-0">{p.type}</span>
                    <span className="text-gray-500">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.response && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Response</p>
              <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-lg overflow-x-auto">
                {endpoint.response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ApiDocsClient({ slug, apiKey }: { slug: string; apiKey: string }) {
  const baseUrl = `/api/v1/business/${slug}`;

  const endpoints: { section: string; items: Endpoint[] }[] = [
    {
      section: "Business",
      items: [
        {
          method: "GET",
          path: `/api/v1/business/${slug}`,
          description: "Get business profile, settings, and public information.",
          auth: false,
          response: JSON.stringify({ id: "...", name: "...", slug: "...", type: "HOTEL", city: "..." }, null, 2),
        },
      ],
    },
    {
      section: "Rooms",
      items: [
        {
          method: "GET",
          path: `/api/v1/business/${slug}/rooms`,
          description: "List all available rooms with pricing and amenities.",
          auth: false,
          params: [
            { name: "checkIn", type: "string", description: "Check-in date (YYYY-MM-DD)" },
            { name: "checkOut", type: "string", description: "Check-out date (YYYY-MM-DD)" },
          ],
          response: JSON.stringify([{ id: "...", name: "Deluxe Suite", type: "DELUXE", pricePerNight: 2500, available: true }], null, 2),
        },
      ],
    },
    {
      section: "Menu",
      items: [
        {
          method: "GET",
          path: `/api/v1/business/${slug}/menu`,
          description: "Get the full menu with categories and items.",
          auth: false,
          params: [
            { name: "category", type: "string", description: "Filter by category name" },
            { name: "isVeg", type: "boolean", description: "Filter vegetarian items" },
          ],
          response: JSON.stringify([{ id: "...", name: "Butter Chicken", category: "MAIN_COURSE", price: 350, isVeg: false }], null, 2),
        },
      ],
    },
    {
      section: "Bookings",
      items: [
        {
          method: "GET",
          path: `/api/v1/business/${slug}/bookings`,
          description: "List bookings for your business. Requires API key authentication.",
          auth: true,
          params: [
            { name: "status", type: "string", description: "Filter by status (CONFIRMED, CHECKED_IN, etc.)" },
            { name: "from", type: "string", description: "Start date filter (YYYY-MM-DD)" },
            { name: "to", type: "string", description: "End date filter (YYYY-MM-DD)" },
            { name: "page", type: "number", description: "Page number (default: 1)" },
            { name: "limit", type: "number", description: "Items per page (default: 20, max: 100)" },
          ],
          response: JSON.stringify({ data: [], pagination: { page: 1, limit: 20, total: 0 } }, null, 2),
        },
        {
          method: "POST",
          path: `/api/v1/business/${slug}/bookings`,
          description: "Create a new room booking. Requires API key.",
          auth: true,
          params: [
            { name: "roomId", type: "string", description: "Room ID to book" },
            { name: "guestName", type: "string", description: "Guest full name" },
            { name: "guestEmail", type: "string", description: "Guest email" },
            { name: "guestPhone", type: "string", description: "Guest phone" },
            { name: "checkInDate", type: "string", description: "Check-in date (YYYY-MM-DD)" },
            { name: "checkOutDate", type: "string", description: "Check-out date (YYYY-MM-DD)" },
            { name: "adults", type: "number", description: "Number of adults" },
          ],
          response: JSON.stringify({ id: "...", status: "PENDING", totalAmount: 5000, razorpayOrderId: "..." }, null, 2),
        },
      ],
    },
    {
      section: "Orders",
      items: [
        {
          method: "GET",
          path: `/api/v1/business/${slug}/orders`,
          description: "List food orders. Requires API key authentication.",
          auth: true,
          params: [
            { name: "status", type: "string", description: "Filter by status" },
            { name: "type", type: "string", description: "DINE_IN or TAKEAWAY or DELIVERY" },
            { name: "page", type: "number", description: "Page number" },
          ],
          response: JSON.stringify({ data: [], pagination: { page: 1, total: 0 } }, null, 2),
        },
        {
          method: "POST",
          path: `/api/v1/business/${slug}/orders`,
          description: "Place a food order.",
          auth: false,
          params: [
            { name: "tableId", type: "string", description: "Table ID (for dine-in)" },
            { name: "items", type: "array", description: "Array of {menuItemId, quantity}" },
            { name: "customerName", type: "string", description: "Customer name" },
            { name: "type", type: "string", description: "DINE_IN | TAKEAWAY | DELIVERY" },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Auth */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Authentication</h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
          Public endpoints require no authentication. Protected endpoints require your API key in the header:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-900 dark:bg-gray-950 text-green-400 px-3 py-2 rounded-lg overflow-x-auto">
            X-API-Key: {apiKey || "your_api_key_here"}
          </code>
          {apiKey && (
            <button
              onClick={() => { navigator.clipboard.writeText(`X-API-Key: ${apiKey}`); toast.success("Copied!"); }}
              className="btn-secondary text-xs px-2 py-1.5 shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {!apiKey && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Generate an API key from Settings → API Key tab.
          </p>
        )}
      </div>

      {/* Base URL */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-semibold">Base URL:</span>{" "}
          <code className="font-mono">{process.env.NEXT_PUBLIC_APP_URL ?? "https://yourapp.com"}</code>
        </p>
      </div>

      {/* Endpoints */}
      {endpoints.map((section) => (
        <div key={section.section}>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">{section.section}</h3>
          <div className="space-y-2">
            {section.items.map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} baseUrl="" />
            ))}
          </div>
        </div>
      ))}

      {/* Rate Limits */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Rate Limits</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Public endpoints: 100 requests/minute per IP</p>
          <p>• Authenticated endpoints: 1000 requests/minute per API key</p>
          <p>• Rate limit headers: <code className="font-mono">X-RateLimit-Remaining</code>, <code className="font-mono">X-RateLimit-Reset</code></p>
        </div>
      </div>
    </div>
  );
}

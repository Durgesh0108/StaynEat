import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MenuItem, CartItem } from "@/types";

interface CartStore {
  businessId: string | null;
  businessSlug: string | null;
  tableId: string | null;
  tableNumber: string | null;
  roomId: string | null;
  roomNumber: string | null;
  sessionId: string | null;
  items: CartItem[];
  couponCode: string | null;
  discount: number;

  // Actions
  setTable: (tableId: string, tableNumber: string) => void;
  setRoom: (roomId: string, roomNumber: string) => void;
  setBusiness: (businessId: string, slug: string) => void;
  initSession: () => string;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearItems: () => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // Computed
  getSubtotal: () => number;
  getTaxAmount: (taxPercentage?: number) => number;
  getTotal: (taxPercentage?: number) => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      businessId: null,
      businessSlug: null,
      tableId: null,
      tableNumber: null,
      roomId: null,
      roomNumber: null,
      sessionId: null,
      items: [],
      couponCode: null,
      discount: 0,

      setTable: (tableId, tableNumber) => {
        const state = get();
        if (state.tableId !== tableId) {
          // Different table — fresh session and fresh cart
          set({ tableId, tableNumber, roomId: null, roomNumber: null, sessionId: crypto.randomUUID(), items: [], couponCode: null, discount: 0 });
        } else {
          set({ tableId, tableNumber, roomId: null, roomNumber: null });
        }
      },

      setRoom: (roomId, roomNumber) => {
        const state = get();
        if (state.roomId !== roomId) {
          set({ roomId, roomNumber, tableId: null, tableNumber: null, sessionId: crypto.randomUUID(), items: [], couponCode: null, discount: 0 });
        } else {
          set({ roomId, roomNumber, tableId: null, tableNumber: null });
        }
      },

      setBusiness: (businessId, slug) => set({ businessId, businessSlug: slug }),

      initSession: () => {
        const existing = get().sessionId;
        if (existing) return existing;
        const id = crypto.randomUUID();
        set({ sessionId: id });
        return id;
      },

      addItem: (menuItem, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.menuItem.id === menuItem.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({ items: [...items, { menuItem, quantity }] });
        }
      },

      removeItem: (menuItemId) => {
        set({ items: get().items.filter((i) => i.menuItem.id !== menuItemId) });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) { get().removeItem(menuItemId); return; }
        set({ items: get().items.map((i) => i.menuItem.id === menuItemId ? { ...i, quantity } : i) });
      },

      clearItems: () => set({ items: [], couponCode: null, discount: 0 }),

      clearCart: () =>
        set({ items: [], tableId: null, tableNumber: null, roomId: null, roomNumber: null, sessionId: null, couponCode: null, discount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, discount }),
      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
      getTaxAmount: (taxPercentage = 18) => (get().getSubtotal() * taxPercentage) / 100,
      getTotal: (taxPercentage = 18) => Math.max(0, get().getSubtotal() + get().getTaxAmount(taxPercentage) - get().discount),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "hospitpro-cart",
      // sessionStorage is tab-isolated — each browser tab has its own cart
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
);

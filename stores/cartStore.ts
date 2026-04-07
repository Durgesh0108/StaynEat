import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MenuItem, CartItem } from "@/types";

interface CartStore {
  businessId: string | null;
  businessSlug: string | null;
  tableId: string | null;
  tableNumber: string | null;
  roomId: string | null;
  roomNumber: string | null;
  items: CartItem[];
  couponCode: string | null;
  discount: number;

  // Actions
  setTable: (tableId: string, tableNumber: string) => void;
  setRoom: (roomId: string, roomNumber: string) => void;
  setBusiness: (businessId: string, slug: string) => void;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
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
      items: [],
      couponCode: null,
      discount: 0,

      setTable: (tableId, tableNumber) => set({ tableId, tableNumber, roomId: null, roomNumber: null }),

      setRoom: (roomId, roomNumber) => set({ roomId, roomNumber, tableId: null, tableNumber: null }),

      setBusiness: (businessId, slug) => set({ businessId, businessSlug: slug }),

      addItem: (menuItem, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.menuItem.id === menuItem.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.menuItem.id === menuItem.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
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
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () =>
        set({
          items: [],
          tableId: null,
          tableNumber: null,
          roomId: null,
          roomNumber: null,
          couponCode: null,
          discount: 0,
        }),

      applyCoupon: (code, discount) => set({ couponCode: code, discount }),

      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        ),

      getTaxAmount: (taxPercentage = 18) => {
        const subtotal = get().getSubtotal();
        return (subtotal * taxPercentage) / 100;
      },

      getTotal: (taxPercentage = 18) => {
        const subtotal = get().getSubtotal();
        const tax = get().getTaxAmount(taxPercentage);
        const discount = get().discount;
        return Math.max(0, subtotal + tax - discount);
      },

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "hospitpro-cart",
      partialize: (state) => ({
        businessId: state.businessId,
        businessSlug: state.businessSlug,
        tableId: state.tableId,
        tableNumber: state.tableNumber,
        roomId: state.roomId,
        roomNumber: state.roomNumber,
        items: state.items,
        couponCode: state.couponCode,
        discount: state.discount,
      }),
    }
  )
);

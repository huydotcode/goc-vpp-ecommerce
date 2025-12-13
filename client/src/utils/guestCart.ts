const GUEST_CART_KEY = "guest_cart";

export interface GuestCartItem {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  productImageUrl?: string | null;
}

export const buildGuestCartItemId = (
  productId: number,
  variantId: number | null | undefined
): number => {
  const normalizedVariant = variantId ?? 0;
  const hash = productId * 100000 + normalizedVariant;
  return -Math.abs(hash);
};

export const loadGuestCart = (): GuestCartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load guest cart", error);
    return [];
  }
};

const persistGuestCart = (items: GuestCartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const upsertGuestItem = (
  payload: Omit<GuestCartItem, "id"> & Partial<Pick<GuestCartItem, "id">>
): GuestCartItem[] => {
  const items = loadGuestCart();
  const id =
    payload.id ??
    buildGuestCartItemId(payload.productId, payload.variantId ?? null);

  const existingIndex = items.findIndex((it) => it.id === id);
  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const merged: GuestCartItem = {
      ...existing,
      ...payload,
      id,
      quantity: existing.quantity + payload.quantity,
    };
    items[existingIndex] = merged;
  } else {
    items.push({ ...payload, id });
  }
  persistGuestCart(items);
  return items;
};

export const updateGuestItemQuantity = (
  id: number,
  quantity: number
): GuestCartItem[] => {
  const items = loadGuestCart();
  const idx = items.findIndex((it) => it.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], quantity };
    persistGuestCart(items);
  }
  return items;
};

export const removeGuestItem = (id: number): GuestCartItem[] => {
  const items = loadGuestCart().filter((it) => it.id !== id);
  persistGuestCart(items);
  return items;
};

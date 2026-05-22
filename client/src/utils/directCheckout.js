const DIRECT_CHECKOUT_KEY = 'lahventure:direct-checkout';
const DIRECT_CHECKOUT_TTL = 30 * 60 * 1000;

export const directCheckoutUrl = '/checkout?mode=buy-now';

export const startDirectCheckout = ({ productId, quantity = 1, variant }) => {
  if (!productId || typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    DIRECT_CHECKOUT_KEY,
    JSON.stringify({
      productId,
      quantity: Math.max(1, Number(quantity) || 1),
      variant: variant || undefined,
      createdAt: Date.now()
    })
  );
};

export const readDirectCheckout = () => {
  if (typeof window === 'undefined') return null;

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(DIRECT_CHECKOUT_KEY) || 'null');
    if (!parsed?.productId || Date.now() - (parsed.createdAt || 0) > DIRECT_CHECKOUT_TTL) {
      window.sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
      return null;
    }

    return {
      productId: parsed.productId,
      quantity: Math.max(1, Number(parsed.quantity) || 1),
      variant: parsed.variant || undefined
    };
  } catch {
    window.sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
    return null;
  }
};

export const clearDirectCheckout = () => {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
};

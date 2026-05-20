import { Cart } from '../models/cart.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const normalizeVariant = (value = {}) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
};

const sameVariant = (left = {}, right = {}) =>
  JSON.stringify(normalizeVariant(left)) === JSON.stringify(normalizeVariant(right));

const publicCart = async (cart) => {
  await cart.populate('items.product', 'slug inventory status');
  return cart;
};

const refreshCoupon = async (cart) => {
  if (!cart.coupon?.code) {
    cart.recalculateTotals();
    return;
  }

  const coupon = await Coupon.findOne({ code: cart.coupon.code });
  cart.recalculateTotals();

  if (!coupon || !coupon.isUsableFor(cart.totals.subtotal)) {
    cart.coupon = undefined;
    cart.recalculateTotals();
    return;
  }

  cart.coupon.discountAmount = coupon.calculateDiscount(cart.totals.subtotal);
  cart.recalculateTotals();
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  res.json({
    status: 'success',
    data: {
      cart: await publicCart(cart)
    }
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body;
  const product = await Product.findOne({ _id: productId, status: 'active' });

  if (!product) throw new ApiError(404, 'Product not found');

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId && sameVariant(item.variant, variant)
  );
  const nextQuantity = (existingItem?.quantity || 0) + quantity;

  if (product.inventory.trackQuantity && nextQuantity > product.inventory.stock) {
    throw new ApiError(409, `Only ${product.inventory.stock} item(s) available`);
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url,
      price: product.price,
      quantity,
      variant
    });
  }

  await refreshCoupon(cart);
  await cart.save();

  res.status(201).json({
    status: 'success',
    data: {
      cart: await publicCart(cart)
    }
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.id);

  if (!item) throw new ApiError(404, 'Cart item not found');

  if (req.body.quantity === 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.product);
    if (!product || product.status !== 'active') throw new ApiError(404, 'Product not found');
    if (product.inventory.trackQuantity && req.body.quantity > product.inventory.stock) {
      throw new ApiError(409, `Only ${product.inventory.stock} item(s) available`);
    }
    item.quantity = req.body.quantity;
    item.price = product.price;
    item.name = product.name;
    item.image = product.images[0]?.url;
  }

  await refreshCoupon(cart);
  await cart.save();

  res.json({
    status: 'success',
    data: {
      cart: await publicCart(cart)
    }
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.id);

  if (!item) throw new ApiError(404, 'Cart item not found');

  item.deleteOne();
  await refreshCoupon(cart);
  await cart.save();

  res.json({
    status: 'success',
    data: {
      cart: await publicCart(cart)
    }
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.coupon = undefined;
  await cart.save();

  res.json({
    status: 'success',
    data: {
      cart
    }
  });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  if (!cart.items.length) throw new ApiError(400, 'Add items to cart before applying a coupon');

  cart.recalculateTotals();
  const coupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });

  if (!coupon || !coupon.isUsableFor(cart.totals.subtotal)) {
    throw new ApiError(400, 'Coupon is invalid, expired, or does not meet cart requirements');
  }

  cart.coupon = {
    code: coupon.code,
    discountType: coupon.discountType,
    value: coupon.value,
    discountAmount: coupon.calculateDiscount(cart.totals.subtotal)
  };
  await cart.save();

  res.json({
    status: 'success',
    data: {
      cart: await publicCart(cart)
    }
  });
});

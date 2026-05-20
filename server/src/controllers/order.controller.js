import { Cart } from '../models/cart.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitOrderEvent } from '../sockets/socket.js';

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 100;
const STANDARD_SHIPPING = 8.99;

const money = (value) => Math.round(value * 100) / 100;

export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || !cart.items.length) throw new ApiError(400, 'Your cart is empty');

  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());
    if (!product) throw new ApiError(404, `Product unavailable: ${item.name}`);
    if (product.inventory.trackQuantity && item.quantity > product.inventory.stock) {
      throw new ApiError(409, `Only ${product.inventory.stock} ${product.name} available`);
    }

    return {
      product: product._id,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.url,
      price: product.price,
      quantity: item.quantity,
      variant: item.variant
    };
  });

  const subtotal = money(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  let discount = 0;
  let couponSnapshot;

  if (cart.coupon?.code) {
    const coupon = await Coupon.findOne({ code: cart.coupon.code });
    if (coupon?.isUsableFor(subtotal)) {
      discount = coupon.calculateDiscount(subtotal);
      couponSnapshot = { code: coupon.code, discountAmount: discount };
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = money(discountedSubtotal * TAX_RATE);
  const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = money(discountedSubtotal + tax + shipping);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress: req.body.shippingAddress,
    billingAddress: req.body.billingAddress || req.body.shippingAddress,
    payment: {
      method: req.body.paymentMethod,
      status: req.body.paymentMethod === 'cash_on_delivery' ? 'pending' : 'authorized',
      amount: total
    },
    pricing: {
      subtotal,
      discount,
      tax,
      shipping,
      total
    },
    coupon: couponSnapshot,
    customerNote: req.body.customerNote
  });

  await Promise.all(
    orderItems.map((item) => {
      const product = productMap.get(item.product.toString());
      const increment = { salesCount: item.quantity };
      if (product.inventory.trackQuantity) increment['inventory.stock'] = -item.quantity;

      return Product.updateOne({ _id: item.product }, { $inc: increment });
    })
  );

  cart.items = [];
  cart.coupon = undefined;
  await cart.save();

  emitOrderEvent('order:created', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    user: req.user._id.toString()
  });

  res.status(201).json({
    status: 'success',
    data: { order }
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');

  res.json({
    status: 'success',
    data: { orders }
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.user = req.user._id;

  const order = await Order.findOne(filter).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  res.json({
    status: 'success',
    data: { order }
  });
});

export const getOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter)
  ]);

  res.json({
    status: 'success',
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.status = req.body.status;
  if (req.body.paymentStatus) order.payment.status = req.body.paymentStatus;
  if (req.body.status === 'delivered' && !order.deliveredAt) order.deliveredAt = new Date();
  order.timeline.push({
    status: req.body.status,
    note: req.body.note || `Status changed to ${req.body.status}`
  });

  await order.save();

  emitOrderEvent('order:updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    user: order.user.toString()
  });

  res.json({
    status: 'success',
    data: { order }
  });
});

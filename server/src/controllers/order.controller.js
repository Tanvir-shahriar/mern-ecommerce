import mongoose from 'mongoose';
import { Cart } from '../models/cart.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { presentOrder, presentOrders } from '../utils/orderPresenter.js';
import { emitOrderEvent } from '../sockets/socket.js';

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 10000;
const STANDARD_SHIPPING = 120;
const ADMIN_ROLES = new Set(['admin', 'super_admin']);

const money = (value) => Math.round(value * 100) / 100;
const canViewAllOrders = (user) => ADMIN_ROLES.has(user?.role);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildOrderLookupFilter = (value) => {
  const lookup = String(value || '').trim();
  if (mongoose.isValidObjectId(lookup)) return { _id: lookup };
  return { orderNumber: lookup.toUpperCase() };
};

const csvValue = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const createOrderItem = (product, quantity, variant) => {
  if (product.inventory.trackQuantity && quantity > product.inventory.stock) {
    throw new ApiError(409, `Only ${product.inventory.stock} ${product.name} available`);
  }

  return {
    product: product._id,
    name: product.name,
    sku: product.sku,
    image: product.images[0]?.url,
    price: product.price,
    quantity,
    variant
  };
};

const buildOrderFilter = async (query) => {
  const filter = {};
  if (query.status && query.status !== 'all') filter.status = query.status;

  if (query.search) {
    const search = String(query.search).trim();
    const regex = new RegExp(escapeRegex(search), 'i');
    const matchedUsers = await User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
      .select('_id')
      .limit(50)
      .lean();
    filter.$or = [
      { orderNumber: regex },
      { user: { $in: matchedUsers.map((user) => user._id) } },
      { 'customerSnapshot.name': regex },
      { 'customerSnapshot.email': regex },
      { 'customerSnapshot.phone': regex },
      { 'shippingAddress.fullName': regex },
      { 'shippingAddress.phone': regex },
      { 'shippingAddress.city': regex },
      { 'items.name': regex },
      { 'items.sku': regex }
    ];
  }

  return filter;
};

export const createOrder = asyncHandler(async (req, res) => {
  const directItem = req.body.directItem;
  let cart;
  let orderItems;
  let productMap;

  if (directItem?.productId) {
    const product = await Product.findOne({ _id: directItem.productId, status: 'active' });
    if (!product) throw new ApiError(404, 'Product unavailable');

    orderItems = [createOrderItem(product, directItem.quantity, directItem.variant)];
    productMap = new Map([[product._id.toString(), product]]);
  } else {
    cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items.length) throw new ApiError(400, 'Your cart is empty');

    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds }, status: 'active' });
    productMap = new Map(products.map((product) => [product._id.toString(), product]));

    orderItems = cart.items.map((item) => {
      const product = productMap.get(item.product.toString());
      if (!product) throw new ApiError(404, `Product unavailable: ${item.name}`);
      return createOrderItem(product, item.quantity, item.variant);
    });
  }

  const subtotal = money(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  let discount = 0;
  let couponSnapshot;

  if (cart?.coupon?.code) {
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
  const shippingAddress = req.body.shippingAddress;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    billingAddress: req.body.billingAddress || shippingAddress,
    customerSnapshot: {
      name: shippingAddress.fullName || req.user.name,
      email: req.user.email,
      phone: shippingAddress.phone || req.user.phone
    },
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

  if (cart) {
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();
  }

  emitOrderEvent('order:created', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    user: req.user._id.toString()
  });

  res.status(201).json({
    status: 'success',
    data: { order: presentOrder(order) }
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .lean();

  res.json({
    status: 'success',
    data: { orders: presentOrders(orders) }
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const filter = buildOrderLookupFilter(req.params.id);
  if (!canViewAllOrders(req.user)) filter.user = req.user._id;

  const order = await Order.findOne(filter).populate('user', 'name email phone role status').lean();
  if (!order) throw new ApiError(404, 'Order not found');

  res.json({
    status: 'success',
    data: { order: presentOrder(order) }
  });
});

export const getOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = await buildOrderFilter(req.query);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone role status')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  res.json({
    status: 'success',
    data: {
      orders: presentOrders(orders),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const exportOrdersCsv = asyncHandler(async (req, res) => {
  const filter = await buildOrderFilter(req.query);
  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .limit(1000)
    .lean();

  const headers = [
    'Order Number',
    'Created At',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Status',
    'Payment Method',
    'Payment Status',
    'Items',
    'Subtotal',
    'Discount',
    'Tax',
    'Shipping',
    'Total',
    'Shipping Address',
    'Customer Note'
  ];

  const rows = presentOrders(orders).map((order) => {
    const address = order.shippingAddress
      ? [
          order.shippingAddress.line1,
          order.shippingAddress.line2,
          order.shippingAddress.city,
          order.shippingAddress.state,
          order.shippingAddress.postalCode,
          order.shippingAddress.country
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    return [
      order.orderNumber,
      order.createdAt?.toISOString(),
      order.customer?.name,
      order.customer?.email,
      order.customer?.phone,
      order.status,
      order.payment?.method,
      order.payment?.status,
      order.items.map((item) => `${item.name} x ${item.quantity}`).join('; '),
      order.pricing.subtotal,
      order.pricing.discount,
      order.pricing.tax,
      order.pricing.shipping,
      order.pricing.total,
      address,
      order.customerNote
    ].map(csvValue);
  });

  const csv = [headers.map(csvValue), ...rows].map((row) => row.join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
  res.send(csv);
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
    data: { order: presentOrder(order) }
  });
});

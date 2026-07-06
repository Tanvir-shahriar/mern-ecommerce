import { ContactMessage } from '../models/contactMessage.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const CONTACT_STATUSES = new Set(['new', 'read', 'replied', 'archived']);

const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const presentContactMessage = (message) => {
  const data = message?.toObject ? message.toObject() : message;
  if (!data) return data;

  return {
    ...data,
    _id: data._id?.toString?.() || data._id,
    id: data._id?.toString?.() || data.id || data._id,
    user: data.user && typeof data.user === 'object'
      ? {
          ...data.user,
          _id: data.user._id?.toString?.() || data.user._id,
          id: data.user._id?.toString?.() || data.user.id || data.user._id
        }
      : data.user
  };
};

const buildContactFilter = (query = {}) => {
  const filter = {};

  if (CONTACT_STATUSES.has(query.status)) {
    filter.status = query.status;
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { message: regex }, { status: regex }];
  }

  return filter;
};

export const createContactMessage = asyncHandler(async (req, res) => {
  const contactMessage = await ContactMessage.create({
    ...req.body,
    email: String(req.body.email || '').trim().toLowerCase(),
    status: 'new',
    source: 'contact_page',
    user: req.user?._id || null
  });

  res.status(201).json({
    status: 'success',
    message: 'Your message has been sent.',
    data: {
      contactMessage: presentContactMessage(contactMessage)
    }
  });
});

export const getContactMessages = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = buildContactFilter(req.query);

  const [messages, total, newCount] = await Promise.all([
    ContactMessage.find(filter)
      .populate('user', 'name email phone role status')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ status: 'new' })
  ]);

  res.json({
    status: 'success',
    data: {
      messages: messages.map(presentContactMessage),
      metrics: {
        newCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const updateContactMessageStatus = asyncHandler(async (req, res) => {
  const contactMessage = await ContactMessage.findById(req.params.id);
  if (!contactMessage) throw new ApiError(404, 'Contact message not found');

  contactMessage.status = req.body.status;

  if (req.body.status !== 'new' && !contactMessage.readAt) {
    contactMessage.readAt = new Date();
  }
  if (req.body.status === 'replied') {
    contactMessage.repliedAt = new Date();
  }
  if (req.body.status === 'archived') {
    contactMessage.archivedAt = new Date();
  }

  await contactMessage.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    data: {
      contactMessage: presentContactMessage(contactMessage)
    }
  });
});

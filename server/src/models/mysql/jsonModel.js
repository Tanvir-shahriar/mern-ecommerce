import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { getMysqlPool } from '../../config/mysql.js';

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const now = () => new Date().toISOString();
const id = () => crypto.randomBytes(12).toString('hex');
const toComparable = (value) => (value && typeof value.toString === 'function' ? value.toString() : value);
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const getValues = (object, path) => {
  const parts = path.split('.');
  const walk = (value, index) => {
    if (index >= parts.length) return [value];
    if (Array.isArray(value)) return value.flatMap((item) => walk(item, index));
    if (!value || typeof value !== 'object') return [undefined];
    return walk(value[parts[index]], index + 1);
  };
  return walk(object, 0).flat();
};

const getValue = (object, path) => getValues(object, path)[0];

const setValue = (object, path, value) => {
  const parts = path.split('.');
  let current = object;
  parts.slice(0, -1).forEach((part) => {
    if (!isObject(current[part])) current[part] = {};
    current = current[part];
  });
  current[parts[parts.length - 1]] = value;
};

const unsetPrivateArrayMethods = (array) => {
  ['id', 'pull', 'addToSet'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(array, key)) {
      delete array[key];
    }
  });
};

const cleanForStorage = (value) => {
  if (Array.isArray(value)) {
    unsetPrivateArrayMethods(value);
    return value.map(cleanForStorage);
  }
  if (!isObject(value)) return value;

  return Object.entries(value).reduce((result, [key, nestedValue]) => {
    if (!key.startsWith('_') || key === '_id') result[key] = cleanForStorage(nestedValue);
    return result;
  }, {});
};

const ensureArrayHelpers = (array) => {
  if (!Array.isArray(array)) return array;

  Object.defineProperty(array, 'pull', {
    configurable: true,
    enumerable: false,
    value(value) {
      const target = toComparable(value);
      for (let index = this.length - 1; index >= 0; index -= 1) {
        if (toComparable(this[index]) === target) this.splice(index, 1);
      }
    }
  });

  Object.defineProperty(array, 'addToSet', {
    configurable: true,
    enumerable: false,
    value(value) {
      const target = toComparable(value);
      if (!this.some((item) => toComparable(item) === target)) this.push(value);
    }
  });

  return array;
};

const ensureCartItemHelpers = (items) => {
  if (!Array.isArray(items)) return items;

  Object.defineProperty(items, 'id', {
    configurable: true,
    enumerable: false,
    value(value) {
      return this.find((item) => toComparable(item._id) === toComparable(value)) || null;
    }
  });

  items.forEach((item) => {
    if (!item._id) item._id = id();
    Object.defineProperty(item, 'deleteOne', {
      configurable: true,
      enumerable: false,
      value() {
        const index = items.findIndex((candidate) => candidate === item);
        if (index >= 0) items.splice(index, 1);
      }
    });
  });

  return items;
};

const compare = (left, right) => {
  const leftValue = Date.parse(left) ? Date.parse(left) : left;
  const rightValue = Date.parse(right) ? Date.parse(right) : right;
  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return 0;
};

const valueMatches = (actual, expected) => {
  if (expected instanceof RegExp) {
    if (Array.isArray(actual)) return actual.some((item) => expected.test(String(item ?? '')));
    return expected.test(String(actual ?? ''));
  }

  if (isObject(expected)) {
    if ('$in' in expected) {
      const options = expected.$in.map(toComparable);
      if (Array.isArray(actual)) return actual.some((item) => options.includes(toComparable(item)));
      return options.includes(toComparable(actual));
    }
    if ('$nin' in expected) {
      const options = expected.$nin.map(toComparable);
      return !options.includes(toComparable(actual));
    }
    if ('$ne' in expected) return toComparable(actual) !== toComparable(expected.$ne);
    if ('$gte' in expected && !(actual >= expected.$gte)) return false;
    if ('$gt' in expected && !(actual > expected.$gt)) return false;
    if ('$lte' in expected && !(actual <= expected.$lte)) return false;
    if ('$lt' in expected && !(actual < expected.$lt)) return false;
    return true;
  }

  if (Array.isArray(actual)) return actual.some((item) => toComparable(item) === toComparable(expected));
  return toComparable(actual) === toComparable(expected);
};

const matchesExpr = (doc, expression) => {
  if (!expression?.$lte) return true;
  const [left, right] = expression.$lte;
  const resolve = (value) => (typeof value === 'string' && value.startsWith('$') ? getValue(doc, value.slice(1)) : value);
  return resolve(left) <= resolve(right);
};

const matchesFilter = (doc, filter = {}) => {
  if (!filter || !Object.keys(filter).length) return true;

  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((nested) => matchesFilter(doc, nested));
    if (key === '$and') return expected.every((nested) => matchesFilter(doc, nested));
    if (key === '$expr') return matchesExpr(doc, expected);

    const values = getValues(doc, key);
    return values.some((actual) => valueMatches(actual, expected));
  });
};

const selectFields = (doc, fields) => {
  if (!fields) return doc;
  const tokens = String(fields).split(/\s+/).filter(Boolean);
  const plusOnly = tokens.every((token) => token.startsWith('+'));
  if (plusOnly) return doc;

  const include = tokens.filter((token) => !token.startsWith('-') && !token.startsWith('+'));
  if (!include.length) return doc;

  const selected = { _id: doc._id, id: doc.id || doc._id };
  include.forEach((field) => {
    const value = getValue(doc, field);
    if (value !== undefined) setValue(selected, field, value);
  });
  return selected;
};

class JsonDocument {
  constructor(model, data, options = {}) {
    Object.defineProperty(this, '_model', { value: model, enumerable: false });
    Object.defineProperty(this, '_selectedPassword', { value: Boolean(options.selectedPassword), enumerable: false });
    Object.assign(this, clone(data));
    this.id = this._id;
    model.attach(this);
  }

  toObject() {
    return this._model.publicDoc(this, { includePassword: this._selectedPassword });
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    await this._model.saveDocument(this);
    return this;
  }

  async populate(path, select) {
    const populated = await this._model.populateDoc(this.toObject(), { path, select });
    Object.assign(this, populated);
    this._model.attach(this);
    return this;
  }
}

class JsonQuery {
  constructor(model, filter = {}, options = {}) {
    this.model = model;
    this.filter = filter || {};
    this.options = options;
    this.populateSpecs = [];
    this.sortSpec = null;
    this.skipCount = 0;
    this.limitCount = undefined;
    this.selectSpec = null;
    this.shouldLean = false;
  }

  populate(path, select) {
    this.populateSpecs.push(typeof path === 'object' ? path : { path, select });
    return this;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  skip(count) {
    this.skipCount = count || 0;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  select(spec) {
    this.selectSpec = spec;
    return this;
  }

  lean() {
    this.shouldLean = true;
    return this;
  }

  async exec() {
    let docs = await this.model.findRaw(this.filter);

    if (this.sortSpec) docs = this.model.sortDocs(docs, this.sortSpec);
    if (this.skipCount) docs = docs.slice(this.skipCount);
    if (this.limitCount !== undefined) docs = docs.slice(0, this.limitCount);
    if (this.options.single) docs = docs.slice(0, 1);

    for (const spec of this.populateSpecs) {
      docs = await Promise.all(docs.map((doc) => this.model.populateDoc(doc, spec)));
    }

    const selectedPassword = String(this.selectSpec || '').includes('+password');
    const output = docs.map((doc) => {
      const publicDoc = this.shouldLean
        ? this.model.publicDoc(doc, { includePassword: selectedPassword })
        : this.model.hydrate(doc, { selectedPassword });
      return selectFields(publicDoc, this.selectSpec);
    });

    return this.options.single ? output[0] || null : output;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export class JsonModel {
  constructor(name, table, options = {}) {
    this.name = name;
    this.table = table;
    this.options = options;
    this.registry = options.registry;
  }

  hydrate(doc, options = {}) {
    if (!doc) return doc;
    return new JsonDocument(this, doc, options);
  }

  attach(doc) {
    if (this.name === 'User') {
      doc.wishlist = ensureArrayHelpers(doc.wishlist || []);
      doc.comparePassword = function comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password || '');
      };
    }

    if (this.name === 'Cart') {
      doc.items = ensureCartItemHelpers(doc.items || []);
      doc.recalculateTotals = function recalculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
        const discount = this.coupon?.discountAmount || 0;
        this.totals = {
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          total: Math.max(0, Math.round((subtotal - discount) * 100) / 100)
        };
      };
    }

    if (this.name === 'Coupon') {
      doc.isUsableFor = function isUsableFor(amount) {
        if (!this.isActive) return false;
        if (this.expiresAt && new Date(this.expiresAt) < new Date()) return false;
        if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
        return amount >= (this.minOrderAmount || 0);
      };
      doc.calculateDiscount = function calculateDiscount(amount) {
        if (!this.isUsableFor(amount)) return 0;
        const rawDiscount = this.discountType === 'percent' ? amount * (this.value / 100) : this.value;
        const cappedDiscount = this.maxDiscountAmount ? Math.min(rawDiscount, this.maxDiscountAmount) : rawDiscount;
        return Math.min(amount, Math.round(cappedDiscount * 100) / 100);
      };
    }

    if (this.name === 'Product') {
      doc.reviews = doc.reviews || [];
      doc.recalculateRatings = function recalculateRatings() {
        const approvedReviews = this.reviews.filter((review) => !review.status || review.status === 'approved');
        this.ratingsCount = approvedReviews.length;
        this.ratingsAverage = approvedReviews.length
          ? Math.round((approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length) * 10) / 10
          : 0;
      };
    }
  }

  defaults(doc) {
    const base = {
      _id: doc._id || id(),
      createdAt: doc.createdAt || now(),
      updatedAt: now(),
      ...doc
    };
    base.id = base._id;

    if (this.name === 'User') {
      base.email = String(base.email || '').trim().toLowerCase();
      base.role ||= 'customer';
      base.status ||= 'active';
      base.addresses ||= [];
      base.wishlist ||= [];
    }

    if (this.name === 'Category') {
      base.slug ||= slugify(base.name || '', { lower: true, strict: true });
      base.parent ??= null;
      base.isFeatured = Boolean(base.isFeatured);
      base.order ||= 0;
    }

    if (this.name === 'Product') {
      base.slug ||= slugify(base.name || '', { lower: true, strict: true });
      if (base.sku) base.sku = String(base.sku).trim().toUpperCase();
      base.productType ||= 'physical';
      base.tags ||= [];
      base.attributes ||= [];
      base.variants ||= [];
      base.inventory = { stock: 0, lowStockThreshold: 5, trackQuantity: true, ...(base.inventory || {}) };
      base.shipping = { freeShipping: false, ...(base.shipping || {}) };
      base.status ||= 'active';
      base.isFeatured = Boolean(base.isFeatured);
      base.salesCount ||= 0;
      base.ratingsAverage ||= 0;
      base.ratingsCount ||= 0;
      base.reviews ||= [];
    }

    if (this.name === 'Coupon') {
      base.code = String(base.code || '').trim().toUpperCase();
      base.minOrderAmount ||= 0;
      base.usedCount ||= 0;
      base.isActive = base.isActive !== false;
    }

    if (this.name === 'Cart') {
      base.items ||= [];
      base.totals ||= { subtotal: 0, discount: 0, total: 0 };
    }

    if (this.name === 'Order') {
      base.orderNumber ||= `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      base.status ||= 'pending';
      base.timeline = base.timeline?.length ? base.timeline : [{ status: base.status, note: 'Order created', at: now() }];
    }

    if (this.name === 'ContactMessage') {
      base.email = String(base.email || '').trim().toLowerCase();
      base.status ||= 'new';
      base.source ||= 'contact_page';
      base.user ||= null;
    }

    return base;
  }

  async beforeSave(doc) {
    doc.updatedAt = now();
    if (!doc.createdAt) doc.createdAt = doc.updatedAt;

    if (this.name === 'User' && doc.password && !String(doc.password).startsWith('$2')) {
      doc.email = String(doc.email || '').trim().toLowerCase();
      doc.password = await bcrypt.hash(doc.password, 12);
    }

    if (this.name === 'User') {
      doc.email = String(doc.email || '').trim().toLowerCase();
    }

    if (this.name === 'Category' && (!doc.slug || doc.name)) {
      doc.slug = slugify(doc.name || '', { lower: true, strict: true });
    }

    if (this.name === 'Product' && (!doc.slug || doc.name)) {
      doc.slug = slugify(doc.name || '', { lower: true, strict: true });
      if (doc.sku) doc.sku = String(doc.sku).trim().toUpperCase();
      doc.images ||= [];
      doc.reviews = (doc.reviews || []).map((review) => ({
        _id: review._id || id(),
        status: review.status || 'approved',
        createdAt: review.createdAt || now(),
        updatedAt: now(),
        ...review
      }));
    }

    if (this.name === 'Coupon') {
      doc.code = String(doc.code || '').trim().toUpperCase();
    }

    if (this.name === 'Cart') {
      doc.items = ensureCartItemHelpers(doc.items || []);
      doc.items.forEach((item) => {
        item._id ||= id();
        item.createdAt ||= now();
        item.updatedAt = now();
      });
      if (typeof doc.recalculateTotals === 'function') doc.recalculateTotals();
    }

    if (this.name === 'Order') {
      doc.timeline = (doc.timeline || []).map((item) => ({
        at: item.at || now(),
        ...item
      }));
    }

    if (this.name === 'ContactMessage') {
      doc.email = String(doc.email || '').trim().toLowerCase();
    }
  }

  publicDoc(doc, options = {}) {
    const source = Object.keys(doc).reduce((result, key) => {
      result[key] = doc[key];
      return result;
    }, {});
    const data = cleanForStorage(clone(source));
    delete data._model;
    delete data._selectedPassword;
    data.id ||= data._id;
    if (this.name === 'User' && !options.includePassword) delete data.password;
    return data;
  }

  async saveDocument(document) {
    const data = this.defaults(this.publicDoc(document, { includePassword: true }));
    await this.beforeSave(data);
    await this.store(data);
    Object.assign(document, clone(data));
    this.attach(document);
    return document;
  }

  async store(doc) {
    const data = this.publicDoc(doc, { includePassword: true });
    const pool = getMysqlPool();
    await pool.execute(
      `REPLACE INTO \`${this.table}\` (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      [data._id, JSON.stringify(data), sqlDate(data.createdAt), sqlDate(data.updatedAt)]
    );
  }

  async all() {
    const [rows] = await getMysqlPool().execute(`SELECT data FROM \`${this.table}\``);
    return rows.map((row) => JSON.parse(row.data));
  }

  async findRaw(filter = {}) {
    const docs = await this.all();
    return docs.filter((doc) => matchesFilter(doc, filter));
  }

  sortDocs(docs, spec) {
    const fields = typeof spec === 'string' ? spec.split(/\s+/).filter(Boolean) : Object.entries(spec).map(([key, value]) => `${value === -1 ? '-' : ''}${key}`);
    return [...docs].sort((left, right) => {
      for (const field of fields) {
        const desc = field.startsWith('-');
        const key = desc ? field.slice(1) : field;
        const result = compare(getValue(left, key), getValue(right, key));
        if (result) return desc ? -result : result;
      }
      return 0;
    });
  }

  find(filter = {}) {
    return new JsonQuery(this, filter);
  }

  findOne(filter = {}) {
    return new JsonQuery(this, filter, { single: true });
  }

  findById(value) {
    return this.findOne({ _id: toComparable(value) });
  }

  async create(value) {
    if (Array.isArray(value)) {
      const created = [];
      for (const item of value) created.push(await this.create(item));
      return created;
    }

    const data = this.defaults(clone(value));
    await this.beforeSave(data);
    await this.enforceUnique(data);
    await this.store(data);
    return this.hydrate(data, { selectedPassword: true });
  }

  async enforceUnique(doc) {
    const uniqueByModel = {
      User: ['email'],
      Product: ['slug', 'sku'],
      Category: ['slug', 'name'],
      Coupon: ['code'],
      Order: ['orderNumber'],
      Cart: ['user'],
      CurrencySetting: ['key'],
      PaymentSetting: ['key'],
      Gallery: ['key'],
      HeroSetting: ['key']
    };

    for (const field of uniqueByModel[this.name] || []) {
      if (!doc[field]) continue;
      const existing = await this.findOne({ [field]: doc[field] }).lean();
      if (existing && existing._id !== doc._id) {
        const error = new Error(`${field} already exists`);
        error.code = 11000;
        error.keyValue = { [field]: doc[field] };
        throw error;
      }
    }
  }

  async updateOne(filter, update) {
    const doc = await this.findOne(filter);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };

    if (update.$inc) {
      Object.entries(update.$inc).forEach(([path, amount]) => {
        setValue(doc, path, Number(getValue(doc, path) || 0) + amount);
      });
    }
    if (update.$set) Object.assign(doc, update.$set);
    await doc.save();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async findByIdAndUpdate(value, update, options = {}) {
    const doc = await this.findById(value);
    if (!doc) return null;
    Object.assign(doc, update.$set || update);
    await doc.save();
    return options.new ? doc : null;
  }

  async findByIdAndDelete(value) {
    const doc = await this.findById(value);
    if (!doc) return null;
    await getMysqlPool().execute(`DELETE FROM \`${this.table}\` WHERE id = ?`, [toComparable(value)]);
    return doc;
  }

  async deleteMany(filter = {}) {
    if (!filter || !Object.keys(filter).length) {
      await getMysqlPool().execute(`DELETE FROM \`${this.table}\``);
      return { deletedCount: 0 };
    }
    const docs = await this.findRaw(filter);
    await Promise.all(docs.map((doc) => getMysqlPool().execute(`DELETE FROM \`${this.table}\` WHERE id = ?`, [doc._id])));
    return { deletedCount: docs.length };
  }

  async countDocuments(filter = {}) {
    return (await this.findRaw(filter)).length;
  }

  async exists(filter = {}) {
    const doc = await this.findOne(filter).lean();
    return doc ? { _id: doc._id } : null;
  }

  async distinct(field, filter = {}) {
    const docs = await this.findRaw(filter);
    return [...new Set(docs.map((doc) => getValue(doc, field)).filter((value) => value !== undefined && value !== null))];
  }

  async aggregate(pipeline = []) {
    let docs = await this.all();
    for (const stage of pipeline) {
      if (stage.$match) docs = docs.filter((doc) => matchesFilter(doc, stage.$match));
      if (stage.$group) {
        const output = { _id: stage.$group._id };
        Object.entries(stage.$group).forEach(([key, expression]) => {
          if (key === '_id') return;
          if (expression.$sum) output[key] = docs.reduce((sum, doc) => sum + Number(getValue(doc, expression.$sum.slice(1)) || 0), 0);
          if (expression.$avg) output[key] = docs.length ? docs.reduce((sum, doc) => sum + Number(getValue(doc, expression.$avg.slice(1)) || 0), 0) / docs.length : 0;
        });
        docs = [output];
      }
    }
    return docs;
  }

  async populateDoc(doc, spec) {
    const data = clone(doc);
    const path = spec.path;
    const select = spec.select;

    if (path === 'category' && data.category) {
      data.category = await this.registry.Category.findById(data.category).select(select || '').lean();
    }
    if (path === 'parent' && data.parent) {
      data.parent = await this.registry.Category.findById(data.parent).select(select || '').lean();
    }
    if (path === 'user' && data.user) {
      data.user = await this.registry.User.findById(data.user).select(select || '').lean();
    }
    if (path === 'reviews.user' && Array.isArray(data.reviews)) {
      data.reviews = await Promise.all(
        data.reviews.map(async (review) => ({
          ...review,
          user: review.user ? await this.registry.User.findById(review.user).select(select || '').lean() : review.user
        }))
      );
    }
    if (path === 'items.product' && Array.isArray(data.items)) {
      data.items = await Promise.all(
        data.items.map(async (item) => ({
          ...item,
          product: item.product ? await this.registry.Product.findById(item.product).select(select || '').lean() : item.product
        }))
      );
    }
    if (path === 'wishlist' && Array.isArray(data.wishlist)) {
      const wishlist = [];
      for (const productId of data.wishlist) {
        let product = await this.registry.Product.findById(productId).select(select || '').lean();
        if (!product) continue;
        if (spec.match && !matchesFilter(product, spec.match)) continue;
        if (spec.populate) product = await this.registry.Product.populateDoc(product, spec.populate);
        wishlist.push(product);
      }
      data.wishlist = wishlist;
    }

    return data;
  }
}

const sqlDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

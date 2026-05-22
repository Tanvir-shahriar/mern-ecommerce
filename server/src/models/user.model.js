import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: 'Home'
    },
    fullName: {
      type: String,
      trim: true,
      required: true
    },
    phone: {
      type: String,
      trim: true,
      required: true
    },
    line1: {
      type: String,
      trim: true,
      required: true
    },
    line2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true,
      required: true
    },
    state: {
      type: String,
      trim: true,
      required: true
    },
    postalCode: {
      type: String,
      trim: true,
      required: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Bangladesh'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'super_admin'],
      default: 'customer'
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      url: String,
      publicId: String
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    lastLoginAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ role: 1, status: 1, createdAt: -1 });
userSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const User = mongoose.model('User', userSchema);

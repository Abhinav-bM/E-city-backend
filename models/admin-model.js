import mongoose from '../config/database-config'

const adminSchema = new mongoose.Schema({
  name: String,
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;

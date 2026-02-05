const mongoose = require('mongoose');

const UserCloudPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferred_regions: [{
    region_code: String,
    priority: Number
  }],
  auto_optimize: {
    type: Boolean,
    default: false
  },
  max_carbon_intensity: {
    type: Number,
    default: 500, // gCO2/kWh
  },
  workload_preferences: {
    prefer_renewable: {
      type: Boolean,
      default: true
    },
    cost_vs_carbon_weight: {
      type: Number,
      default: 0.7, // 0 = all cost, 1 = all carbon
      min: 0,
      max: 1
    }
  },
  aws_credentials: {
    access_key_id: String,
    secret_access_key: String,
    region: String,
    encrypted: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserCloudPreference', UserCloudPreferenceSchema);
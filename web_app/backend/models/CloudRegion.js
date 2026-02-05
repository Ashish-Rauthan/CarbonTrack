// web_app/backend/models/CloudRegion.js

const mongoose = require('mongoose');

const cloudRegionSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['aws', 'gcp', 'azure', 'oracle'],
    index: true
  },
  region: {
    type: String,
    required: true,
    index: true
  },
  regionName: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  carbonIntensity: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  renewablePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  instanceTypes: [{
    type: String
  }],
  zones: [{
    type: String
  }],
  available: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    latitude: Number,
    longitude: Number,
    timezone: String,
    dataCenter: String
  }
}, {
  timestamps: true
});

// Compound index for unique provider-region combination
cloudRegionSchema.index({ provider: 1, region: 1 }, { unique: true });

// Index for sorting by carbon intensity
cloudRegionSchema.index({ carbonIntensity: 1, available: 1 });

module.exports = mongoose.model('CloudRegion', cloudRegionSchema);
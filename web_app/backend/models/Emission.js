const mongoose = require('mongoose');

const EmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session_id: {
    type: String,
    required: true,
    unique: true
  },
  device_id: {
    type: String,
    required: true
  },
  energy_kwh: {
    type: Number,
    required: true
  },
  emissions_gco2: {
    type: Number,
    required: true
  },
  duration_seconds: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
EmissionSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('Emission', EmissionSchema);
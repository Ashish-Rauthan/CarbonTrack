// web_app/backend/models/Emission.js

const mongoose = require('mongoose');

const emissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  energyKWh: {
    type: Number,
    required: true,
    min: 0
  },
  emissionsGCO2: {
    type: Number,
    required: true,
    min: 0
  },
  durationSeconds: {
    type: Number,
    required: true,
    min: 0
  },
  metadata: {
    country: String,
    region: String,
    powerSource: String,
    cpuUsage: Number,
    ramUsage: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
emissionSchema.index({ user: 1, timestamp: -1 });
emissionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Emission', emissionSchema);
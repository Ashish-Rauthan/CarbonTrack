// web_app/backend/models/CloudWorkload.js

const mongoose = require('mongoose');

const cloudWorkloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workloadType: {
    type: String,
    required: true,
    enum: ['computation', 'storage', 'processing', 'training', 'batch', 'analysis'],
    index: true
  },
  sourceRegion: {
    type: String,
    default: 'local'
  },
  targetCloudRegion: {
    type: String,
    required: true
  },
  cloudProvider: {
    type: String,
    required: true,
    enum: ['aws', 'gcp', 'azure', 'oracle'],
    index: true
  },
  instanceId: {
    type: String,
    sparse: true
  },
  instanceType: {
    type: String
  },
  estimatedLocalEmissions: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedCloudEmissions: {
    type: Number,
    required: true,
    min: 0
  },
  actualCloudEmissions: {
    type: Number,
    min: 0
  },
  savingsGCO2: {
    type: Number,
    required: true
  },
  estimatedCost: {
    type: Number,
    min: 0,
    default: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'provisioning', 'running', 'completed', 'failed', 'terminated'],
    default: 'pending',
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    min: 0
  },
  errorMessage: {
    type: String
  },
  metadata: {
    energyKWh: Number,
    estimatedDurationHours: Number,
    power: Number,
    carbonIntensity: Number,
    renewablePercentage: Number,
    launchTime: Date,
    simulated: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
cloudWorkloadSchema.index({ user: 1, status: 1 });
cloudWorkloadSchema.index({ user: 1, startTime: -1 });
cloudWorkloadSchema.index({ cloudProvider: 1, status: 1 });

module.exports = mongoose.model('CloudWorkload', cloudWorkloadSchema);
// web_app/backend/routes/emissions.js

const express  = require('express');
const Emission = require('../models/Emission');
const auth     = require('../middleware/auth');

const router = express.Router();

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a value as a non-negative finite number.
 * Returns null if the value is missing, NaN, Infinity, or negative.
 */
function safePositiveNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

// ── POST /emissions/log ───────────────────────────────────────────────────────
router.post('/log', auth, async (req, res) => {
  try {
    const {
      session_id,
      device_id,
      timestamp,
      energy_kwh,
      emissions_gco2,
      duration_seconds,
      metadata,
    } = req.body;

    // ── Validate required fields ──────────────────────────────────────────────
    const missing = [];
    if (!session_id)  missing.push('session_id');
    if (!device_id)   missing.push('device_id');

    const energyVal    = safePositiveNumber(energy_kwh);
    const emissionsVal = safePositiveNumber(emissions_gco2);
    const durationVal  = safePositiveNumber(duration_seconds);

    if (energyVal    === null) missing.push('energy_kwh (must be a non-negative number)');
    if (emissionsVal === null) missing.push('emissions_gco2 (must be a non-negative number)');
    if (durationVal  === null) missing.push('duration_seconds (must be a non-negative number)');

    if (missing.length > 0) {
      console.error('Emission log validation failed. Missing/invalid fields:', missing);
      console.error('Received body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        message: 'Missing or invalid fields',
        fields:  missing,
        received: {
          session_id,
          device_id,
          energy_kwh,
          emissions_gco2,
          duration_seconds,
        },
      });
    }

    // ── Persist ───────────────────────────────────────────────────────────────
    const emission = new Emission({
      user:            req.user.id,
      sessionId:       session_id,
      deviceId:        device_id,
      timestamp:       timestamp ? new Date(timestamp) : new Date(),
      energyKWh:       energyVal,
      emissionsGCO2:   emissionsVal,
      durationSeconds: durationVal,
      metadata: {
        ...(metadata || {}),
        // ── FIX: explicitly save the source field from Python tracker ──
        source: metadata?.source || 'estimated',
      },
    });

    await emission.save();

    console.log(
      `Emission saved: ${emission._id} | ` +
      `${emissionsVal.toFixed(4)} gCO2 | ` +
      `${energyVal.toFixed(6)} kWh | ` +
      `source=${emission.metadata.source}`
    );

    res.status(201).json({
      message: 'Emission logged successfully',
      emission: {
        id:            emission._id,
        energyKWh:     emission.energyKWh,
        emissionsGCO2: emission.emissionsGCO2,
        durationSeconds: emission.durationSeconds,
        timestamp:     emission.timestamp,
        source:        emission.metadata.source,
      },
    });

  } catch (error) {
    console.error('Error logging emission:', error.message);
    if (error.name === 'ValidationError') {
      const fields = Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`);
      console.error('Mongoose validation errors:', fields);
      return res.status(400).json({ message: 'Validation error', fields });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── GET /emissions ────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate)   query.timestamp.$lte = new Date(endDate);
    }

    const emissions = await Emission.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ emissions, count: emissions.length });
  } catch (error) {
    console.error('Error fetching emissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /emissions/recent ─────────────────────────────────────────────────────
// NEW: Returns the N most recent individual emission sessions for the live feed
router.get('/recent', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const emissions = await Emission.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ emissions, count: emissions.length });
  } catch (error) {
    console.error('Error fetching recent emissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /emissions/stats ──────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    const now       = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':   startDate.setDate(now.getDate() - 1);           break;
      case 'week':  startDate.setDate(now.getDate() - 7);           break;
      case 'month': startDate.setMonth(now.getMonth() - 1);         break;
      case 'year':  startDate.setFullYear(now.getFullYear() - 1);   break;
      default:      startDate.setDate(now.getDate() - 7);
    }

    const stats = await Emission.aggregate([
      { $match: { user: req.user.id, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id:            null,
          totalEnergy:    { $sum: '$energyKWh' },
          totalEmissions: { $sum: '$emissionsGCO2' },
          totalDuration:  { $sum: '$durationSeconds' },
          count:          { $sum: 1 },
          avgEmissions:   { $avg: '$emissionsGCO2' },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({
        period,
        totalEnergy:    0,
        totalEmissions: 0,
        totalDuration:  0,
        sessionCount:   0,
        avgEmissions:   0,
      });
    }

    const r = stats[0];
    res.json({
      period,
      totalEnergy:    parseFloat(r.totalEnergy.toFixed(6)),
      totalEmissions: parseFloat(r.totalEmissions.toFixed(4)),
      totalDuration:  r.totalDuration,
      sessionCount:   r.count,
      avgEmissions:   parseFloat(r.avgEmissions.toFixed(4)),
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /emissions/:id ─────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const emission = await Emission.findOne({
      _id:  req.params.id,
      user: req.user.id,
    });

    if (!emission) {
      return res.status(404).json({ message: 'Emission not found' });
    }

    await emission.deleteOne();
    res.json({ message: 'Emission deleted successfully' });
  } catch (error) {
    console.error('Error deleting emission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
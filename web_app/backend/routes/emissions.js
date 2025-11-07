const express = require('express');
const Emission = require('../models/Emission');
const auth = require('../middleware/auth');

const router = express.Router();

// Log emission data
router.post('/log', auth, async (req, res) => {
  try {
    const { session_id, device_id, energy_kwh, emissions_gco2, timestamp } = req.body;

    // Validate required fields
    if (!session_id || !device_id || energy_kwh === undefined || emissions_gco2 === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: session_id, device_id, energy_kwh, emissions_gco2' 
      });
    }

    const emission = await Emission.create({
      user: req.user.id,
      session_id,
      device_id,
      energy_kwh: parseFloat(energy_kwh),
      emissions_gco2: parseFloat(emissions_gco2),
      timestamp: new Date(timestamp || Date.now())
    });

    res.status(201).json({
      message: 'Emission data logged successfully',
      emission: {
        id: emission._id,
        session_id: emission.session_id,
        energy_kwh: emission.energy_kwh,
        emissions_gco2: emission.emissions_gco2,
        timestamp: emission.timestamp
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Session already logged' });
    }
    console.error('Emission log error:', error);
    res.status(500).json({ message: 'Server error while logging emission data' });
  }
});

// Get user's emissions with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const emissions = await Emission.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate totals from all user emissions (not just current page)
    const totalEmissions = await Emission.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalEmissions: { $sum: "$emissions_gco2" }, totalEnergy: { $sum: "$energy_kwh" } } }
    ]);

    const totals = totalEmissions.length > 0 ? totalEmissions[0] : { totalEmissions: 0, totalEnergy: 0 };

    // Get total count for pagination
    const totalCount = await Emission.countDocuments({ user: req.user.id });

    res.json({
      emissions,
      totals: {
        emissions: totals.totalEmissions,
        energy: totals.totalEnergy,
        sessions: totalCount
      },
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      }
    });
  } catch (error) {
    console.error('Get emissions error:', error);
    res.status(500).json({ message: 'Server error while fetching emissions data' });
  }
});

// Get emission statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Emission.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalEmissions: { $sum: "$emissions_gco2" },
          totalEnergy: { $sum: "$energy_kwh" },
          avgEmissions: { $avg: "$emissions_gco2" },
          avgEnergy: { $avg: "$energy_kwh" },
          sessionCount: { $sum: 1 },
          lastSession: { $max: "$timestamp" }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalEmissions: 0,
        totalEnergy: 0,
        avgEmissions: 0,
        avgEnergy: 0,
        sessionCount: 0,
        lastSession: null
      });
    }

    res.json(stats[0]);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;
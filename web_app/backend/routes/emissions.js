// web_app/backend/routes/emissions.js

const express = require('express');
const Emission = require('../models/Emission');
const auth = require('../middleware/auth');

const router = express.Router();

// Log new emission
router.post('/log', auth, async (req, res) => {
  try {
    const {
      session_id,
      device_id,
      timestamp,
      energy_kwh,
      emissions_gco2,
      duration_seconds,
      metadata
    } = req.body;
    
    const emission = new Emission({
      user: req.user.id,
      sessionId: session_id,
      deviceId: device_id,
      timestamp: timestamp || new Date(),
      energyKWh: energy_kwh,
      emissionsGCO2: emissions_gco2,
      durationSeconds: duration_seconds,
      metadata: metadata || {}
    });
    
    await emission.save();
    
    res.status(201).json({
      message: 'Emission logged successfully',
      emission: {
        id: emission._id,
        energyKWh: emission.energyKWh,
        emissionsGCO2: emission.emissionsGCO2
      }
    });
  } catch (error) {
    console.error('Error logging emission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all emissions for user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const query = { user: req.user.id };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const emissions = await Emission.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({
      emissions,
      count: emissions.length
    });
  } catch (error) {
    console.error('Error fetching emissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get emission statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Aggregate statistics
    const stats = await Emission.aggregate([
      {
        $match: {
          user: req.user.id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEnergy: { $sum: '$energyKWh' },
          totalEmissions: { $sum: '$emissionsGCO2' },
          totalDuration: { $sum: '$durationSeconds' },
          count: { $sum: 1 },
          avgEmissions: { $avg: '$emissionsGCO2' }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        period,
        totalEnergy: 0,
        totalEmissions: 0,
        totalDuration: 0,
        sessionCount: 0,
        avgEmissions: 0
      });
    }
    
    const result = stats[0];
    
    res.json({
      period,
      totalEnergy: parseFloat(result.totalEnergy.toFixed(6)),
      totalEmissions: parseFloat(result.totalEmissions.toFixed(2)),
      totalDuration: result.totalDuration,
      sessionCount: result.count,
      avgEmissions: parseFloat(result.avgEmissions.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete emission
router.delete('/:id', auth, async (req, res) => {
  try {
    const emission = await Emission.findOne({
      _id: req.params.id,
      user: req.user.id
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
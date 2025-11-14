// web_app/backend/routes/reports.js

const express = require('express');
const Emission = require('../models/Emission');
const auth = require('../middleware/auth');

const router = express.Router();

// Get summary report for a specific period
router.get('/summary', auth, async (req, res) => {
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

    // Get user's emissions for the period
    const emissions = await Emission.find({
      user: req.user._id,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: -1 });

    // Calculate statistics
    const totalEmissions = emissions.reduce((sum, e) => sum + e.emissions_gco2, 0);
    const totalEnergy = emissions.reduce((sum, e) => sum + e.energy_kwh, 0);
    const sessionsCount = emissions.length;
    const avgPerSession = sessionsCount > 0 ? totalEmissions / sessionsCount : 0;

    // Get platform average for comparison
    const platformAvg = await Emission.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: now } } },
      { $group: { 
        _id: null, 
        avgEmissions: { $avg: "$emissions_gco2" }
      }}
    ]);

    const platformAverage = platformAvg.length > 0 ? platformAvg[0].avgEmissions : 0;
    const comparisonToAverage = platformAverage > 0 
      ? ((avgPerSession - platformAverage) / platformAverage * 100)
      : 0;

    // Determine trend
    const midPoint = Math.floor(emissions.length / 2);
    const firstHalf = emissions.slice(midPoint).reduce((sum, e) => sum + e.emissions_gco2, 0);
    const secondHalf = emissions.slice(0, midPoint).reduce((sum, e) => sum + e.emissions_gco2, 0);
    
    let trend = 'stable';
    if (secondHalf > firstHalf * 1.1) trend = 'increasing';
    else if (secondHalf < firstHalf * 0.9) trend = 'decreasing';

    // Generate recommendations
    const recommendations = [];
    if (comparisonToAverage > 10) {
      recommendations.push('Your emissions are higher than average. Consider reducing screen brightness and closing unused applications.');
    }
    if (trend === 'increasing') {
      recommendations.push('Your emissions are increasing. Review your recent usage patterns.');
    }
    if (totalEnergy > 1) {
      recommendations.push('Consider enabling power-saving mode on your device.');
    }

    // Calculate environmental impact
    const impact = {
      trees: (totalEmissions / 1000 / 0.021).toFixed(1),
      carMiles: (totalEmissions / 1000 / 0.404).toFixed(2),
      phoneCharges: (totalEmissions / 0.008).toFixed(0),
    };

    res.json({
      period,
      dateRange: {
        start: startDate,
        end: now
      },
      summary: {
        totalEmissions: totalEmissions / 1000, // kg
        totalEnergy,
        sessionsCount,
        avgPerSession: avgPerSession / 1000, // kg
        comparisonToAverage: comparisonToAverage.toFixed(1),
        trend
      },
      impact,
      recommendations,
      chartData: emissions.map(e => ({
        date: e.timestamp,
        emissions: e.emissions_gco2,
        energy: e.energy_kwh
      }))
    });

  } catch (error) {
    console.error('Report summary error:', error);
    res.status(500).json({ message: 'Error generating report summary' });
  }
});

// Get detailed insights and AI-powered recommendations
router.get('/insights', auth, async (req, res) => {
  try {
    const emissions = await Emission.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(100);

    if (emissions.length === 0) {
      return res.json({
        insights: [],
        recommendations: ['Start tracking your emissions to get personalized insights.']
      });
    }

    const insights = [];
    const recommendations = [];

    // Analyze usage patterns
    const hourlyUsage = {};
    emissions.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + e.emissions_gco2;
    });

    const peakHour = Object.keys(hourlyUsage).reduce((a, b) => 
      hourlyUsage[a] > hourlyUsage[b] ? a : b
    );

    insights.push({
      type: 'usage_pattern',
      title: 'Peak Usage Time',
      description: `Your highest emissions occur around ${peakHour}:00. Consider scheduling heavy tasks during off-peak hours.`,
      icon: '⏰'
    });

    // Detect anomalies
    const avgEmission = emissions.reduce((sum, e) => sum + e.emissions_gco2, 0) / emissions.length;
    const highEmissionSessions = emissions.filter(e => e.emissions_gco2 > avgEmission * 2);
    
    if (highEmissionSessions.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'High Emission Sessions Detected',
        description: `${highEmissionSessions.length} sessions had unusually high emissions. Review these sessions for optimization opportunities.`,
        icon: '⚠️'
      });
    }

    // Weekly trend
    const lastWeek = emissions.slice(0, Math.min(emissions.length, 7));
    const weekTotal = lastWeek.reduce((sum, e) => sum + e.emissions_gco2, 0);
    const weeklyAvg = weekTotal / 7;

    insights.push({
      type: 'trend',
      title: 'Weekly Average',
      description: `Your average daily emissions this week: ${(weeklyAvg / 1000).toFixed(3)} kg CO₂`,
      icon: '📊'
    });

    // Generate recommendations
    if (weeklyAvg > avgEmission) {
      recommendations.push('Your emissions increased this week. Consider reviewing your recent activities.');
    }

    recommendations.push('Enable dark mode to reduce screen energy consumption.');
    recommendations.push('Close background applications when not in use.');
    recommendations.push('Consider upgrading to energy-efficient hardware.');

    res.json({
      insights,
      recommendations,
      stats: {
        totalSessions: emissions.length,
        avgEmission: avgEmission / 1000,
        peakHour: parseInt(peakHour)
      }
    });

  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ message: 'Error generating insights' });
  }
});

// Get progress tracking data
router.get('/progress', auth, async (req, res) => {
  try {
    const emissions = await Emission.find({ user: req.user._id })
      .sort({ timestamp: 1 });

    if (emissions.length === 0) {
      return res.json({
        progress: [],
        achievements: []
      });
    }

    // Calculate monthly progress
    const monthlyData = {};
    emissions.forEach(e => {
      const monthKey = new Date(e.timestamp).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          emissions: 0,
          energy: 0,
          sessions: 0
        };
      }
      monthlyData[monthKey].emissions += e.emissions_gco2;
      monthlyData[monthKey].energy += e.energy_kwh;
      monthlyData[monthKey].sessions += 1;
    });

    const progress = Object.keys(monthlyData).map(month => ({
      month,
      ...monthlyData[month]
    }));

    // Calculate achievements
    const achievements = [];
    const totalSessions = emissions.length;
    const totalEmissionsKg = emissions.reduce((sum, e) => sum + e.emissions_gco2, 0) / 1000;

    if (totalSessions >= 10) {
      achievements.push({
        id: 'first_10',
        title: 'Getting Started',
        description: 'Completed 10 tracking sessions',
        icon: '🎯',
        unlockedAt: emissions[9].timestamp
      });
    }

    if (totalSessions >= 50) {
      achievements.push({
        id: 'half_century',
        title: 'Consistent Tracker',
        description: 'Completed 50 tracking sessions',
        icon: '🏆',
        unlockedAt: emissions[49].timestamp
      });
    }

    if (totalEmissionsKg < 1) {
      achievements.push({
        id: 'low_carbon',
        title: 'Eco Warrior',
        description: 'Maintained low carbon emissions',
        icon: '🌱'
      });
    }

    res.json({
      progress,
      achievements,
      summary: {
        totalSessions,
        totalEmissionsKg: totalEmissionsKg.toFixed(3),
        firstSession: emissions[0].timestamp,
        latestSession: emissions[emissions.length - 1].timestamp
      }
    });

  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({ message: 'Error fetching progress data' });
  }
});

module.exports = router;
const mongoose = require('mongoose');
const CloudRegion = require('../models/CloudRegion');
require('dotenv').config();

const awsRegions = [
  {
    region_code: 'us-west-2',
    region_name: 'US West (Oregon)',
    provider: 'AWS',
    location: {
      country: 'USA',
      city: 'Oregon',
      coordinates: { latitude: 45.5152, longitude: -122.6784 }
    },
    carbon_intensity: 85, // gCO2/kWh - Very low (hydropower)
    renewable_percentage: 85,
    availability_zones: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
    pricing_per_hour: { compute: 0.10, storage: 0.023, network: 0.09 }
  },
  {
    region_code: 'eu-north-1',
    region_name: 'EU (Stockholm)',
    provider: 'AWS',
    location: {
      country: 'Sweden',
      city: 'Stockholm',
      coordinates: { latitude: 59.3293, longitude: 18.0686 }
    },
    carbon_intensity: 45, // Extremely low (nuclear + hydro)
    renewable_percentage: 95,
    availability_zones: ['eu-north-1a', 'eu-north-1b', 'eu-north-1c'],
    pricing_per_hour: { compute: 0.095, storage: 0.021, network: 0.09 }
  },
  {
    region_code: 'ca-central-1',
    region_name: 'Canada (Montreal)',
    provider: 'AWS',
    location: {
      country: 'Canada',
      city: 'Montreal',
      coordinates: { latitude: 45.5017, longitude: -73.5673 }
    },
    carbon_intensity: 30, // Extremely low (hydropower)
    renewable_percentage: 98,
    availability_zones: ['ca-central-1a', 'ca-central-1b'],
    pricing_per_hour: { compute: 0.098, storage: 0.023, network: 0.09 }
  },
  {
    region_code: 'us-east-1',
    region_name: 'US East (Virginia)',
    provider: 'AWS',
    location: {
      country: 'USA',
      city: 'Virginia',
      coordinates: { latitude: 37.5407, longitude: -77.4360 }
    },
    carbon_intensity: 380, // Medium-high
    renewable_percentage: 35,
    availability_zones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
    pricing_per_hour: { compute: 0.096, storage: 0.023, network: 0.09 }
  },
  {
    region_code: 'ap-southeast-2',
    region_name: 'Asia Pacific (Sydney)',
    provider: 'AWS',
    location: {
      country: 'Australia',
      city: 'Sydney',
      coordinates: { latitude: -33.8688, longitude: 151.2093 }
    },
    carbon_intensity: 620, // High (coal-heavy)
    renewable_percentage: 25,
    availability_zones: ['ap-southeast-2a', 'ap-southeast-2b', 'ap-southeast-2c'],
    pricing_per_hour: { compute: 0.114, storage: 0.025, network: 0.114 }
  },
  {
    region_code: 'eu-west-1',
    region_name: 'EU (Ireland)',
    provider: 'AWS',
    location: {
      country: 'Ireland',
      city: 'Dublin',
      coordinates: { latitude: 53.3498, longitude: -6.2603 }
    },
    carbon_intensity: 250, // Medium (wind + gas)
    renewable_percentage: 55,
    availability_zones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
    pricing_per_hour: { compute: 0.104, storage: 0.023, network: 0.09 }
  },
  {
    region_code: 'sa-east-1',
    region_name: 'South America (São Paulo)',
    provider: 'AWS',
    location: {
      country: 'Brazil',
      city: 'São Paulo',
      coordinates: { latitude: -23.5505, longitude: -46.6333 }
    },
    carbon_intensity: 95, // Low (hydropower dominant)
    renewable_percentage: 82,
    availability_zones: ['sa-east-1a', 'sa-east-1b', 'sa-east-1c'],
    pricing_per_hour: { compute: 0.133, storage: 0.0405, network: 0.16 }
  }
];

async function seedRegions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await CloudRegion.deleteMany({});
    console.log('Cleared existing regions');
    
    await CloudRegion.insertMany(awsRegions);
    console.log(`Inserted ${awsRegions.length} AWS regions`);
    
    const regions = await CloudRegion.find().sort({ carbon_intensity: 1 });
    console.log('\nRegions sorted by carbon intensity:');
    regions.forEach(r => {
      console.log(`${r.region_name}: ${r.carbon_intensity} gCO2/kWh (${r.renewable_percentage}% renewable)`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding regions:', error);
    process.exit(1);
  }
}

seedRegions();
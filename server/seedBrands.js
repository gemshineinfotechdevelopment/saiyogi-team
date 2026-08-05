import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from './models/Brand.js';

dotenv.config();

const initialBrands = [
  {
    brandId: 'b0001',
    name: 'Standard Fireworks',
    phone: '+91 94880 73004',
    logo: '/sky_rocket_box.png',
    description: 'Sivakasi Premium Quality Sparklers & Rockets',
    itemsCount: 45,
    isActive: true,
  },
  {
    brandId: 'b0002',
    name: 'Ajanta Pyrotechnics',
    phone: '+91 94880 73005',
    logo: '/flower_pots.png',
    description: 'Top Quality Flower Pots & Aerial Display',
    itemsCount: 30,
    isActive: true,
  },
  {
    brandId: 'b0003',
    name: 'Sri Kaliswari Cock Brand',
    phone: '+91 94880 73006',
    logo: '/royal_celebration.png',
    description: 'Heritage Crackers & Sound Crackers',
    itemsCount: 60,
    isActive: true,
  },
  {
    brandId: 'b0004',
    name: 'Sony Crackers',
    phone: '+91 94880 73007',
    logo: '/family_star_kit.png',
    description: 'Festive Special Fancy Fountains & Shots',
    itemsCount: 25,
    isActive: true,
  },
];

const seedBrands = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    for (const b of initialBrands) {
      const existing = await Brand.findOne({ brandId: b.brandId });
      if (!existing) {
        await Brand.create(b);
        console.log(`Brand ${b.brandId} - ${b.name} seeded successfully.`);
      } else {
        console.log(`Brand ${b.brandId} already exists.`);
      }
    }

    console.log('Brands Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding brands:', error);
    process.exit(1);
  }
};

seedBrands();

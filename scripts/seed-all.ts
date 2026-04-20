import { execSync } from 'child_process';

console.log('🌱 Starting database seeding...\n');

const scripts = [
  { name: 'Intersections', file: 'seed-intersections.ts' },
  { name: 'Traffic Data', file: 'seed-traffic-data.ts' },
  { name: 'Events', file: 'seed-events.ts' },
];

for (const script of scripts) {
  console.log(`\n📦 Seeding ${script.name}...`);
  try {
    execSync(`npx tsx scripts/${script.file}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Failed to seed ${script.name}`);
    process.exit(1);
  }
}

console.log('\n✨ All seeding completed successfully!');

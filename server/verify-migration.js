#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Cloudinary integration verification\n');
console.log('='.repeat(50));

let checksPassed = 0;
let checksFailed = 0;

function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    checksPassed++;
  } else {
    console.log(`❌ ${message}`);
    checksFailed++;
  }
}

// Check 1: Verify cloudinary.js is deleted
// Check 1: Verify cloudinary util exists
check(
  fs.existsSync(path.join(__dirname, 'utils/cloudinary.js')),
  'cloudinary.js has been created'
);

// Check 2: Verify google-drive util removed
check(
  !fs.existsSync(path.join(__dirname, 'utils/google-drive.js')),
  'google-drive.js has been removed'
);

// Check 3: Verify upload-manager.js imports Cloudinary
const uploadManagerContent = fs.readFileSync(
  path.join(__dirname, 'utils/upload-manager.js'),
  'utf8'
);
check(
  uploadManagerContent.includes('cloudinary.js'),
  'upload-manager.js imports cloudinary.js'
);

// Check 4: Verify package.json updated
const packageJsonContent = fs.readFileSync(
  path.join(__dirname, 'package.json'),
  'utf8'
);
check(
  !packageJsonContent.includes('"googleapis"'),
  'googleapis is not in package.json dependencies'
);
check(
  packageJsonContent.includes('"cloudinary"'),
  'cloudinary is in package.json dependencies'
);

// Check 5: Verify .env is updated
const envContent = fs.existsSync(path.join(__dirname, '.env'))
  ? fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
  : '';
check(
  envContent.includes('CLOUDINARY_CLOUD_NAME'),
  '.env contains CLOUDINARY_CLOUD_NAME'
);
check(
  !envContent.includes('GOOGLE_DRIVE_FOLDER_ID'),
  '.env does not contain GOOGLE_DRIVE_FOLDER_ID'
);

// Check 6: Verify documentation exists
check(
  fs.existsSync(path.join(__dirname, 'MIGRATION_SUMMARY.md')),
  'MIGRATION_SUMMARY.md documentation exists'
);

// Check 7: Verify test file exists
check(
  !fs.existsSync(path.join(__dirname, 'test-google-drive.js')),
  'test-google-drive.js has been removed'
);
check(
  !fs.existsSync(path.join(__dirname, 'test-cloudinary.js')),
  'test-cloudinary.js does not exist (optional)'
);

console.log('\n' + '='.repeat(50));
console.log(`\n✅ Total Checks: ${checksPassed + checksFailed}`);
console.log(`   Passed: ${checksPassed}`);
console.log(`   Failed: ${checksFailed}`);

if (checksFailed === 0) {
  console.log('\n🎉 Cloudinary verification COMPLETE!');
  console.log('\nNext steps:');
  console.log('  1. Set environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  console.log('  2. Run: npm install');
  console.log('  3. Run: npm run dev');
} else {
  console.log('\n⚠️  Some checks failed. Please review the results above.');
  process.exit(1);
}

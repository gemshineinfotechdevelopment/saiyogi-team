import dotenv from 'dotenv';
dotenv.config();

console.log('--- ENV DEBUG ---');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || '(not set)');
console.log('Expected Bucket:', `${process.env.FIREBASE_PROJECT_ID || 'crackers-c2008'}.appspot.com`);
console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID || '(not set)');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '(set)' : '(not set)');

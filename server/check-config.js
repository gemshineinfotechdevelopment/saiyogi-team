import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

try {
    // Attempt to read the file that actually exists
    const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));

    console.log('--- CONFIG CHECK ---');
    console.log('Service Account Project ID:', serviceAccount.project_id);
    console.log('Env FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

    if (serviceAccount.project_id !== process.env.FIREBASE_PROJECT_ID) {
        console.error('❌ MISMATCH: Service Account and Env Project ID do not match!');
        console.log(`SUGGESTION: Set FIREBASE_PROJECT_ID=${serviceAccount.project_id} in .env`);
    } else {
        console.log('✅ Project IDs match.');
    }
    console.log('--------------------');
} catch (err) {
    console.error('Error reading firebase-service-account.json:', err.message);
}

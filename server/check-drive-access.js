import dotenv from 'dotenv';
import fs from 'fs';
import { google } from 'googleapis';

dotenv.config();

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const CRED_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-service-account.json';

async function main() {
  try {
    if (!FOLDER_ID) {
      console.error('ERROR: GOOGLE_DRIVE_FOLDER_ID is not set in .env');
      process.exit(1);
    }

    if (!fs.existsSync(CRED_PATH)) {
      console.error(`ERROR: credential file not found at ${CRED_PATH}`);
      process.exit(1);
    }

    const auth = new google.auth.GoogleAuth({
      keyFilename: CRED_PATH,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Checking access to folder id:', FOLDER_ID);

    try {
      const res = await drive.files.get({
        fileId: FOLDER_ID,
        fields: 'id, name, driveId, owners, permissions',
        supportsAllDrives: true
      });

      console.log('Folder info:');
      console.log('  id:', res.data.id);
      console.log('  name:', res.data.name);
      console.log('  driveId:', res.data.driveId || '(no driveId - likely a My Drive folder)');
      console.log('Permissions:');
      console.log(JSON.stringify(res.data.permissions, null, 2));
      console.log('\nIf the service account is not listed in permissions, add the service account email as a member of the Shared Drive (Manage members) with at least "Content manager" access.');
      process.exit(0);
    } catch (err) {
      console.error('Drive API error when fetching folder:', err.message || err);
      console.log('\nCommon cause: the folder is inside a Shared Drive but the service account is not a member, or the folder is not a Shared Drive folder and service accounts do not have regular Drive quota.');
      console.log('\nService account email to add as member (found in server/google-service-account.json):');
      try {
        const svc = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
        console.log('  ', svc.client_email);
      } catch (e) {
        console.error('  (could not read service account file)');
      }
      console.log('\nSteps to resolve:');
      console.log('  1) Open the shared drive at the link you provided.');
      console.log('  2) Click the shared drive name → Manage members.');
      console.log('  3) Add the service account email above and grant "Content manager" or "Manager" access.');
      console.log('  4) Re-run this script to verify access, then try uploading again.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();

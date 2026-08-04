import { firestore } from './firebase.js';

async function cleanupSoftDeleted() {
    console.log('🔍 Checking for soft-deleted (isActive: false) products...');

    try {
        const snapshot = await firestore.collection('products').get();
        const softDeleted = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isActive === false) {
                softDeleted.push({ id: doc.id, name: data.name });
            }
        });

        console.log(`Found ${softDeleted.length} soft-deleted products.`);

        if (softDeleted.length > 0) {
            console.log('Cleaning them up to enable hard delete consistency...');

            const batch = firestore.batch();
            softDeleted.forEach(p => {
                const ref = firestore.collection('products').doc(p.id);
                batch.delete(ref);
                console.log(`- Scheduled delete for: ${p.name} (${p.id})`);
            });

            await batch.commit();
            console.log('✅ Successfully deleted all soft-deleted products.');
        } else {
            console.log('✅ No soft-deleted products found. Database is clean.');
        }

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

cleanupSoftDeleted();

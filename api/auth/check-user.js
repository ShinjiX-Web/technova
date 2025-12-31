// Check if user exists via Firebase Admin SDK
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already initialized
function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    // Check for Firebase Admin configuration
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin configuration missing')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }
  return admin
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const firebaseAdmin = getFirebaseAdmin()

    // Try to get user by email
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email.toLowerCase())

    return res.status(200).json({ exists: !!userRecord })
  } catch (error) {
    // Firebase throws an error if user doesn't exist
    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({ exists: false })
    }

    console.error('Check user error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


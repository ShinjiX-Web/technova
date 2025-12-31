// Reset password via Firebase Admin SDK
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

  const { email, newPassword } = req.body

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' })
  }

  try {
    const firebaseAdmin = getFirebaseAdmin()

    // Get user by email
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email.toLowerCase())

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update user's password
    await firebaseAdmin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    })

    console.log('✅ Password updated for:', email)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Password reset error:', error)

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' })
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}


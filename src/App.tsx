import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { auth, db } from './firebase'
import { getUserProfile, createUserProfileFromEmail } from './lib/db'
import type { UserProfile } from './types'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

type AppState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; firebaseUser: User; currentUser: UserProfile; otherUser: UserProfile }

export default function App() {
  const [appState, setAppState] = useState<AppState>({ status: 'loading' })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setAppState({ status: 'unauthenticated' })
        return
      }

      try {
        // Try to get current user profile, create if doesn't exist
        let currentUser = await getUserProfile(firebaseUser.uid)
        if (!currentUser) {
          const email = firebaseUser.email ?? ''
          currentUser = await createUserProfileFromEmail(firebaseUser.uid, email)
        }

        // Find the other user — query all users, find the one that's not us
        const usersSnap = await getDocs(collection(db, 'users'))
        let otherUser: UserProfile | null = null
        for (const docSnap of usersSnap.docs) {
          if (docSnap.id !== firebaseUser.uid) {
            const data = docSnap.data()
            otherUser = {
              uid: docSnap.id,
              name: data.name as string,
              username: data.username as string,
              color: data.color as 'cyan' | 'orange',
              emoji: data.emoji as string,
            }
            break
          }
        }

        if (!otherUser) {
          // Other user hasn't logged in yet — create a placeholder
          const isBro1 = currentUser.username === 'bro1'
          otherUser = {
            uid: 'placeholder',
            name: isBro1 ? 'Hermano 2' : 'Hermano 1',
            username: isBro1 ? 'bro2' : 'bro1',
            color: isBro1 ? 'orange' : 'cyan',
            emoji: isBro1 ? '🎨' : '💻',
          }
        }

        setAppState({
          status: 'authenticated',
          firebaseUser,
          currentUser,
          otherUser,
        })
      } catch (err) {
        console.error('Error loading user profile:', err)
        setAppState({ status: 'unauthenticated' })
      }
    })

    return unsubscribe
  }, [])

  if (appState.status === 'loading') {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-flicker neon-cyan">💸</div>
          <div className="text-green-400 text-sm tracking-widest animate-pulse">
            CARGANDO SISTEMA...
          </div>
        </div>
      </div>
    )
  }

  if (appState.status === 'unauthenticated') {
    return <Login />
  }

  return (
    <Dashboard
      currentUser={appState.currentUser}
      otherUser={appState.otherUser}
      onLogout={() => auth.signOut()}
    />
  )
}

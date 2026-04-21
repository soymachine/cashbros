import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { auth, db } from './firebase'
import { getUserProfile, createUserProfileFromEmail } from './lib/db'
import type { UserProfile } from './types'
import Login from './pages/Login'
import Home from './pages/Home'

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
        let currentUser = await getUserProfile(firebaseUser.uid)
        if (!currentUser) {
          const email = firebaseUser.email ?? ''
          currentUser = await createUserProfileFromEmail(firebaseUser.uid, email)
        }

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
          const isDani = currentUser.username === 'dani'
          otherUser = {
            uid: 'placeholder',
            name: isDani ? 'Eric' : 'Dani',
            username: isDani ? 'eric' : 'dani',
            color: isDani ? 'orange' : 'cyan',
            emoji: isDani ? '🎨' : '💻',
          }
        }

        setAppState({ status: 'authenticated', firebaseUser, currentUser, otherUser })
      } catch (err) {
        console.error('Error loading user profile:', err)
        setAppState({ status: 'unauthenticated' })
      }
    })

    return unsubscribe
  }, [])

  if (appState.status === 'loading') {
    return <div style={{ height: '100dvh', background: '#ffffff' }} />
  }

  if (appState.status === 'unauthenticated') {
    return <Login />
  }

  return (
    <Home
      currentUser={appState.currentUser}
      otherUser={appState.otherUser}
      onLogout={() => auth.signOut()}
    />
  )
}

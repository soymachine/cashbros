import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Transaction, UserProfile } from '../types'

export function getTransactions(
  onUpdate: (txs: Transaction[]) => void,
): () => void {
  const q = query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        amount: data.amount as number,
        description: data.description as string,
        category: data.category as string,
        type: data.type as 'expense' | 'settlement',
        payerId: data.payerId as string,
        payerName: data.payerName as string,
        createdAt: (data.createdAt as Timestamp).toDate(),
      }
    })
    onUpdate(transactions)
  })

  return unsubscribe
}

export async function addTransaction(
  data: Omit<Transaction, 'id' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(db, 'transactions'), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, 'transactions', id))
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, 'users', uid))
  if (!docSnap.exists()) return null
  const data = docSnap.data()
  return {
    uid,
    name: data.name as string,
    username: data.username as string,
    color: data.color as 'cyan' | 'orange',
    emoji: data.emoji as string,
  }
}

export async function initializeUsers(
  users: Array<{ uid: string } & Omit<UserProfile, 'uid'>>,
): Promise<void> {
  for (const user of users) {
    const { uid, ...rest } = user
    await setDoc(doc(db, 'users', uid), rest, { merge: true })
  }
}

export async function createUserProfileFromEmail(
  uid: string,
  email: string,
): Promise<UserProfile> {
  const isDani = email.startsWith('dani')

  const profile: Omit<UserProfile, 'uid'> = isDani
    ? {
        name: 'Dani',
        username: 'dani',
        color: 'cyan',
        emoji: '💻',
      }
    : {
        name: 'Eric',
        username: 'eric',
        color: 'orange',
        emoji: '🎨',
      }

  await setDoc(doc(db, 'users', uid), profile, { merge: true })

  return { uid, ...profile }
}

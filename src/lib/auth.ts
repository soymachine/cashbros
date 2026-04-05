import { SignJWT, jwtVerify } from 'jose'

export type TokenPayload = {
  userId: string
  username: string
  name: string
  color: string
  emoji: string
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET || 'cashbros-super-secret-jwt-key-change-in-production'
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
  return token
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

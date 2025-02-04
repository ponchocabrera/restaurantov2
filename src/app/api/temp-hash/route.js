import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  const password = 'hola1234'; // Your desired password
  const hashedPassword = await bcrypt.hash(password, 10);
  return NextResponse.json({ hash: hashedPassword });
} 
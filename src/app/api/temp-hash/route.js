import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const password = 'hola1234'; // Your desired password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the user directly
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = 1 RETURNING id',
      [hashedPassword]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
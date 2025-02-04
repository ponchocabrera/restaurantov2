import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Registration details:', {
      email,
      passwordLength: password.length,
      hashLength: hashedPassword.length
    });
    
    const result = await query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, hashedPassword]
    );
    
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed: ' + error.message },
      { status: 500 }
    );
  }
} 
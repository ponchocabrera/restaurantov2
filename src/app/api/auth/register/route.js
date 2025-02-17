import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    console.log('Registration details:', { 
      email, 
      passwordLength: password.length,
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password length:', hashedPassword.length);

    // Insert user with hashed password
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    console.log('User created:', result.rows[0]);
    
    return Response.json({ 
      success: true, 
      user: { id: result.rows[0].id, email: result.rows[0].email } 
    });

  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    // Return more specific error messages
    if (error.code === '23505') { // unique violation
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    return Response.json({ 
      error: 'Registration failed', 
      details: error.message 
    }, { status: 500 });
  }
} 
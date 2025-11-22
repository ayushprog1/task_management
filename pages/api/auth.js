// pages/api/auth.js

import bcrypt from 'bcryptjs';
import prisma from '../../lib/db';
import { generateToken } from '../../lib/auth'; // Imports function from lib/auth.js

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
  const { action, email, password, role } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (action === 'login') {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = generateToken(user); 

      return res.status(200).json({
        message: 'Login successful',
        token,
        userId: user.id,
        email: user.email,
        role: user.role, 
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error during login.' });
    }
  }

  if (action === 'signup' && role === 'Admin') {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const newUser = await prisma.user.create({
        data: { email, password: hashedPassword, role: role, firstName: 'Admin' }
      });

      return res.status(201).json({ message: `Admin user created: ${newUser.email}` });

    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ message: 'Internal server error during signup.' });
    }
  }

  return res.status(400).json({ message: 'Invalid action.' });
}
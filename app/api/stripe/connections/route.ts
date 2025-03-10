import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const connections = await prisma.stripeConnection.findMany({
      select: {
        id: true,
        stripeAccountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching Stripe connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe connections' },
      { status: 500 }
    );
  }
} 
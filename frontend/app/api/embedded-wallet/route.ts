import { NextResponse } from 'next/server';

const DYNAMIC_API_URL = 'https://app.dynamicauth.com/api/v0';

export async function POST(request: Request) {
  try {
    const { email, environmentId } = await request.json();

    if (!email || !environmentId) {
      return NextResponse.json(
        { error: 'Email and environmentId are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DYNAMIC_API_URL}/environments/${environmentId}/embeddedWallets`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.DYNAMIC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: email,
          type: 'email',
          chains: ['EVM'],
          chain: 'EVM',
          socialProvider: 'emailOnly'
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create embedded wallet' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating embedded wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

const DYNAMIC_API_URL = 'https://app.dynamicauth.com/api/v0';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

    console.log('sending email to dynamic', email);

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
    console.log('response', response);
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create embedded wallet' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract just the walletPublicKey from the response
    const walletPublicKey = data.user?.walletPublicKey;
    
    return NextResponse.json({
      ...data,
      walletPublicKey // Include this specifically in the response
    });
  } catch (error) {
    console.error('Error creating embedded wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

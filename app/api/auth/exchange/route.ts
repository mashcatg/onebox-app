import { NextRequest, NextResponse } from 'next/server'
import { nylas } from '@/lib/nylas'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()
    
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Decode state parameter
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId, provider } = decodedState

    // Exchange code for Nylas token
    const tokenResponse = await fetch(`${process.env.NYLAS_API_URI}/v3/connect/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID,
        client_secret: process.env.NYLAS_API_KEY,
        code: code,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json()
      throw new Error(error.error || 'Failed to exchange token')
    }

    const data = await tokenResponse.json()
    const { grant_id: grantId, email } = data

    // Create Supabase client with cookies
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies()
    })

    // Store the account in the database
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .insert({
        user_id: userId,
        grant_id: grantId,
        email: email,
        provider: provider,
        grant_status: 'valid',
        is_primary: false // Will be set to true if this is the first account
      })
      .select()
      .single()

    if (accountError) throw accountError

    // If this is the user's first account, make it primary
    const { data: existingAccounts } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', userId)

    if (existingAccounts?.length === 1) {
      await supabase
        .from('email_accounts')
        .update({ is_primary: true })
        .eq('id', account.id)
    }

    return NextResponse.json({ 
      success: true,
      account: account
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Failed to connect account' },
      { status: 500 }
    )
  }
}
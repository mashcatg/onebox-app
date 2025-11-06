import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const nylasApiKey = process.env.NYLAS_API_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grantId = searchParams.get('grant_id')
    const limit = searchParams.get('limit') || '50'
    const cursor = searchParams.get('cursor')

    if (!grantId) {
      return NextResponse.json(
        { error: 'Missing grant_id parameter' },
        { status: 400 }
      )
    }

    // Verify the grant exists and is valid
    const { data: account, error: accountError } = await supabaseAdmin
      .from('email_accounts')
      .select('grant_id, grant_status')
      .eq('grant_id', grantId)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Invalid grant_id' },
        { status: 404 }
      )
    }

    if (account.grant_status !== 'valid') {
      return NextResponse.json(
        { error: 'Grant is no longer valid' },
        { status: 403 }
      )
    }

    // Fetch messages from Nylas
    const url = new URL(`${process.env.NYLAS_API_URI || 'https://api.us.nylas.com'}/v3/grants/${grantId}/messages`)
    url.searchParams.set('limit', limit)
    if (cursor) {
      url.searchParams.set('cursor', cursor)
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${nylasApiKey}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Nylas API error:', await response.text())
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Message fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
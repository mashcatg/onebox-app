import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    // Get the cookie store and create Supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    })

    console.log('Checking session in accounts API...')
    const sessionResult = await supabase.auth.getSession()
    console.log('Session result:', JSON.stringify(sessionResult, null, 2))
    
    const { data: { session }, error: sessionError } = sessionResult
    
    if (sessionError) {
      console.error('Session error in accounts API:', sessionError)
      return NextResponse.json(
        { error: 'Session error', details: sessionError.message },
        { status: 401 }
      )
    }

    if (!session) {
      console.log('No session found in accounts API')
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      )
    }

    console.log('Session found, user ID:', session.user.id)

    // Get user's email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select(`
        id,
        grant_id,
        email,
        provider,
        grant_status,
        is_primary,
        settings,
        connected_at,
        last_sync
      `)
      .eq('user_id', session.user.id)
      .order('is_primary', { ascending: false })

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return NextResponse.json(
        { error: 'Database error', details: accountsError.message },
        { status: 500 }
      )
    }

    console.log('Successfully fetched accounts:', accounts?.length ?? 0)
    const responseHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Content-Type': 'application/json',
      'Pragma': 'no-cache',
      'Expires': '0'
    }

    return NextResponse.json(accounts || [], {
      headers: responseHeaders
    })
  } catch (error) {
    console.error('Unexpected error in accounts API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
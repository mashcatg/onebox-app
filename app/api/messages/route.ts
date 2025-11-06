import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const grantId = searchParams.get('grantId')
  const limit = searchParams.get('limit') || '50'
  const cursor = searchParams.get('cursor')

  if (!grantId) {
    return NextResponse.json({ error: 'Grant ID is required' }, { status: 400 })
  }

  try {
    const url = new URL(`https://api.us.nylas.com/v3/grants/${grantId}/messages`)
    url.searchParams.set('limit', limit)
    if (cursor) {
      url.searchParams.set('cursor', cursor)
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Nylas API error: ${error}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
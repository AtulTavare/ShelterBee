import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      recipientMobile, 
      customerName, 
      templateName, 
      components 
    } = req.body

    if (!recipientMobile || !templateName) {
      return res.status(400).json({ 
        error: 'recipientMobile and templateName are required' 
      })
    }

    // Format phone number - ensure it has country code
    // Remove any spaces, dashes, brackets
    const cleanMobile = recipientMobile
      .toString()
      .replace(/[\s\-\(\)]/g, '')
    
    // Add 91 prefix if not present (India)
    const formattedMobile = cleanMobile.startsWith('+') 
      ? cleanMobile.slice(1) 
      : cleanMobile.startsWith('91') 
        ? cleanMobile 
        : `91${cleanMobile}`

    const response = await fetch(
      'https://backend.chatmitra.com/developer/api/send_message',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CHATMITRA_API_TOKEN}`
        },
        body: JSON.stringify({
          recipient_mobile_number: formattedMobile,
          customer_name: customerName || 'User',
          messages: [{
            kind: 'template',
            template: {
              name: templateName,
              language: 'en_US',
              components: components || []
            }
          }]
        })
      }
    )

    const data = await response.json()
    console.log('WhatsApp API response:', data)

    if (!response.ok) {
      console.error('WhatsApp send failed:', data)
      return res.status(response.status).json({ 
        error: 'WhatsApp send failed', 
        details: data 
      })
    }

    return res.status(200).json({ 
      success: true, 
      data 
    })

  } catch (error: any) {
    console.error('WhatsApp service error:', error)
    return res.status(500).json({ 
      error: error.message 
    })
  }
}

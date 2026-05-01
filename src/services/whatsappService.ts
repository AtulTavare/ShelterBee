const sendWhatsApp = async (
  recipientMobile: string,
  customerName: string,
  templateName: string,
  components: any[]
): Promise<void> => {
  try {
    if (!recipientMobile) {
      console.warn('WhatsApp: No mobile number provided, skipping')
      return
    }

    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientMobile,
        customerName,
        templateName,
        components
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp failed:', data)
    } else {
      console.log('WhatsApp sent successfully:', templateName)
    }
  } catch (error) {
    // Never crash main flow if WhatsApp fails
    console.error('WhatsApp service error:', error)
  }
}

// Helper to build body component with variables
const buildBodyComponent = (parameters: string[]) => ({
  type: 'body',
  parameters: parameters.map(value => ({
    type: 'text',
    text: value || 'N/A'
  }))
})

export const sendBookingConfirmationToVisitor = async (
  visitorMobile: string,
  visitorName: string,
  propertyName: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalAmount: number,
  address: string,
  googleMapsLink?: string
): Promise<void> => {
  await sendWhatsApp(
    visitorMobile,
    visitorName,
    'booking_confirmation_for_visitors_20260429162121',
    [buildBodyComponent([
      visitorName,
      propertyName,
      checkIn,
      checkOut,
      guests.toString(),
      `₹${totalAmount}`,
      address,
      googleMapsLink || 'Not provided'
    ])]
  )
}

export const sendBookingRejectionToVisitor = async (
  visitorMobile: string,
  visitorName: string,
  propertyName: string
): Promise<void> => {
  await sendWhatsApp(
    visitorMobile,
    visitorName,
    'visitor_apologies_20260428005608',
    [buildBodyComponent([
      visitorName,
      propertyName
    ])]
  )
}

export const sendNewBookingAlertToOwner = async (
  ownerMobile: string,
  ownerName: string,
  propertyName: string,
  guestName: string,
  guestContact: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  guests: number,
  bookingId: string,
  totalAmount: number
): Promise<void> => {
  const commission = Math.round(totalAmount * 0.25)
  const ownerPayout = Math.round(totalAmount * 0.75)

  await sendWhatsApp(
    ownerMobile,
    ownerName,
    'booking_alert_for_channel_partner_20260428005151',
    [buildBodyComponent([
      propertyName,
      guestName,
      guestContact,
      checkIn,
      checkOut,
      nights.toString(),
      guests.toString(),
      bookingId.substring(0, 8).toUpperCase(),
      `₹${totalAmount}`,
      `₹${commission}`,
      `₹${ownerPayout}`
    ])]
  )
}

export const sendPropertyApprovalToOwner = async (
  ownerMobile: string,
  ownerName: string,
  propertyName: string
): Promise<void> => {
  await sendWhatsApp(
    ownerMobile,
    ownerName,
    'property_approval_template__20260428003741',
    [buildBodyComponent([
      ownerName,
      propertyName
    ])]
  )
}

export const sendPropertyRejectionToOwner = async (
  ownerMobile: string,
  ownerName: string,
  propertyName: string,
  rejectionReason: string
): Promise<void> => {
  await sendWhatsApp(
    ownerMobile,
    ownerName,
    'property_rejection_template_20260427165038',
    [buildBodyComponent([
      ownerName,
      propertyName,
      rejectionReason
    ])]
  )
}

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
    console.error('WhatsApp service error:', error)
  }
}

const buildBodyComponent = (parameters: string[]) => ({
  type: 'body',
  parameters: parameters.map(value => ({
    type: 'text',
    text: value || 'N/A'
  }))
})

const buildButtonComponent = (subType: string, index: string, parameters: { type: string; text: string }[]) => ({
  type: 'button',
  sub_type: subType,
  index,
  parameters
})

export const sendOTPViaWhatsApp = async (
  whatsappNumber: string,
  otp: string
): Promise<void> => {
  await sendWhatsApp(
    whatsappNumber,
    'User',
    'otp_verification_20260514175355',
    [
      buildBodyComponent([otp]),
      buildButtonComponent('url', '0', [{ type: 'text', text: otp }])
    ]
  )
}

export const sendChannelPartnerBookingAlert = async (
  ownerWhatsapp: string,
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
  await sendWhatsApp(
    ownerWhatsapp,
    ownerName,
    'channel_partner_after_booking_20260510183828',
    [buildBodyComponent([
      propertyName,
      guestName,
      guestContact,
      checkIn,
      checkOut,
      nights.toString(),
      guests.toString(),
      bookingId.substring(0, 8).toUpperCase(),
      `₹${totalAmount}`
    ])]
  )
}

export const sendBookingConfirmation = async (
  visitorWhatsapp: string,
  visitorName: string,
  propertyName: string,
  ownerContact1: string,
  ownerContact2: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  totalAmount: number,
  address: string,
  locationLink: string,
  terms: string
): Promise<void> => {
  await sendWhatsApp(
    visitorWhatsapp,
    visitorName,
    'visitor_after_successful_booking_20260510172747',
    [buildBodyComponent([
      visitorName,
      propertyName,
      ownerContact1,
      ownerContact2,
      checkIn,
      checkOut,
      guests.toString(),
      `₹${totalAmount}`,
      address,
      locationLink,
      terms
    ])]
  )
}

export const sendVisitorCancellationConfirmation = async (
  visitorWhatsapp: string,
  guestName: string,
  propertyName: string,
  checkIn: string,
  checkOut: string,
  bookingId: string,
  refundPolicy: string
): Promise<void> => {
  await sendWhatsApp(
    visitorWhatsapp,
    guestName,
    'visitor_after_cancel_booking_by_them_20260510175140',
    [buildBodyComponent([
      guestName,
      propertyName,
      checkIn,
      checkOut,
      bookingId.substring(0, 8).toUpperCase(),
      refundPolicy
    ])]
  )
}

export const sendOwnerCancellationAlert = async (
  ownerWhatsapp: string,
  ownerName: string,
  propertyName: string,
  guestName: string,
  checkIn: string,
  checkOut: string,
  bookingId: string
): Promise<void> => {
  await sendWhatsApp(
    ownerWhatsapp,
    ownerName,
    'proerty_owner_after_booking_cancel_by_visitor_20260510174608',
    [buildBodyComponent([
      ownerName,
      propertyName,
      guestName,
      checkIn,
      checkOut,
      bookingId.substring(0, 8).toUpperCase()
    ])]
  )
}

export const sendBookingRejectionToVisitor = async (
  visitorWhatsapp: string,
  guestName: string,
  propertyName: string,
  refundPolicy: string
): Promise<void> => {
  await sendWhatsApp(
    visitorWhatsapp,
    guestName,
    'visitor_after_booking_cancellation_by_chann_el_part_20260510174133',
    [buildBodyComponent([
      guestName,
      propertyName,
      refundPolicy
    ])]
  )
}

export const sendPropertyApproval = async (
  ownerWhatsapp: string,
  ownerName: string,
  propertyName: string,
  propertyId: string
): Promise<void> => {
  await sendWhatsApp(
    ownerWhatsapp,
    ownerName,
    'property_approval_to_channel_partner_20260510171406',
    [buildBodyComponent([
      ownerName,
      propertyName,
      propertyId
    ])]
  )
}

export const sendPropertyRejection = async (
  ownerWhatsapp: string,
  ownerName: string,
  propertyName: string,
  rejectionReason: string
): Promise<void> => {
  await sendWhatsApp(
    ownerWhatsapp,
    ownerName,
    'property_rejection_by_admin__20260510171720',
    [buildBodyComponent([
      ownerName,
      propertyName,
      rejectionReason
    ])]
  )
}

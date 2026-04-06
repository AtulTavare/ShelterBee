export const mockProperties = [
  {
    id: 'prop-1',
    ownerId: 'owner-1',
    title: 'Cozy Room near Tech Park',
    type: 'Room',
    area: 'Koramangala',
    address: '123 Tech Park Road, Koramangala, Bangalore',
    pricePerDay: 800,
    deposit: 24000,
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1e5240980c?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['WiFi', 'AC', 'Attached Bathroom'],
    description: 'A comfortable and clean room located just 5 minutes from the main tech park. Perfect for short stays and business travelers.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    availableFrom: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    rating: 4.8,
    reviewCount: 124
  },
  {
    id: 'prop-2',
    ownerId: 'owner-2',
    title: 'Premium PG for Boys',
    type: 'PG',
    area: 'HSR Layout',
    address: '456 Sector 2, HSR Layout, Bangalore',
    pricePerDay: 400,
    deposit: 12000,
    photos: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['Meals Included', 'WiFi', 'Laundry'],
    description: 'Well-maintained PG with all basic amenities including 3 meals a day, high-speed internet, and daily housekeeping.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    availableFrom: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
    rating: 4.5,
    reviewCount: 89
  },
  {
    id: 'prop-3',
    ownerId: 'owner-3',
    title: 'Spacious 2BHK Full Flat',
    type: 'Full Flat',
    area: 'Indiranagar',
    address: '789 100ft Road, Indiranagar, Bangalore',
    pricePerDay: 2500,
    deposit: 75000,
    photos: [
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['AC', 'TV', 'Parking', 'Geyser'],
    description: 'Beautifully furnished 2BHK flat in the heart of Indiranagar. Close to cafes, pubs, and the metro station.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    availableFrom: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    rating: 4.9,
    reviewCount: 210
  },
  {
    id: 'prop-4',
    ownerId: 'owner-1',
    title: 'Budget Room near University',
    type: 'Room',
    area: 'Jayanagar',
    address: '321 4th Block, Jayanagar, Bangalore',
    pricePerDay: 600,
    deposit: 18000,
    photos: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['WiFi', 'Attached Bathroom'],
    description: 'Simple, clean room ideal for students or solo travelers visiting the university area.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    availableFrom: new Date(Date.now() - 86400000 * 20).toISOString(), // 20 days ago
    rating: 4.2,
    reviewCount: 45
  },
  {
    id: 'prop-5',
    ownerId: 'owner-4',
    title: 'Luxury Studio Apartment',
    type: 'Full Flat',
    area: 'Whitefield',
    address: '999 ITPL Main Road, Whitefield, Bangalore',
    pricePerDay: 3000,
    deposit: 90000,
    photos: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['AC', 'WiFi', 'TV', 'Parking', 'Geyser'],
    description: 'Modern studio apartment with premium furnishings, high-speed internet, and a dedicated workspace.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    availableFrom: new Date(Date.now() + 86400000 * 15).toISOString(), // 15 days from now
    rating: 4.7,
    reviewCount: 156
  },
  {
    id: 'prop-6',
    ownerId: 'owner-2',
    title: 'Girls PG with Security',
    type: 'PG',
    area: 'BTM Layout',
    address: '555 2nd Stage, BTM Layout, Bangalore',
    pricePerDay: 450,
    deposit: 13500,
    photos: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['Meals Included', 'WiFi', 'Laundry', 'Security'],
    description: 'Safe and secure PG for girls with 24/7 security, CCTV, and all meals included.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    availableFrom: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    rating: 4.6,
    reviewCount: 312
  },
  {
    id: 'prop-7',
    ownerId: 'owner-3',
    title: 'Modern 1BHK in City Center',
    type: 'Full Flat',
    area: 'MG Road',
    address: '101 Central Ave, MG Road, Bangalore',
    pricePerDay: 1800,
    deposit: 54000,
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['AC', 'WiFi', 'Gym Access'],
    description: 'Perfect for young professionals. Located right in the city center with access to all major transit points.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    rating: 4.3,
    reviewCount: 67
  },
  {
    id: 'prop-8',
    ownerId: 'owner-1',
    title: 'Quiet PG for Working Professionals',
    type: 'PG',
    area: 'Bellandur',
    address: '77 Outer Ring Road, Bellandur, Bangalore',
    pricePerDay: 550,
    deposit: 16500,
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['WiFi', 'Power Backup', 'Meals Included'],
    description: 'A quiet and peaceful PG ideal for IT professionals working in nearby tech parks.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    rating: 4.1,
    reviewCount: 28
  },
  {
    id: 'prop-9',
    ownerId: 'owner-4',
    title: 'Penthouse with City View',
    type: 'Full Flat',
    area: 'Koramangala',
    address: '88 High Street, Koramangala, Bangalore',
    pricePerDay: 5000,
    deposit: 150000,
    photos: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['AC', 'WiFi', 'Private Terrace', 'Parking'],
    description: 'Stunning penthouse offering panoramic views of the city skyline. Fully furnished with luxury amenities.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    rating: 5.0,
    reviewCount: 415
  },
  {
    id: 'prop-10',
    ownerId: 'owner-2',
    title: 'Affordable Shared Room',
    type: 'Room',
    area: 'Electronic City',
    address: 'Phase 1, Electronic City, Bangalore',
    pricePerDay: 300,
    deposit: 9000,
    photos: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: ['WiFi', 'Washing Machine'],
    description: 'Budget-friendly shared room with all basic necessities. Close to major IT companies.',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    rating: 3.9,
    reviewCount: 12
  }
];

export function JsonLd() {
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TaxiLink Pro',
    applicationCategory: 'TransportationApplication',
    operatingSystem: 'Web, iOS, Android',
    url: 'https://taxilink.fr',
    description: 'La plateforme N°1 des chauffeurs professionnels. Gérez vos missions CPAM, clients privés et VTC en temps réel.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2400',
      bestRating: '5',
    },
    author: {
      '@type': 'Organization',
      name: 'TaxiLink Pro',
      url: 'https://taxilink.fr',
    },
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TaxiLink Pro',
    url: 'https://taxilink.fr',
    logo: 'https://taxilink.fr/icons/icon-512.png',
    description: 'Plateforme de gestion de missions pour chauffeurs de taxi et VTC en France.',
    foundingLocation: {
      '@type': 'Country',
      name: 'France',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'French',
    },
    sameAs: [
      'https://www.facebook.com/taxilinkpro',
      'https://twitter.com/taxilink_pro',
      'https://www.linkedin.com/company/taxilink-pro',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  )
}

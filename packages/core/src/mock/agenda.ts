import type { AgendaRide } from '../types/agenda'

const today = new Date()
const dayOffset = (days: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d
}
const dateAt = (dayDelta: number, hour: number, min = 0) => {
  const d = dayOffset(dayDelta)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

export const mockAgendaRides: AgendaRide[] = [
  // Aujourd'hui
  {
    id: 'ag-1',
    type: 'CPAM',
    patientName: 'M. Bernard Durand',
    phone: '+33 6 12 34 56 78',
    departure: '15 rue de la Paix, Paris 8e',
    destination: 'Hôpital Lariboisière, Paris 10e',
    distanceKm: 4.2,
    priceEur: 32.5,
    scheduledAt: dateAt(0, 8, 30),
    driverId: 'driver-marc',
  },
  {
    id: 'ag-2',
    type: 'PRIVE',
    patientName: 'Mme Sophie Martin',
    phone: '+33 6 98 76 54 32',
    departure: 'Gare de Lyon, Paris 12e',
    destination: 'Aéroport CDG Terminal 2',
    distanceKm: 28.6,
    priceEur: 65.0,
    scheduledAt: dateAt(0, 10, 0),
    driverId: 'driver-marc',
  },
  {
    id: 'ag-3',
    type: 'TAXILINK',
    patientName: 'M. Pierre Lefebvre',
    phone: '+33 6 55 44 33 22',
    departure: 'Place de la République',
    destination: 'Clinique Saint-Joseph',
    distanceKm: 6.8,
    priceEur: 44.0,
    scheduledAt: dateAt(0, 14, 15),
    driverId: 'driver-marc',
  },
  // Hier
  {
    id: 'ag-4',
    type: 'CPAM',
    patientName: 'M. Robert Simon',
    phone: '+33 6 33 44 55 66',
    departure: 'Montrouge, rue Victor Hugo',
    destination: 'Hôpital Cochin',
    distanceKm: 5.1,
    priceEur: 28.0,
    scheduledAt: dateAt(-1, 9, 0),
    driverId: 'driver-marc',
  },
  {
    id: 'ag-5',
    type: 'PRIVE',
    patientName: 'Mme Claire Dupont',
    phone: '+33 6 22 33 44 55',
    departure: 'Orly Aéroport',
    destination: '5 rue de Rivoli, Paris 1er',
    distanceKm: 18.3,
    priceEur: 52.0,
    scheduledAt: dateAt(-1, 16, 30),
    driverId: 'driver-marc',
  },
  // Demain
  {
    id: 'ag-6',
    type: 'CPAM',
    patientName: 'Mme Hélène Blanc',
    phone: '+33 6 77 88 99 00',
    departure: '42 avenue Montaigne',
    destination: 'Hôpital Bichat',
    distanceKm: 9.3,
    priceEur: 38.8,
    scheduledAt: dateAt(1, 7, 45),
    driverId: 'driver-marc',
  },
  {
    id: 'ag-7',
    type: 'TAXILINK',
    patientName: 'M. Lucas Petit',
    phone: '+33 6 11 22 33 44',
    departure: 'Tour Eiffel, Paris 7e',
    destination: 'Versailles, Place d\'Armes',
    distanceKm: 22.4,
    priceEur: 58.5,
    scheduledAt: dateAt(1, 11, 30),
    driverId: 'driver-marc',
  },
  // J+2
  {
    id: 'ag-8',
    type: 'CPAM',
    patientName: 'M. André Girard',
    phone: '+33 6 66 77 88 99',
    departure: 'Vincennes, 3 avenue de Paris',
    destination: 'Hôpital Saint-Antoine',
    distanceKm: 7.4,
    priceEur: 31.0,
    scheduledAt: dateAt(2, 8, 0),
    driverId: 'driver-marc',
  },
  // J+3
  {
    id: 'ag-9',
    type: 'PRIVE',
    patientName: 'Mme Isabelle Roy',
    phone: '+33 6 55 66 77 88',
    departure: '10 boulevard Haussmann',
    destination: 'Palais des Congrès',
    distanceKm: 12.1,
    priceEur: 47.5,
    scheduledAt: dateAt(3, 13, 0),
    driverId: 'driver-marc',
  },
  // J+4
  {
    id: 'ag-10',
    type: 'CPAM',
    patientName: 'M. François Leroy',
    phone: '+33 6 44 55 66 77',
    departure: 'Neuilly, 8 avenue Charles de Gaulle',
    destination: 'Hôpital Lariboisière',
    distanceKm: 8.6,
    priceEur: 35.0,
    scheduledAt: dateAt(4, 9, 30),
    driverId: 'driver-marc',
  },
]

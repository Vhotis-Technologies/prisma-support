import type {
  B2CDetails,
  B2CListItem,
  FleetBranchDetails,
  FleetDetails,
  FleetListItem,
  PartnerDetails,
  PartnerListItem,
  PartnerReferredVehicleEntry,
  ReferredUserDetails,
} from "@/app/interfaces/CustomerInterface";

export const MOCK_B2C_CUSTOMERS: B2CDetails[] = [
  {
    id: "b2c_001",
    type: "b2c",
    name: "Amina Okonkwo",
    contact: {
      email: "amina.okonkwo@email.com",
      phone: "+44 7700 900123",
    },
    loyalty_tier: "Platinum",
    total_spend: 2830.75,
    total_bookings: 21,
    address: {
      address: "42 Oak Lane",
      city: "London",
      postcode: "E2 8QY",
      country: "United Kingdom",
      latitude: 51.523,
      longitude: -0.054,
    },
    no_of_vehicles: 2,
    last_booking_date: "18 Mar 2025",
    average_booking_value: 134.8,
    completed_bookings: 20,
    cancelled_bookings: 1,
    preferred_services: ["Full valet", "Interior deep clean"],
    notes: "Prefers eco products and morning slots.",
    vehicles: [
      {
        id: "b2cveh_001",
        make: "Volkswagen",
        model: "Golf",
        year: 2020,
        registration_number: "LN20 GFL",
        color: "Blue",
        vin: "WVWZZZAUZLW123456",
        image_url:
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "08 Mar 2026",
      },
      {
        id: "b2cveh_002",
        make: "Honda",
        model: "Civic",
        year: 2019,
        registration_number: "RD21 ABC",
        color: "Silver",
        vin: "2HGFC2F59KH501234",
        image_url:
          "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "21 Feb 2026",
      },
    ],
  },
  {
    id: "b2c_002",
    type: "b2c",
    name: "James Chen",
    contact: {
      email: "j.chen@example.net",
      phone: "+44 7700 900456",
    },
    loyalty_tier: "Gold",
    total_spend: 1490.0,
    total_bookings: 13,
    address: {
      address: "18 River View",
      city: "Reading",
      postcode: "RG1 8EQ",
      country: "United Kingdom",
      latitude: 51.454,
      longitude: -0.973,
    },
    no_of_vehicles: 1,
    last_booking_date: "15 Mar 2025",
    average_booking_value: 114.62,
    completed_bookings: 12,
    cancelled_bookings: 1,
    preferred_services: ["Interior deep clean"],
    vehicles: [
      {
        id: "b2cveh_003",
        make: "Toyota",
        model: "Corolla",
        year: 2021,
        registration_number: "RG21 CRL",
        color: "White",
        vin: "JTDBU4EE9B9123456",
        image_url:
          "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=60",
        status: "maintenance",
        last_service_date: "01 Mar 2026",
      },
    ],
  },
];

export const MOCK_FLEET_CUSTOMERS: FleetDetails[] = [
  {
    id: "flt_001",
    type: "fleet",
    name: "Northwind Fleet Services",
    contact: {
      email: "fleet@northwind.example",
      phone: "+44 20 7946 0958",
    },
    fleet_owner: "Olivia Mensah",
    no_of_branches: 3,
    no_of_admins: 4,
    total_vehicles: 47,
    subscription: {
      subtype: "Pro",
      billing_type: "monthly",
      started_at: "2025-12-01T09:00:00Z",
      ends_at: "2026-03-31T23:59:59Z",
      is_trial: true,
      trial_ends_at: "2026-01-14T23:59:59Z",
      status: "active",
    },
    total_spend: 22440.35,
    total_bookings: 218,
    referral_code: "NORTHWIND40",
    branches: [
      {
        id: "br_001",
        name: "Croydon Depot",
        city: "Croydon",
        vehicle_count: 19,
        booking_count: 98,
        admin_count: 2,
      },
      {
        id: "br_002",
        name: "Lewisham Yard",
        city: "London",
        vehicle_count: 14,
        booking_count: 71,
        admin_count: 1,
      },
      {
        id: "br_003",
        name: "Dartford Hub",
        city: "Dartford",
        vehicle_count: 14,
        booking_count: 49,
        admin_count: 1,
      },
    ],
    admins: [
      {
        id: "adm_001",
        name: "David Osei",
        email: "david.osei@northwind.example",
        phone: "+44 7700 901002",
        branch_name: "Croydon Depot",
      },
      {
        id: "adm_002",
        name: "James Okoro",
        email: "james.okoro@northwind.example",
        phone: "+44 7700 901003",
        branch_name: "Lewisham Yard",
      },
    ],
  },
];

export const MOCK_FLEET_BRANCH_DETAILS: FleetBranchDetails[] = [
  {
    id: "br_001",
    fleet_id: "flt_001",
    name: "Croydon Depot",
    city: "Croydon",
    vehicle_count: 19,
    booking_count: 98,
    admin_count: 2,
    manager_name: "David Osei",
    manager_email: "david.osei@northwind.example",
    manager_phone: "+44 7700 901002",
    address: {
      address: "Northwind Depot, Unit 4",
      city: "Croydon",
      postcode: "CR0 4WF",
      country: "United Kingdom",
      latitude: 51.376,
      longitude: -0.098,
    },
    spend_limit: 12000,
    spent_this_month: 8640,
    average_booking_value: 128,
    completion_rate: 0.91,
    vehicles: [
      {
        id: "veh_001",
        make: "Ford",
        model: "Transit",
        year: 2022,
        registration_number: "LD22 TRN",
        color: "White",
        vin: "WF0XXXTTGX2A14567",
        image_url:
          "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "12 Feb 2026",
      },
      {
        id: "veh_002",
        make: "Mercedes",
        model: "Vito",
        year: 2021,
        registration_number: "LD71 VTO",
        color: "Grey",
        vin: "WDF63960313884521",
        image_url:
          "https://images.unsplash.com/photo-1517949908118-72f7b349d1f6?auto=format&fit=crop&w=800&q=60",
        status: "maintenance",
        last_service_date: "03 Mar 2026",
      },
    ],
  },
  {
    id: "br_002",
    fleet_id: "flt_001",
    name: "Lewisham Yard",
    city: "London",
    vehicle_count: 14,
    booking_count: 71,
    admin_count: 1,
    manager_name: "James Okoro",
    manager_email: "james.okoro@northwind.example",
    manager_phone: "+44 7700 901003",
    address: {
      address: "Lewisham Trade Park, Plot 6",
      city: "London",
      postcode: "SE13 7SN",
      country: "United Kingdom",
      latitude: 51.461,
      longitude: -0.011,
    },
    spend_limit: 9000,
    spent_this_month: 6110,
    average_booking_value: 119,
    completion_rate: 0.89,
    vehicles: [
      {
        id: "veh_003",
        make: "Vauxhall",
        model: "Vivaro",
        year: 2020,
        registration_number: "LS20 VVR",
        color: "Silver",
        vin: "W0L2VAF68L7004581",
        image_url:
          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "01 Mar 2026",
      },
    ],
  },
  {
    id: "br_003",
    fleet_id: "flt_001",
    name: "Dartford Hub",
    city: "Dartford",
    vehicle_count: 14,
    booking_count: 49,
    admin_count: 1,
    manager_name: "Ella Bamidele",
    manager_email: "ella.bamidele@northwind.example",
    manager_phone: "+44 7700 901010",
    address: {
      address: "Dartford Logistics Centre, Bay 3",
      city: "Dartford",
      postcode: "DA1 1YD",
      country: "United Kingdom",
      latitude: 51.444,
      longitude: 0.219,
    },
    spend_limit: 8500,
    spent_this_month: 4325,
    average_booking_value: 108,
    completion_rate: 0.87,
    vehicles: [
      {
        id: "veh_004",
        make: "Renault",
        model: "Trafic",
        year: 2019,
        registration_number: "DF19 TFC",
        color: "Blue",
        vin: "VF1FL000XKJ873214",
        image_url:
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=60",
        status: "inactive",
        last_service_date: "11 Jan 2026",
      },
    ],
  },
];

export const MOCK_PARTNER_CUSTOMERS: PartnerDetails[] = [
  {
    id: "par_001",
    user_id: "user_par_001",
    type: "partner",
    name: "BrightCare Ltd",
    business_name: "BrightCare Ltd",
    contact: {
      email: "ops@brightcare.example",
      phone: "+44 161 496 0312",
    },
    referral_code: "BRIGHTCARE25",
    total_referred: 86,
    vehicles: [
      {
        id: "parveh_001",
        make: "Ford",
        model: "Transit Custom",
        year: 2020,
        registration_number: "BC20 VAN",
        color: "Silver",
        vin: "WF0XXXGCDXLF12345",
        image_url:
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "01 Mar 2026",
      },
    ],
    address: {
      address: "BrightCare HQ Car Park",
      city: "Manchester",
      postcode: "M1 4BT",
      country: "United Kingdom",
      latitude: 53.48,
      longitude: -2.242,
    },
    total_spend: 10492.4,
    last_booking_date: "22 Mar 2025",
    active_referred: 49,
    churned_referred: 7,
    conversion_rate: 0.57,
    vehicles_registered: 63,
    total_bookings: 214,
    completed_bookings: 193,
    cancelled_bookings: 21,
    revenue_total: 32580.3,
    revenue_this_month: 3411.6,
    commission_total_earned: 4250.5,
    commission_pending: 522.25,
    commission_paid: 3728.25,
  },
];

export const MOCK_PARTNER_REFERRED_USERS: ReferredUserDetails[] = [
  {
    id: "ref_001",
    partner_id: "par_001",
    type: "b2c",
    name: "Liam Carter",
    contact: {
      email: "liam.carter@example.com",
      phone: "+44 7700 911111",
    },
    loyalty_tier: "Silver",
    total_spend: 940.2,
    total_bookings: 9,
    address: {
      address: "12 King Street",
      city: "Manchester",
      postcode: "M2 4AW",
      country: "United Kingdom",
      latitude: 53.481,
      longitude: -2.243,
    },
    no_of_vehicles: 2,
    last_booking_date: "03 Mar 2026",
    average_booking_value: 104.47,
    completed_bookings: 8,
    cancelled_bookings: 1,
    preferred_services: ["Quick valet", "Interior clean"],
    joined_at: "04 Dec 2025",
    last_active_date: "03 Mar 2026",
    referred_status: "active",
    vehicles: [
      {
        id: "refveh_001",
        make: "BMW",
        model: "320d",
        year: 2021,
        registration_number: "MX21 BCD",
        color: "Black",
        vin: "WBA8A92070K123456",
        image_url:
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "20 Feb 2026",
      },
      {
        id: "refveh_002",
        make: "Tesla",
        model: "Model 3",
        year: 2022,
        registration_number: "EV22 TES",
        color: "White",
        vin: "5YJ3E1EA1NF567890",
        image_url:
          "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=60",
        status: "maintenance",
        last_service_date: "09 Mar 2026",
      },
    ],
  },
  {
    id: "ref_002",
    partner_id: "par_001",
    type: "b2c",
    name: "Sophia Green",
    contact: {
      email: "sophia.green@example.com",
      phone: "+44 7700 922222",
    },
    loyalty_tier: "Gold",
    total_spend: 1612.9,
    total_bookings: 14,
    address: {
      address: "4 Deansgate",
      city: "Manchester",
      postcode: "M3 2BW",
      country: "United Kingdom",
      latitude: 53.486,
      longitude: -2.249,
    },
    no_of_vehicles: 1,
    last_booking_date: "11 Mar 2026",
    average_booking_value: 115.21,
    completed_bookings: 13,
    cancelled_bookings: 1,
    preferred_services: ["Full valet", "Paint protection"],
    joined_at: "16 Nov 2025",
    last_active_date: "11 Mar 2026",
    referred_status: "active",
    vehicles: [
      {
        id: "refveh_003",
        make: "Audi",
        model: "Q3",
        year: 2020,
        registration_number: "MN20 AUD",
        color: "Grey",
        vin: "WAUZZZ8U3LR045612",
        image_url:
          "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=800&q=60",
        status: "active",
        last_service_date: "27 Feb 2026",
      },
    ],
  },
];

export const B2C_CUSTOMER_LIST: B2CListItem[] = MOCK_B2C_CUSTOMERS;
export const FLEET_CUSTOMER_LIST: FleetListItem[] = MOCK_FLEET_CUSTOMERS;
export const PARTNER_CUSTOMER_LIST: PartnerListItem[] = MOCK_PARTNER_CUSTOMERS;

export function getB2CCustomerById(id: string): B2CDetails | undefined {
  return MOCK_B2C_CUSTOMERS.find((customer) => customer.id === id);
}

export function getFleetCustomerById(id: string): FleetDetails | undefined {
  return MOCK_FLEET_CUSTOMERS.find((customer) => customer.id === id);
}

export function getFleetBranchById(
  fleetId: string,
  branchId: string
): FleetBranchDetails | undefined {
  return MOCK_FLEET_BRANCH_DETAILS.find(
    (branch) => branch.id === branchId && branch.fleet_id === fleetId
  );
}

export function getPartnerCustomerById(id: string): PartnerDetails | undefined {
  return MOCK_PARTNER_CUSTOMERS.find((customer) => customer.id === id);
}

export function getReferredUsersByPartnerId(partnerId: string): ReferredUserDetails[] {
  return MOCK_PARTNER_REFERRED_USERS.filter((user) => user.partner_id === partnerId);
}

export function getReferredUserById(
  partnerId: string,
  userId: string
): ReferredUserDetails | undefined {
  return MOCK_PARTNER_REFERRED_USERS.find(
    (user) => user.partner_id === partnerId && user.id === userId
  );
}

/** All vehicles linked to users referred by this partner (support-wide list) */
export function getPartnerReferredVehicleEntries(partnerId: string): PartnerReferredVehicleEntry[] {
  return getReferredUsersByPartnerId(partnerId).flatMap((user) =>
    user.vehicles.map((vehicle) => ({
      referredUserId: user.id,
      referredUserName: user.name,
      vehicle,
    }))
  );
}

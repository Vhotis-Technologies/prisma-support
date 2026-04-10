/** Row in the Prisma Crew list (subset of full detail). */
export interface CrewMemberListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  headline: string;
}

export type CrewCommentSource = "customer" | "support";

export interface CrewMemberComment {
  id: string;
  created_at: string;
  text: string;
  author_label: string;
  source: CrewCommentSource;
  rating?: number;
}

/** Full crew profile for support / CrewDetailScreen. */
export interface CrewMemberDetail extends CrewMemberListItem {
  date_joined: string;
  lifetime_earnings: number;
  average_rating: number;
  total_ratings: number;
  total_bookings: number;
  bio?: string;
  specialties: string[];
  service_areas: string[];
  vehicle_types: string[];
  comments: CrewMemberComment[];
}

/** Props for the list row component. */
export interface CrewMemberRowProps {
  member: CrewMemberListItem;
  onPress?: (member: CrewMemberListItem) => void;
}

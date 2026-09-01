export type CrewMemberListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  headline: string;
};

export type CrewCommentSource = "customer" | "support";

export type CrewMemberComment = {
  id: string;
  created_at: string;
  text: string;
  author_label: string;
  source: CrewCommentSource;
  rating?: number;
};

export type CrewMemberDetail = CrewMemberListItem & {
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
};

export type UpdateCrewRequest = {
  crew_id: string;
  is_active?: boolean;
  is_verified?: boolean;
};

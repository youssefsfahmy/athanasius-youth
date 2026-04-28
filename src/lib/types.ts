// Database types

export type ServantProfile = {
  id: string;
  auth_user_id: string;
  full_name: string;
  family_group: string | null;
  created_at: string;
};

export type Person = {
  id: string;
  full_name: string;
  phone_primary: string | null;
  phone_secondary: string | null;
  phone_landline: string | null;
  phone_father: string | null;
  phone_mother: string | null;
  gender: string | null;
  birth_date: string | null;
  address_area: string | null;
  address_building: string | null;
  address_street: string | null;
  address_details: string | null;
  address_floor: string | null;
  address_apartment: string | null;
  address_landmark: string | null;
  education_college: string | null;
  education_university: string | null;
  education_year: string | null;
  church_confession_father: string | null;
  church_family_group: string | null;
  church_family_servant: string | null;
  church_checkup_servant_id: string | null;
  church_last_checkup_date: string | null;
  social_facebook_url: string | null;
  notes_public: string | null;
  notes_private: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: string;
  person_id: string;
  event_date: string;
  event_name: string;
  status: "present" | "absent";
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type AttendanceWithDetails = Attendance & {
  people: { full_name: string } | null;
  servant_profiles: { full_name: string } | null;
};

export type Checkup = {
  id: string;
  person_id: string;
  checkup_date: string;
  contacted_by: string | null;
  method: "call" | "WhatsApp" | "visit" | "other";
  comment: string | null;
  follow_up_needed: boolean;
  next_follow_up_date: string | null;
  created_at: string;
};

export type CheckupWithDetails = Checkup & {
  people: { full_name: string } | null;
  servant_profiles: { full_name: string } | null;
};

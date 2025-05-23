interface doctorProfileProps {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  specialization?: string;
  experience?: number;
  qualifications?: [string];
}

export type { doctorProfileProps };

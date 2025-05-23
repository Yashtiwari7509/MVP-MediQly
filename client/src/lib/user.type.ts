interface UserProps {
  firstName: string;
  lastName: string;
  email: string;
  _id: string;
}

interface userProfileProps {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
}

export type { UserProps, userProfileProps };

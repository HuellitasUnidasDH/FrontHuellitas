export interface GroupMemberItem {
  userId: string;
  fullName: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface PetGroup {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  ownerId: string;
  ownerName?: string;
  myRole: 'OWNER' | 'MEMBER';
  membersCount: number;
  petsCount: number;
  pets: any[];
  members: GroupMemberItem[];
  createdAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

export interface JoinGroupPayload {
  inviteCode: string;
}

export interface GroupFeedMoment {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petPhotoUrl?: string;
  title: string;
  description?: string;
  photoUrl: string;
  momentDate: string;
  createdAt: string;
}

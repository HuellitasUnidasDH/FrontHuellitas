export interface MedicalRecord {
  id: string;
  petId: string;
  veterinarianId: string;
  visitDate: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  prescriptions?: string;
  nextAppointmentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordPayload {
  petId: string;
  visitDate: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  prescriptions?: string;
  nextAppointmentDate?: string;
}

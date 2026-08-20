export type Role = "freelancer" | "sales";
export type ViewKey =
  | "dashboard"
  | "profile"
  | "jobs"
  | "admin"
  | "scout"
  | "meeting"
  | "sheet"
  | "contact";
export type AuthMode = "login" | "register";
export type ApplicationStatus =
  | "初回面談前"
  | "選考中"
  | "面談待ち"
  | "成約"
  | "見送り";
export type EditableApplicationStatus = Exclude<ApplicationStatus, "初回面談前">;
export type IconName =
  | "briefcase"
  | "user"
  | "search"
  | "chart"
  | "send"
  | "calendar"
  | "shield"
  | "plus"
  | "print";

export interface NavItem {
  view: ViewKey;
  icon: IconName;
  label: string;
  roles: Role[];
}

export interface Account {
  email: string;
  password: string;
  role: Role;
  name: string;
  startView: ViewKey;
  freelancerId?: string;
}

export interface AuthUser {
  email: string;
  role: Role;
  name: string;
  freelancerId?: string;
  loggedInAt: string;
}

export interface Profile {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  role: string;
  languages: string;
  db: string;
  frameworks: string;
  operatingSystems: string;
  industries: string;
  otherSkills: string;
  years: string;
  skillExperiences: Record<string, string>;
  desiredRate: string;
  startDate: string;
  workRate: string;
  remote: string;
  availability: string;
  resumeId: string;
  resumeName: string;
  resumeType: string;
  resumeSize: string;
  meetingCandidates: string[];
  pledgeAccepted: boolean;
  pledgedAt: string;
  initialMeetingCompleted: boolean;
  initialMeetingCompletedAt: string;
  lastUpdated: string;
}

export interface Freelancer {
  id: string;
  name: string;
  role: string;
  skills: string[];
  skillExperiences?: Array<{
    name: string;
    yearsExperience: number;
  }>;
  yearsExperience?: number;
  desiredRate: number;
  workRate: string;
  remote: string;
  availability: string;
  lastUpdated: string;
  resumeId?: string;
  resumeName: string;
  pledgedAt?: string;
  initialMeetingCompleted?: boolean;
  initialMeetingCompletedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  summary: string;
  required: string[];
  nice: string[];
  rateMin: number;
  rateMax: number;
  unitPrice: string;
  settlementLower: string;
  settlementUpper: string;
  location: string;
  startPeriod: string;
  remoteRatio: string;
  foreignerAvailability: string;
  ageLimit: string;
  receivedAt: string | null;
  receivedAtMs: number | null;
  remote: string;
  sortFlag: boolean;
  active: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  freelancerId: string;
  status: ApplicationStatus;
  appliedAt: string;
  job?: Job;
  freelancer?: Freelancer;
}

export interface Message {
  id: string;
  freelancerId: string;
  jobId?: string;
  messageType?: "chat" | "scout" | "alive_check" | "system";
  from: string;
  to: string;
  body: string;
  at: string;
  readAt?: string;
  channel: "sales" | "freelancer";
}

export interface MeetingRequest {
  id: string;
  freelancerId: string;
  applicationId?: string;
  jobId?: string;
  candidate: string;
  status: "候補" | "確定" | "再調整";
}

export interface ContactInquiry {
  id: string;
  inquiryType: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  answerBody: string;
  answeredAt: string;
  answererName: string;
}

export interface AliveCheck {
  id: string;
  count: number;
  at: string;
}

export interface FrichyState {
  auth: AuthUser | null;
  authMode: AuthMode;
  accounts: Account[];
  activeView: ViewKey;
  wizardStep: number;
  selectedFreelancerId: string;
  previewFreelancerId: string;
  profile: Profile;
  freelancers: Freelancer[];
  jobs: Job[];
  applications: Application[];
  messages: Message[];
  meetingRequests: MeetingRequest[];
  contactInquiries: ContactInquiry[];
  aliveChecks: AliveCheck[];
}

export interface JobFilters {
  keyword: string;
  skill: string;
  rate: string;
  remote: string;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface JobPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ScoutFilters {
  skill: string;
  availability: string;
  remote: string;
  sort: string;
}

export interface ScoutJobPickerState {
  open: boolean;
  freelancerId: string;
  freelancerName: string;
  keyword: string;
  jobs: Job[];
  selectedJobId: string;
  loading: boolean;
}

export interface RegisterInput {
  email: string;
  role: string;
  password: string;
  passwordConfirm: string;
}

export interface ProfileTermsInput {
  desiredRate: string;
  startDate: string;
  workRate: string;
  remote: string;
  availability: string;
  resume?: File | null;
  deleteExistingResume?: boolean;
  deleteExistingResumeId?: string;
}

export interface ProfileRegistrationInput {
  basic: Pick<Profile, "name" | "nameKana" | "email" | "phone" | "role">;
  skills: Pick<
    Profile,
    | "languages"
    | "db"
    | "frameworks"
    | "operatingSystems"
    | "industries"
    | "otherSkills"
    | "years"
    | "skillExperiences"
  >;
  terms: ProfileTermsInput;
  meetingCandidates: string[] | string;
  pledgeAccepted: boolean;
}

export interface ResumeUploadIntent {
  pathname: string;
  clientPayload: string;
  allowedContentTypes: string[];
  maximumSizeInBytes: number;
  uploadMode?: "api" | "blob";
}

export interface ResumeUploadResult {
  id: string;
}

export interface ResumePreviewFile {
  freelancerName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
  previewKind: "pdf" | "docx" | "download";
  expiresAt: string;
}

export interface JobInput {
  title: string;
  client: string;
  summary: string;
  required: string;
  nice: string;
  rateMin: string | number;
  rateMax: string | number;
  remote: string;
  sortFlag: boolean;
}

export interface ContactInquiryInput {
  inquiryType: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
}

export type ApiRequestOptions = RequestInit & {
  silent?: boolean;
};

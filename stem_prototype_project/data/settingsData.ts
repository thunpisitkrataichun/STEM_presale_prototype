// ─────────────────────────────────────────────────────────────────────────
// Settings — types + defaults. Persisted to localStorage at runtime.
// ─────────────────────────────────────────────────────────────────────────

export type Role = "Admin" | "MaintenanceLead" | "Technician" | "Viewer";
export type Theme = "light" | "dark" | "auto";
export type AccentColor = "blue" | "green" | "purple" | "orange";
export type DateFormat = "iso" | "long" | "short";
export type TimeFormat = "24h" | "12h";
export type Density = "compact" | "comfortable" | "spacious";
export type Language = "en" | "th";

export interface ProfileSettings {
  displayName: string;
  email: string;
  role: Role;
  language: Language;
}

export interface NotificationSettings {
  emailAlerts: {
    critical: boolean;
    maintenanceDue: boolean;
    overdue: boolean;
    weeklySummary: boolean;
    modelRetrain: boolean;
  };
  inAppAlerts: {
    banner: boolean;
    browser: boolean;
    sound: boolean;
  };
  recipients: string[];
}

export interface SensorBand { min: number; max: number; }

export interface ThresholdSettings {
  critical: number;     // days
  watch: number;        // days
  sensor: {
    volt: SensorBand;
    rotate: SensorBand;
    pressure: SensorBand;
    vibration: SensorBand;
  };
}

export interface DisplaySettings {
  theme: Theme;
  accent: AccentColor;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  density: Density;
  showThaiLabels: boolean;
  enableBeta: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  specialty: string;
  email: string;
}

export interface TeamSettings {
  members: TeamMember[];
}

export interface DataSettings {
  refreshIntervalMin: 1 | 5 | 15 | 0;  // 0 = manual
}

export interface SettingsState {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  thresholds: ThresholdSettings;
  display: DisplaySettings;
  team: TeamSettings;
  data: DataSettings;
}

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "Admin",            label: "Admin",            description: "Full access" },
  { value: "MaintenanceLead",  label: "Maintenance Lead", description: "Schedule + edit data" },
  { value: "Technician",       label: "Technician",       description: "View + update jobs" },
  { value: "Viewer",           label: "Viewer",           description: "Read-only" },
];

export const DEFAULT_SETTINGS: SettingsState = {
  profile: {
    displayName: "Maintenance Lead",
    email: "maintenance-lead@stem.co.th",
    role: "MaintenanceLead",
    language: "en",
  },
  notifications: {
    emailAlerts: {
      critical: true,
      maintenanceDue: true,
      overdue: true,
      weeklySummary: false,
      modelRetrain: false,
    },
    inAppAlerts: {
      banner: true,
      browser: true,
      sound: false,
    },
    recipients: ["maintenance-lead@stem.co.th", "ops@stem.co.th"],
  },
  thresholds: {
    critical: 7,
    watch: 30,
    sensor: {
      volt:      { min: 150, max: 200 },
      rotate:    { min: 400, max: 500 },
      pressure:  { min: 85,  max: 115 },
      vibration: { min: 30,  max: 50  },
    },
  },
  display: {
    theme: "light",
    accent: "blue",
    dateFormat: "long",
    timeFormat: "24h",
    density: "comfortable",
    showThaiLabels: true,
    enableBeta: false,
  },
  team: {
    members: [
      { id: "T01", name: "Mechanical Technician", specialty: "Mechanical", email: "mechanical-tech@stem.co.th" },
      { id: "T02", name: "Electrical Technician", specialty: "Electrical", email: "electrical-tech@stem.co.th" },
      { id: "T03", name: "Inspection Officer",    specialty: "Inspection", email: "inspection-officer@stem.co.th" },
      { id: "T04", name: "Hydraulics Engineer",   specialty: "Hydraulics", email: "hydraulics-eng@stem.co.th" },
      { id: "T05", name: "General Technician",    specialty: "General",    email: "general-tech@stem.co.th" },
    ],
  },
  data: {
    refreshIntervalMin: 5,
  },
};

export const STORAGE_KEY = "stem-pdm-settings";

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // shallow merge with defaults so newly-added keys don't break old saves
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: SettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* localStorage may be disabled — silent fail is fine for the prototype */
  }
}

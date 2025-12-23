
export interface ClimateData {
  temp: number;
  humidity: number;
  aqi: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  description: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AlertPreferences {
  wildfires: boolean;
  floods: boolean;
  heatwaves: boolean;
  storms: boolean;
  airQuality: boolean;
}

export interface WeatherAlert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Notice';
  title: string;
  description: string;
  source: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  timestamp: Date;
}

export interface Location {
  lat: number;
  lng: number;
}

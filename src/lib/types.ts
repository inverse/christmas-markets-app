export interface Market {
  name: string;
  address: string;
  dates: string;
  image_url: string;
  coordinates: { lat: number; lng: number };
  url: string;
  opening_times: string;
  admission: string;
}

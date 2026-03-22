export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          created_at: string
          name: string
          image_url: string
          price_per_day: number
          availability: boolean
          location: string
          type: string
          description: string | null
          transmission: string
          fuel_type: string
          seats: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          image_url: string
          price_per_day: number
          availability?: boolean
          location: string
          type: string
          description?: string | null
          transmission: string
          fuel_type: string
          seats: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          image_url?: string
          price_per_day?: number
          availability?: boolean
          location?: string
          type?: string
          description?: string | null
          transmission?: string
          fuel_type?: string
          seats?: number
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          user_id: string
          car_id: string
          start_date: string
          end_date: string
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          car_id: string
          start_date: string
          end_date: string
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          car_id?: string
          start_date?: string
          end_date?: string
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          is_admin: boolean
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          is_admin?: boolean
        }
      }
    }
  }
}

export type Car = Database['public']['Tables']['cars']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

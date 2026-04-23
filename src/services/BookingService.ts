import { Booking } from '../types';
import SupabaseService from './SupabaseService';

export interface IBookingService {
  createBooking(booking: Partial<Booking>): Promise<Booking>;
  getBookingsByUserId(userId: string): Promise<Booking[]>;
  checkAvailability(carId: string, startDate: string, endDate: string): Promise<boolean>;
}

export class BookingService implements IBookingService {
  private supabase = SupabaseService.getInstance().getClient();

  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, cars(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
  }

  async checkAvailability(carId: string, startDate: string, endDate: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .eq('status', 'confirmed')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (error) throw error;
    return !data || data.length === 0;
  }
}

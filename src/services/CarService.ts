import { Car } from '../types';
import SupabaseService from './SupabaseService';

export interface ICarService {
  getCars(): Promise<Car[]>;
  getCarById(id: string): Promise<Car | null>;
}

export class CarService implements ICarService {
  private supabase = SupabaseService.getInstance().getClient();

  async getCars(): Promise<Car[]> {
    const { data, error } = await this.supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCarById(id: string): Promise<Car | null> {
    const { data, error } = await this.supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

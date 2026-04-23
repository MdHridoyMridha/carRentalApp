import { Car } from '../types';
import { ICarService } from './CarService';

export class CarServiceLoggingDecorator implements ICarService {
  constructor(private decoratedService: ICarService) {}

  async getCars(): Promise<Car[]> {
    console.log('[CarService] Fetching all cars...');
    const startTime = performance.now();
    try {
      const cars = await this.decoratedService.getCars();
      const endTime = performance.now();
      console.log(`[CarService] Successfully fetched ${cars.length} cars in ${(endTime - startTime).toFixed(2)}ms`);
      return cars;
    } catch (error) {
      console.error('[CarService] Error fetching cars:', error);
      throw error;
    }
  }

  async getCarById(id: string): Promise<Car | null> {
    console.log(`[CarService] Fetching car with id: ${id}...`);
    try {
      const car = await this.decoratedService.getCarById(id);
      if (car) {
        console.log(`[CarService] Successfully found car: ${car.name}`);
      } else {
        console.warn(`[CarService] No car found with id: ${id}`);
      }
      return car;
    } catch (error) {
      console.error(`[CarService] Error fetching car ${id}:`, error);
      throw error;
    }
  }
}

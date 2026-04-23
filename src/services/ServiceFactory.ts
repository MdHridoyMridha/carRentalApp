import { CarService, ICarService } from './CarService';
import { CarServiceLoggingDecorator } from './CarServiceDecorator';
import { BookingService, IBookingService } from './BookingService';

export enum ServiceType {
  Car = 'CAR',
  Booking = 'BOOKING'
}

export class ServiceFactory {
  private static carService: ICarService;
  private static bookingService: IBookingService;

  public static getCarService(): ICarService {
    if (!this.carService) {
      const concreteService = new CarService();
      this.carService = new CarServiceLoggingDecorator(concreteService);
    }
    return this.carService;
  }

  public static getBookingService(): IBookingService {
    if (!this.bookingService) {
      this.bookingService = new BookingService();
    }
    return this.bookingService;
  }
}

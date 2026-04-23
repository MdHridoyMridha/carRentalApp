import { Car } from '../types';

export interface IFilterStrategy {
  filter(cars: Car[], criteria: Record<string, any>): Car[];
}

export class CarSearchStrategy implements IFilterStrategy {
  filter(cars: Car[], criteria: Record<string, any>): Car[] {
    const { searchTerm, filterType } = criteria;
    
    return cars.filter(car => {
      const matchesSearch = !searchTerm || 
                           car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           car.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || car.type === filterType;
      return matchesSearch && matchesType;
    });
  }
}

export class CarSortStrategy {
  sort(cars: Car[], sortBy: string): Car[] {
    return [...cars].sort((a, b) => {
      if (sortBy === 'price-low') return a.price_per_day - b.price_per_day;
      if (sortBy === 'price-high') return b.price_per_day - a.price_per_day;
      return 0;
    });
  }
}

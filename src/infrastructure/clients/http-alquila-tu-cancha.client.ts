import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Club } from '../../domain/model/club';
import { Court } from '../../domain/model/court';
import { Slot } from '../../domain/model/slot';
import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';

@Injectable()
export class HTTPAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  private base_url: string;

  constructor(private httpService: HttpService, config: ConfigService) {
    this.base_url = config.get<string>('ATC_BASE_URL', 'http://localhost:4000');
  }

  private async getData<T>(url: string, params?: any): Promise<T[]> {
    try {
      const response = await this.httpService.get<T[]>(url, { params }).toPromise();
      
      return response?.data ?? [];  
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      return [];  
    }
  }
  
  async getClubs(placeId: string): Promise<Club[]> {
    return this.getData<Club>('clubs', { placeId });
  }

  async getCourts(clubId: number): Promise<Court[]> {
    return this.getData<Court>(`/clubs/${clubId}/courts`);
  }

  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[]> {
    const formattedDate = date.toISOString().split('T')[0]; 
    return this.getData<Slot>(`/clubs/${clubId}/courts/${courtId}/slots`, { date: formattedDate });
  }
}

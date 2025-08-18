import { supabase } from '../lib/supabase';
import type { Lead } from '../lib/supabase';

export interface RenovationItem {
  id: string;
  beforeImage: string;
  afterImage: string;
  title: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  projectType: string;
  zipCode: string;
  createdAt: string;
}

export class LeadService {
  // Get renovations with optional zip code filtering
  static async getRenovations(filterZipCodes?: string[]): Promise<RenovationItem[]> {
    try {
      if (!supabase) {
        console.warn('Supabase not configured - returning demo data');
        return this.getDemoRenovations(filterZipCodes);
      }

      let query = supabase
        .from('leads')
        .select('id, image_url, ai_url, style, room_type, zip, created_at')
        .not('image_url', 'is', null)
        .not('ai_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply zip code filter if provided
      if (filterZipCodes && filterZipCodes.length > 0) {
        query = query.in('zip', filterZipCodes);
      }

      const { data: leads, error } = await query;

      if (error) {
        console.error('Error fetching renovations:', error);
        return this.getDemoRenovations(filterZipCodes);
      }

      if (!leads || leads.length === 0) {
        console.log('No renovations found, returning demo data');
        return this.getDemoRenovations(filterZipCodes);
      }

      // Transform leads to RenovationItem format
      return leads.map((lead, index) => ({
        id: lead.id,
        beforeImage: lead.image_url || '',
        afterImage: lead.ai_url || '',
        title: this.generateTitle(lead.style, lead.room_type),
        tags: this.generateTags(lead.style, lead.room_type),
        likes: Math.floor(Math.random() * 50) + 10, // Random likes for demo
        comments: Math.floor(Math.random() * 15) + 2, // Random comments for demo
        isLiked: false,
        projectType: this.formatRoomType(lead.room_type),
        zipCode: lead.zip || '',
        createdAt: lead.created_at
      }));

    } catch (error) {
      console.error('Error in getRenovations:', error);
      return this.getDemoRenovations(filterZipCodes);
    }
  }

  // Generate demo data when Supabase is not available or no data exists
  private static getDemoRenovations(filterZipCodes?: string[]): RenovationItem[] {
    const demoRenovations: RenovationItem[] = [
      {
        id: 'demo-1',
        beforeImage: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=400',
        afterImage: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=400',
        title: 'Modern Kitchen Transformation',
        tags: ['Modern Minimalist', 'Kitchen', 'Clean Lines'],
        likes: 42,
        comments: 8,
        isLiked: false,
        projectType: 'Kitchen',
        zipCode: '01701',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 0)).toISOString()
      },
      {
        id: 'demo-2',
        beforeImage: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
        afterImage: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
        title: 'Modern Zen Backyard',
        tags: ['Modern Zen', 'Backyard', 'Natural'],
        likes: 38,
        comments: 12,
        isLiked: true,
        projectType: 'Backyard',
        zipCode: '01702',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
      },
      {
        id: 'demo-3',
        beforeImage: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
        afterImage: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400',
        title: 'Farmhouse Chic Kitchen',
        tags: ['Farmhouse Chic', 'Kitchen', 'Rustic'],
        likes: 56,
        comments: 15,
        isLiked: false,
        projectType: 'Kitchen',
        zipCode: '01720',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
      },
      {
        id: 'demo-4',
        beforeImage: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
        afterImage: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=400',
        title: 'Mediterranean Oasis',
        tags: ['Mediterranean Oasis', 'Backyard', 'Outdoor'],
        likes: 33,
        comments: 6,
        isLiked: false,
        projectType: 'Backyard',
        zipCode: '01730',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString()
      },
      {
        id: 'demo-5',
        beforeImage: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=400',
        afterImage: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=400',
        title: 'Contemporary Luxe Bathroom',
        tags: ['Contemporary Luxe', 'Bathroom', 'Luxury'],
        likes: 29,
        comments: 4,
        isLiked: false,
        projectType: 'Bathroom',
        zipCode: '01701',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString()
      },
      {
        id: 'demo-6',
        beforeImage: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=400',
        afterImage: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
        title: 'Transitional Living Room',
        tags: ['Transitional', 'Living Room', 'Cozy'],
        likes: 47,
        comments: 9,
        isLiked: false,
        projectType: 'Living Room',
        zipCode: '01740',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
      }
    ];

    // Filter by zip codes if provided
    if (filterZipCodes && filterZipCodes.length > 0) {
      return demoRenovations.filter(item => filterZipCodes.includes(item.zipCode));
    }

    return demoRenovations;
  }

  private static generateTitle(style: string, roomType: string): string {
    const formattedStyle = style || 'Modern';
    const formattedRoom = this.formatRoomType(roomType);
    return `${formattedStyle} ${formattedRoom} Transformation`;
  }

  private static generateTags(style: string, roomType: string): string[] {
    const tags = [];
    if (style) tags.push(style);
    if (roomType) tags.push(this.formatRoomType(roomType));
    
    // Add some descriptive tags based on style
    if (style?.toLowerCase().includes('modern')) tags.push('Clean Lines');
    if (style?.toLowerCase().includes('farmhouse')) tags.push('Rustic');
    if (style?.toLowerCase().includes('luxe')) tags.push('Luxury');
    if (style?.toLowerCase().includes('zen')) tags.push('Natural');
    
    return tags;
  }

  private static formatRoomType(roomType: string): string {
    if (!roomType) return 'Room';
    
    const formatted = roomType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return formatted;
  }
}
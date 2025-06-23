import { NextRequest, NextResponse } from 'next/server';
import { generateWeatherBasedRecommendations } from '@/ai/flows/weather-based-recommendations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await generateWeatherBasedRecommendations(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in weather recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to generate weather recommendations' },
      { status: 500 }
    );
  }
}
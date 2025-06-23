import { NextRequest, NextResponse } from 'next/server';
import { generateWeatherChatResponse, type WeatherChatInput } from '@/ai/flows/weather-chat';

export async function POST(request: NextRequest) {
  try {
    const body: WeatherChatInput = await request.json();
    
    const result = await generateWeatherChatResponse(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in weather chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process weather chat message' },
      { status: 500 }
    );
  }
}
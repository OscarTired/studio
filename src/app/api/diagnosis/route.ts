import { NextRequest, NextResponse } from 'next/server';
import { diagnoseCropDisease, type DiagnoseCropDiseaseInput } from '@/ai/flows/diagnose-crop-disease';

export async function POST(request: NextRequest) {
  try {
    const body: DiagnoseCropDiseaseInput = await request.json();
    
    const result = await diagnoseCropDisease(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in diagnosis API:', error);
    return NextResponse.json(
      { error: 'Failed to process diagnosis' },
      { status: 500 }
    );
  }
}
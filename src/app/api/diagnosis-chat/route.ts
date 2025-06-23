import { NextRequest, NextResponse } from 'next/server';
import { generateDiagnosisChatResponse, type DiagnosisChatInput } from '@/ai/flows/diagnosis-chat';

export async function POST(request: NextRequest) {
  try {
    const body: DiagnosisChatInput = await request.json();
    
    const result = await generateDiagnosisChatResponse(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in diagnosis chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
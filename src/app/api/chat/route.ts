import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Project } from '@/types/project';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are a helpful AI assistant for a construction project management platform. You have access to the following data through Supabase:
- Projects and their details
- Tasks and their status
- Plans and specifications
- Team members and their roles

You can help users with:
- Providing real-time information about their projects
- Understanding how to use platform features
- Finding specific project information
- Best practices for construction project management
- Explaining features and functionality

Always be professional, concise, and helpful. If you're not sure about something, say so.
`;

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // Fetch relevant data based on the message content
    let contextData = '';
    
    if (message.toLowerCase().includes('project') || message.toLowerCase().includes('projects')) {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*');

      if (!error && projects) {
        const typedProjects = projects as Project[];
        contextData = `Current projects in the system: ${typedProjects.length} total projects.\n`;
        contextData += 'Project List:\n';
        typedProjects.forEach((project, index) => {
          contextData += `${index + 1}. ${project.title} (Status: ${project.status})\n`;
          if (project.location) contextData += `   Location: ${project.location}\n`;
          if (project.project_manager) contextData += `   Project Manager: ${project.project_manager}\n`;
        });
      }
    }

    // Add context data to the message if available
    const userMessage = contextData 
      ? `${message}\n\nContext: ${contextData}`
      : message;

    // Convert history to OpenAI format
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing chatbot request for user:', userId);
    console.log('Message:', message);

    // Call OpenAI to extract task information
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that helps users create tasks. When a user describes a task, extract the relevant information and respond with a JSON object containing:
            - title: The task title (required)
            - category: The task category (default: "all")
            - due_date: If mentioned, format as ISO date string, otherwise null
            - flagged: true if the task seems urgent/important, false otherwise

            If the user's message is not about creating a task, respond with a friendly message explaining that you help create tasks.

            Examples:
            User: "Remind me to buy groceries tomorrow at 5pm"
            Response: {"task": {"title": "Buy groceries", "category": "personal", "due_date": "2024-01-16T17:00:00Z", "flagged": false}, "message": "I've created a task to buy groceries for tomorrow at 5pm!"}

            User: "I need to finish the urgent project report by Friday"
            Response: {"task": {"title": "Finish project report", "category": "work", "due_date": "2024-01-19T23:59:59Z", "flagged": true}, "message": "I've created an urgent task to finish the project report by Friday!"}

            User: "How's the weather?"
            Response: {"message": "I'm here to help you create and manage tasks! Try saying something like 'Remind me to call mom tomorrow' or 'I need to finish my homework by Friday'."}
            `
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    console.log('AI Response:', aiContent);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (e) {
      // If parsing fails, treat as a regular message
      parsedResponse = { message: aiContent };
    }

    // If the response contains a task, create it in the database
    if (parsedResponse.task) {
      const taskData = {
        title: parsedResponse.task.title,
        user_id: userId,
        category: parsedResponse.task.category || 'all',
        due_date: parsedResponse.task.due_date || null,
        flagged: parsedResponse.task.flagged || false,
        completed: false
      };

      console.log('Creating task:', taskData);

      const { data: createdTask, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) {
        console.error('Error creating task:', taskError);
        throw new Error('Failed to create task');
      }

      console.log('Task created successfully:', createdTask);

      return new Response(JSON.stringify({
        message: parsedResponse.message,
        task: createdTask,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no task to create, just return the message
    return new Response(JSON.stringify({
      message: parsedResponse.message,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import { NextResponse } from 'next/server';
import {logoutExistingSession, prepareHydrogenTheme, dummyGitCommit, hydrigenLink,hydrogenDeployment} from '@/shopify/script.js';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendMessage = (message, step, progress) => {
        const data = JSON.stringify({ message, step, progress });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        // Step 1
        sendMessage("Starting store creation process", 1, 0);
        await logoutExistingSession();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2
        sendMessage("Preparing Hydrogen Theme", 2, 25);
        await prepareHydrogenTheme();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 3
        sendMessage("Creating dummy Git Commit", 3, 70);
        await dummyGitCommit();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 4
        sendMessage("Setting up Hydrogen template & Link", 4, 100);
        await hydrigenLink();
        
        controller.close();
      } catch (error) {
        sendMessage(error.message, -1, -1);
        controller.close();
      }
    }
  });

  const response = new NextResponse(stream);
  response.headers.set('Content-Type', 'text/event-stream');
  response.headers.set('Cache-Control', 'no-cache');
  response.headers.set('Connection', 'keep-alive');
  
  return response;
}
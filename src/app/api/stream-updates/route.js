
import { NextResponse } from 'next/server';
import {logoutExistingSession ,prepareHydrogenTheme,dummyGitCommit,hydrigenLink} from '@/shopify/script.js';
export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: {"message":"Starting store creation process : logoutExistingSession()","step":1,"progress":0}\n\n`));
        logoutExistingSession();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        controller.enqueue(encoder.encode(`data: {"message":"Preparing Hydrogen Theme","step":2,"progress":25}\n\n`));
        prepareHydrogenTheme()
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        controller.enqueue(encoder.encode(`data: {"message":"Creating dummy Git Commit","step":3,"progress":70}\n\n`));
        dummyGitCommit()
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        controller.enqueue(encoder.encode(`data: {"message":"Setting up Hydrogen template & Link","step":4,"progress":100}\n\n`));
        hydrigenLink();
        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error":"${(error).message}"}\n\n`));
        controller.close();
      }
    }
  });
  
  // Create a NextResponse with the stream
  const response = new NextResponse(stream);
   console.log("response :",response.body);
   // Set headers for SSE
  response.headers.set('Content-Type', 'text/event-stream');
  response.headers.set('Cache-Control', 'no-cache');
  response.headers.set('Connection', 'keep-alive');
  
  // //  Set a cookie to track the session
  // response.cookies.set('store-creation-session', 'active', {
  //   maxAge: 600, // 10 minutes
  //   path: '/'
  // });
  
  return response;
}
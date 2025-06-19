import { NextResponse } from 'next/server';
import { join } from 'path';
import { execSync } from 'child_process';

// Get the absolute path to node_modules/.bin/shopify
const shopifyCLIPath = join(process.cwd(), 'node_modules/.bin/shopify');

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
      ...options
    }).toString();
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Check if Shopify CLI is available
        controller.enqueue(encoder.encode(`data: {"message":"Checking Shopify CLI installation...","step":0,"progress":0}\n\n`));
        
        try {
          execCommand(`"${shopifyCLIPath}" version`);
        } catch (error) {
          throw new Error('Shopify CLI not found. Please ensure @shopify/cli is installed');
        }

        // Logout existing session
        controller.enqueue(encoder.encode(`data: {"message":"Logging out existing session...","step":1,"progress":20}\n\n`));
        execCommand(`"${shopifyCLIPath}" auth logout`);
        
        // Initialize Hydrogen project
        controller.enqueue(encoder.encode(`data: {"message":"Creating Hydrogen project...","step":2,"progress":40}\n\n`));
        const projectDir = join(process.cwd(), 'hydrogen-storefront');
        execCommand(`npm create @shopify/hydrogen@latest ${projectDir} -- --template hello-world`);
        
        // Install dependencies
        controller.enqueue(encoder.encode(`data: {"message":"Installing dependencies...","step":3,"progress":60}\n\n`));
        execCommand('npm install', { cwd: projectDir });
        
        // Build project
        controller.enqueue(encoder.encode(`data: {"message":"Building project...","step":4,"progress":80}\n\n`));
        execCommand('npm run build', { cwd: projectDir });
        
        // Setup git
        controller.enqueue(encoder.encode(`data: {"message":"Setting up Git...","step":5,"progress":90}\n\n`));
        execCommand('git init', { cwd: projectDir });
        execCommand('git config user.name "Vercel Deploy"', { cwd: projectDir });
        execCommand('git config user.email "deploy@vercel.com"', { cwd: projectDir });
        execCommand('git add .', { cwd: projectDir });
        execCommand('git commit -m "Initial commit"', { cwd: projectDir });
        
        controller.enqueue(encoder.encode(`data: {"message":"Setup complete","step":6,"progress":100}\n\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error":"${error.message}","step":-1,"progress":-1}\n\n`));
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
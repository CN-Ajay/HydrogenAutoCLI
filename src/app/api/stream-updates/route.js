import { NextResponse } from 'next/server';
const os = require("os");
const path = require("path");
const { spawn, execSync } = require("child_process");
const pty = require("node-pty");
import { join } from 'path';

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

// Use process.cwd() to get the project root directory
const themeDir = join(process.cwd(), 'hydrogen-storefront');


export async function GET() {
  const encoder = new TextEncoder();
  

  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: {"message":"Starting store creation process : logoutExistingSession()","step":1,"progress":0}\n\n`));
        logoutExistingSession();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        controller.enqueue(encoder.encode(`data: {"message":"Preparing Hydrogen Theme","step":2,"progress":25}\n\n`));
       prepareHydrogenTheme(themeDir);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        controller.enqueue(encoder.encode(`data: {"message":"Creating dummy Git Commit","step":3,"progress":70}\n\n`));
        dummyGitCommit(themeDir);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        controller.enqueue(encoder.encode(`data: {"message":"Setting up Hydrogen template & Link","step":4,"progress":100}\n\n`));
        hydrigenLink();
        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.close();
      } catch (error) {
        const errorMsg = error.message.replace(/"/g, '\\"');
        controller.enqueue(encoder.encode(`data: {"error":"${errorMsg}"}\n\n`));
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

function logoutExistingSession() {
    execSync("shopify auth logout", {});
}

function safeJSONParse(data) {
  try {
      return JSON.parse(data);
  } catch (error) {
      console.error('Failed to parse JSON:', error);
      console.debug('Problematic data:', data);
      return null;
  }
}

//npm create @shopify/hydrogen@latest

/*function createHydrogenProject(projectName) {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["create", "@shopify/hydrogen@latest", projectName], {
      stdio: "inherit",
      cwd: process.cwd(),
      shell: true,
    });

    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Failed to create Hydrogen project"));
    });
  });
}
createHydrogenProject();*/

function prepareHydrogenTheme(themeDir) {
    execSync("npm install", { cwd: themeDir });
    execSync('npm run build', { cwd: themeDir });
}

function dummyGitCommit(themeDir) {
  execSync("git init", { cwd: themeDir });
  execSync('git config user.name "Test User"', { cwd: themeDir });
  execSync('git config user.email "test@user.user"', { cwd: themeDir });
  execSync('git add .', { cwd: themeDir });
  execSync('git commit -m "Auto-commit before deploy" || echo "No changes"', { cwd: themeDir });
}

/* ===============================================================
function linkStorefront(themeDir) {
    const proc = spawn("shopify", ["hydrogen", "link"], {
      cwd: themeDir,
      stdio: "inherit",
      shell: true,
    });
  
    proc.on("exit", (code) => {
      if (code !== 0) console.error("Link failed");
    });
}
linkStorefront('hydrogen-storefront');*/
/*function linkStorefront(themeDir) {
    const child = spawn('shopify', ['hydrogen', 'link'], {
      cwd: themeDir,
      stdio: ["pipe", "pipe", "inherit"],
      shell: true
    });
  
    // Listen for stdout to detect the prompt
    console.log(1);
    child.stdout.on("data", (data) => {
        console.log(1);
      const output = data.toString();
      process.stdout.write(output); // Optional: see what's happening
  
      if (output.includes("?  Select a shop to log in to:")) {
        // Send "\n" to select the first option
        console.log('TEST');
        setTimeout(() => {
          child.stdin.write("\n");
        }, 500); // Wait a bit to let the prompt fully render
      }
    });
  
    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });
  }
linkStorefront('hydrogen-storefront');
=============================================================== */

function hydrigenLink() {
  const ptyProcess = pty.spawn("shopify", ["hydrogen", "link"], {
    name: "xterm-color",
    cwd: themeDir,
    env: process.env,
    cols: 80,
    rows: 30,
  });

  ptyProcess.onData((data) => {
    //process.stdout.write(data); // Optional: see the CLI output

    // Match and capture the verification code
    const codeMatch = safeJSONParse(data.match(/User verification code:\s*([A-Z0-9-]+)/));
    if (codeMatch) {
      console.debug('\nAUTH-CODE');
      const code = codeMatch[1];
      console.log("User verification code:", code);
    }

    if (data.includes("Press any key to open the login page on your browser")) {
      console.debug('\nOPEN-BROWSER');
      // Press "Enter" to select the default option
      setTimeout(() => {
        ptyProcess.write("\r"); // \r is Enter
      }, 500);
    }

    if (data.includes("?  Select a shop to log in to:")) {
      console.debug('\nSELECT-SHOP');
      // Press "Enter" to select the default option
      setTimeout(() => {
        ptyProcess.write("\r"); // \r is Enter
      }, 500);
    }

    if (data.includes("?  Select a Hydrogen storefront to link:")) {
      console.debug('\nSELECT-STORE');
      // Press "Enter" to select the default option
      setTimeout(() => {
        ptyProcess.write("\r"); // \r is Enter
      }, 500);
    }

    if (data.includes("?  New storefront name:")) { // THIS IS NOT WORKING, NEED A QUICK FIX
      console.debug('\nSTORE-NAME');
      
      // This breaks the default auto-submit behavior of inquirer
      //ptyProcess.write("\b");

      // Must be FAST to override default name, Very short delay is key
      /*setTimeout(() => {
          // Clear up to 30 characters of default name
          ptyProcess.write("\b".repeat(30));

          ptyProcess.write("Hydrogen Store\r");
        }, 100);*/
    }

    if (data.includes("Your project is currently linked")) { // PARTIAL TEXT
      console.debug('\nALREADY-LINKED');
      // Press "Enter" to select the default option
      setTimeout(() => {
        ptyProcess.write("\r"); // \r is Enter
        //ptyProcess.write("\x1B[B\r"); // ↓ then Enter
      }, 500);
    }
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
      //console.log(`\nProcess exited with code ${exitCode}, signal: ${signal}`);
      if (exitCode === 0) {
        console.log("✅ Hydrogen link successful");
        hydrogenDeployment();
        
      } else {
        console.log("❌ Hydrogen link failed");
      }
  });
}

async function hydrogenDeployment() {
    const ptyProcess2 = pty.spawn("shopify", ["hydrogen", "deploy"], {
        name: "xterm-color",
        cwd: themeDir,
        env: process.env,
        cols: 80,
        rows: 30,
    });
    
    ptyProcess2.onData((data) => {
        //process.stdout.write(data); // Optional: see the CLI output
    
        if (safeJSONParse(data.includes("?  Select an environment to deploy to:"))) {
        console.debug('\nSELECT-ENVIRONMENT');
        setTimeout(() => {
            // Press "Enter" to select the default option
            ptyProcess2.write("\r");
        }, 500);
        }
    
        if (data.includes("Creating a deployment against Production")) { //PARTIAL TEXT
            console.debug('\nCONFIRM_ENVIRONMENT');
            setTimeout(() => {
            // Press "Enter" to select the default option
            ptyProcess2.write("\r");
            }, 500);
        }

        if (data.includes("Successfully deployed to Oxygen")) { //PARTIAL TEXT
            console.debug('\nDEPLOYMENT-SUCCESS');

            const previewUrl = data.match(/https:\/\/[a-z0-9-]+\.myshopify\.dev/);
            if (previewUrl) {
                console.log("Preview URL:", previewUrl[0]);

                //registerStorefront(previewUrl[0]);
            }
        }
    });

    ptyProcess2.onExit(({ exitCode, signal }) => {
        //console.log(`\nProcess exited with code ${exitCode}, signal: ${signal}`);
        if (exitCode === 0) {
          console.log("✅ Hydrogen deployment successful");
        } else {
          console.log("❌ Hydrogen deployment failed");
        }
    });
}


/* ===============================================================
const axios = require('axios');

//const SHOPIFY_STORE = '706pib-wi.myshopify.com';
const SHOPIFY_STORE = 'hxzfsw-2e.myshopify.com';
//const ADMIN_API_TOKEN = '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';
const ADMIN_API_TOKEN = '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';

async function registerStorefront(previewUrl) {
  console.log('\n🔗 Registering storefront in Shopify...');

  try {
    const response = await axios.post(
      `https://${SHOPIFY_STORE}/admin/api/2024-04/storefronts.json`,
      {
        storefront: {
          name: 'Hydrogen Storefront',
          url: previewUrl,
          type: 'custom',
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const id = response.data?.storefront?.id;
    console.log('✅ Storefront registered with ID:', id);
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('❌ Failed to register storefront:', error.response.status);
      console.error('🔍', error.response.data?.errors || error.response.data);
    } else if (error.request) {
      // No response from server
      console.error('❌ No response from Shopify Admin API');
    } else {
      // Unexpected error
      console.error('❌ Error:', error.message);
    }
  }
}
=============================================================== */

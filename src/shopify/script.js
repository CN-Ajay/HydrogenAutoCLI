const os = require("os");
const path = require("path");
const { spawn, execSync } = require("child_process");
const pty = require("node-pty");

// Use local shopify CLI path
const shopifyCLIPath = path.resolve('./node_modules/.bin/shopify');

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

const themeDir = path.resolve("./hydrogen-storefront"); // Your Hydrogen project path

export function logoutExistingSession() {
    try {
        execSync(`"${shopifyCLIPath}" auth logout`, {
            stdio: 'pipe',
            shell: true
        });
        return true;
    } catch (error) {
        console.error('Shopify CLI error:', error.message);
        throw new Error('Failed to setup Shopify CLI');
    }
}
//logoutExistingSession();


export function prepareHydrogenTheme(themeDir) {
    execSync("npm install", { cwd: themeDir });
    execSync('npm run build', { cwd: themeDir });
}
//prepareHydrogenTheme(themeDir);

export function dummyGitCommit(themeDir) {
  execSync("git init", { cwd: themeDir });
  execSync('git config user.name "Test User"', { cwd: themeDir });
  execSync('git config user.email "test@user.user"', { cwd: themeDir });
  execSync('git add .', { cwd: themeDir });
  execSync('git commit -m "Auto-commit before deploy" || echo "No changes"', { cwd: themeDir });
}
//dummyGitCommit(themeDir);

export function hydrigenLink() {
  const ptyProcess = pty.spawn(shopifyCLIPath, ["hydrogen", "link"], {
    name: "xterm-color",
    cwd: themeDir,
    env: {
      ...process.env,
      PATH: `${path.dirname(shopifyCLIPath)}:${process.env.PATH}`
    },
    cols: 80,
    rows: 30,
  });

  ptyProcess.onData((data) => {
    //process.stdout.write(data); // Optional: see the CLI output

    // Match and capture the verification code
    const codeMatch = data.match(/User verification code:\s*([A-Z0-9-]+)/);
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
//hydrigenLink();

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
    
        if (data.includes("?  Select an environment to deploy to:")) {
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


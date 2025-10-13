# Alternative deployment workflow (if compiled version doesn't work)
# Replace the Archive step in your workflow with this:

- name: Alternative - Prepare for Node.js runtime deployment
  run: |
    cd apps/backend
    
    # Instead of compiling, prepare for runtime execution
    echo '#!/bin/bash' > startup.sh
    echo 'cd /home/site/wwwroot' >> startup.sh
    echo 'exec bun src/index.ts' >> startup.sh
    chmod +x startup.sh
    
    # Copy node_modules and other necessary files
    cp -r ../../node_modules ./
    
    # Verify the structure
    echo "Contents of backend directory:"
    ls -la
    echo "Contents of frontend/build directory:"
    ls -la frontend/build/
    
    # Create the zip file
    zip -r release.zip ./*
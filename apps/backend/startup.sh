#!/bin/bash
# Startup script for Azure App Service
cd /home/site/wwwroot
exec bun src/index.ts
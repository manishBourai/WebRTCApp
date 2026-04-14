import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   server: {
    host: true, // allow external access
    allowedHosts: [
      "ec2-100-26-135-157.compute-1.amazonaws.com"
    ]
  }
  
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Isso permite que o servidor seja acessado pelo IP da rede
    port: 5173,
    hmr: {
      host: '192.168.100.25', // O IP da sua máquina
    },
  },
})
import axios from "axios";

// Certifique-se de carregar as variáveis de ambiente
// No React, isso não é necessário porque o Vite ou Create React App já gerencia.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL // Use a variável de ambiente aqui
});

export default api;

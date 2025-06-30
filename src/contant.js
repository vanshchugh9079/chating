import axios from 'axios';
let url="http://192.168.29.73:3000/api/"; 
// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: url,  // Replace with your base URL
  headers: {
    'Content-Type': 'application/json',
  },
});
export {api}
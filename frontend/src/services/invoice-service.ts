import axios from 'axios';

const API_URL = 'http://localhost:3001';

export async function fetchInvoices() {
    const response = await axios.get(`${API_URL}/invoices`);
    return response.data;
}


import axios from 'axios';

const response = await axios.get('http://localhost:3001/auth/me', {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer some-token-here',
  },
});

console.log(response.data);

import axios from 'src/lib/axios';
import { ADMIN_COOKIE_NAME } from 'src/utils/constants';

export default async function handler(req, res) {
  // extract a particluar cookie from a string of cookies nextjs getServerSideProps?
  try {
    const response = await axios.post('/auth/login', req.body);

    if (response.data.success && response.status === 200) {
      res.setHeader(
        'Set-Cookie',
        `${ADMIN_COOKIE_NAME}=${response.data.data.auth_token}; Max-Age=900000; HttpOnly; Path=/`
      );

      res.status(response.status).json(response.data);
    } else throw response;
  } catch (error) {
    if (error.data) {
      res.status(401).json({ message: error.data.message });
    }
    if (!error.response) {
      res.status(503).json({ message: 'No response from Server' });
      return;
    }
    res.status(error.response.status).json(error.response.data);
  }
}

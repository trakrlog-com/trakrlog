import express, { Request, Response } from 'express';
import cors from 'cors';
import { User, isValidEmail } from '@trakrlog/common';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Example endpoint using shared types
app.post('/api/users', (req: Request, res: Response) => {
  const userData = req.body as User;
  
  if (!isValidEmail(userData.email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Here you would typically save the user to a database
  res.status(201).json(userData);
});

// add a simple get
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
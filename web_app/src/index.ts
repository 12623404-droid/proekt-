import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/init';
import routes from './routes';

const app = express();
const PORT = Number(process.env['PORT']) || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

initDatabase()
    .then(() => app.listen(PORT, () => console.log('[API] http://localhost:' + PORT + '/api')))
    .catch(err => { console.log('Database error:', err.message); process.exit(1); });

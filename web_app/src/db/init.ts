import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export async function initDatabase(): Promise<void> {
    const host = process.env['DB_HOST'] || 'localhost';
    const port = Number(process.env['DB_PORT']) || 3306;
    const user = process.env['DB_USER'] || 'root';
    const password = process.env['DB_PASSWORD'] || '';
    const db = process.env['DB_NAME'] || 'web_app';

    const conn = await mysql.createConnection({ host, port, user, password });

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${db}\``);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(20) NOT NULL PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL,
            role ENUM('admin','librarian','teacher','student') NOT NULL DEFAULT 'student',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS books (
            id VARCHAR(20) NOT NULL PRIMARY KEY, title VARCHAR(255) NOT NULL,
            author VARCHAR(255) NOT NULL, year SMALLINT NULL,
            copies TINYINT UNSIGNED NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS students (
            id VARCHAR(20) NOT NULL PRIMARY KEY, name VARCHAR(255) NOT NULL,
            grade VARCHAR(20) NOT NULL DEFAULT '-', user_id VARCHAR(20) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try {
        await conn.query(`ALTER TABLE students ADD COLUMN user_id VARCHAR(20) NULL`);
        await conn.query(`ALTER TABLE students ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
    } catch {}

    await conn.query(`
        CREATE TABLE IF NOT EXISTS loans (
            id VARCHAR(20) NOT NULL PRIMARY KEY, book_id VARCHAR(20) NOT NULL,
            student_id VARCHAR(20) NOT NULL, borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            due_at DATETIME NOT NULL, returned_at DATETIME NULL,
            CONSTRAINT fk_loan_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            CONSTRAINT fk_loan_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [existing] = await conn.query<any[]>('SELECT COUNT(*) AS cnt FROM users');
    if (existing[0].cnt === 0) {
        const hash = await bcrypt.hash('123456', 10);
        const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

        const adminId = uid(), libId = uid(), teachId = uid(), stuId = uid();
        await conn.query('INSERT INTO users (id,username,password,full_name,role) VALUES ?', [[
            [adminId, 'admin',     hash, 'System Admin',   'admin'],
            [libId,   'librarian', hash, 'Maria Ivanova',  'librarian'],
            [teachId, 'teacher',   hash, 'Petar Georgiev', 'teacher'],
            [stuId,   'student',   hash, 'Ana Petrova',    'student'],
        ]]);

        const [bookCount] = await conn.query<any[]>('SELECT COUNT(*) AS cnt FROM books');
        if (bookCount[0].cnt === 0) {
            const b = [uid(), uid(), uid(), uid()];
            await conn.query('INSERT INTO books (id,title,author,year,copies) VALUES ?', [[
                [b[0], 'To Kill a Mockingbird', 'Harper Lee',     1960, 3],
                [b[1], '1984',                  'George Orwell',  1949, 2],
                [b[2], 'The Hobbit',            'J.R.R. Tolkien', 1937, 4],
                [b[3], 'Pride and Prejudice',   'Jane Austen',    1813, 2],
            ]]);

            const s = [uid(), uid(), uid()];
            await conn.query('INSERT INTO students (id,name,grade,user_id) VALUES ?', [[
                [s[0], 'Ana Petrova',     '10A', stuId],
                [s[1], 'Marko Ivanov',    '11B', null],
                [s[2], 'Elena Stojanova', '9C',  null],
            ]]);
        }

        console.log('[DB] Accounts: admin/librarian/teacher/student (password: 123456)');
    }

    await conn.end();
}

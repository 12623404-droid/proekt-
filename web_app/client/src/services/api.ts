const API = '/api';

function getToken() {
    return localStorage.getItem('token');
}

async function request(path: string, method = 'GET', body?: any) {
    const headers: any = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(API + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Error');
    return json.data;
}

export const api = {
    books: {
        list: () => request('/books'),
        get: (id: string) => request('/books/' + id),
        create: (data: any) => request('/books', 'POST', data),
        update: (id: string, data: any) => request('/books/' + id, 'PUT', data),
        remove: (id: string) => request('/books/' + id, 'DELETE'),
    },
    students: {
        list: () => request('/students'),
        create: (data: any) => request('/students', 'POST', data),
        update: (id: string, data: any) => request('/students/' + id, 'PUT', data),
        remove: (id: string) => request('/students/' + id, 'DELETE'),
    },
    loans: {
        list: () => request('/loans'),
        create: (data: any) => request('/loans', 'POST', data),
        returnIt: (id: string) => request('/loans/' + id + '/return', 'PATCH'),
        remove: (id: string) => request('/loans/' + id, 'DELETE'),
    },
    users: {
        list: () => request('/users'),
        create: (data: any) => request('/users', 'POST', data),
        update: (id: string, data: any) => request('/users/' + id, 'PUT', data),
        remove: (id: string) => request('/users/' + id, 'DELETE'),
    },
};

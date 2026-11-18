import { Account, Client, TablesDB } from 'appwrite';
export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6afc84a5003505116823');
export const account = new Account(client);
export const tables = new TablesDB(client);
export const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6afc8986001d9a9e17d9';
export const tableId = import.meta.env.VITE_APPWRITE_LISTS_TABLE_ID || 'movie_lists';

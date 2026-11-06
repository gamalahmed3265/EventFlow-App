import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg'; // Assuming you're using PostgreSQL, adjust the import based on your database
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'; // Adjust the import based on your database
import * as schema from './schema'; // Adjust the import based on your schema location
@Injectable()
export class DatabaseService  implements OnModuleDestroy {
    private pool: Pool; 
    public db:NodePgDatabase<typeof schema>;

    constructor() {
        const connectionString = process.env.DATABASE_URL;
        this.pool = new Pool({
            connectionString
        })

        this.db=drizzle(this.pool, { schema });

        console.log('Database connection established successfully');
        }
  async onModuleDestroy() {
        await this.pool.end();
        console.log('Database connection closed successfully');
    
}
get schema() {
    return schema;
  }
}

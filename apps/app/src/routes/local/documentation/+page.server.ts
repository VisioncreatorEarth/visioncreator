import { error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    try {
        const docsDir = path.join(process.cwd(), 'src/routes/local/documentation');
        const files = await fs.readdir(docsDir);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        const docs: Record<string, string> = {};

        // Load all markdown files
        for (const file of markdownFiles) {
            const content = await fs.readFile(path.join(docsDir, file), 'utf-8');
            // Use filename without extension as key
            const key = file;
            docs[key] = content;
        }

        if (Object.keys(docs).length === 0) {
            throw new Error('No documentation files found');
        }

        return {
            docs
        };
    } catch (e) {
        console.error('Error loading documentation:', e);
        throw error(404, 'Documentation not found');
    }
} 
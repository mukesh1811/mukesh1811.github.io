import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const owner = process.env.GITHUB_REPOSITORY_OWNER || 'mukesh1811';
const pagesBaseUrl = (process.env.PAGES_BASE_URL || `https://${owner}.github.io`).replace(/\/$/, '');
const outputPath = resolve(process.env.PROJECT_CATALOG_PATH || 'projects.json');
const profileRepository = `${owner}.github.io`;

const headers = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'portfolio-project-catalog'
};

if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function fetchRepositories() {
    const repositories = [];

    for (let page = 1; ; page += 1) {
        const url = `https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&page=${page}&sort=updated`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API request failed (${response.status}): ${await response.text()}`);
        }

        const pageRepositories = await response.json();
        repositories.push(...pageRepositories);

        if (pageRepositories.length < 100) {
            return repositories;
        }
    }
}

function titleFromRepository(name) {
    return name
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, character => character.toUpperCase());
}

function pageUrl(repository) {
    return repository.homepage?.trim() || `${pagesBaseUrl}/${encodeURIComponent(repository.name)}`;
}

const localProjects = [
    {
        title: 'Easy USDINR Converter',
        description: 'Convert USD amounts into INR with Indian number formatting.',
        url: '/converter/'
    }
];

const repositories = await fetchRepositories();
const discoveredProjects = repositories
    .filter(repository => (
        repository.has_pages &&
        !repository.archived &&
        !repository.fork &&
        repository.name !== profileRepository
    ))
    .map(repository => ({
        title: titleFromRepository(repository.name),
        description: repository.description || 'Explore this project.',
        url: pageUrl(repository),
        repository: repository.name
    }));

const catalog = [...localProjects, ...discoveredProjects];
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Wrote ${catalog.length} projects to ${outputPath}`);

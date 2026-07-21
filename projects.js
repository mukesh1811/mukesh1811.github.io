const projectsList = document.getElementById('projects-list');

function renderProject(project) {
    const link = document.createElement('a');
    link.className = 'project-link';
    link.href = project.url;

    if (/^https?:\/\//i.test(project.url) && !project.url.startsWith(window.location.origin)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    }

    const card = document.createElement('div');
    card.className = 'project-item';

    const title = document.createElement('h3');
    title.textContent = project.title;

    const description = document.createElement('p');
    description.textContent = project.description || 'Explore this project.';

    card.append(title, description);
    link.appendChild(card);
    return link;
}

async function loadProjects() {
    try {
        const response = await fetch('projects.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Catalog request failed: ${response.status}`);
        }

        const projects = await response.json();
        projectsList.replaceChildren(...projects.map(renderProject));
    } catch (error) {
        // Keep the static cards in index.html as a fallback if the catalog is unavailable.
        console.error('Unable to load project catalog:', error);
    }
}

loadProjects();

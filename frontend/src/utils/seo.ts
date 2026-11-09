

interface SeoMetadata {
    title: string;
    description: string;
}

export function setPageSEO({ title, description }: SeoMetadata): void {
    document.title = title;

    let descriptionTag = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]'
    );

    if (!descriptionTag) {
        descriptionTag = document.createElement('meta');
        descriptionTag.name = 'description';
        document.head.appendChild(descriptionTag);
    }

    descriptionTag.content = description;
}

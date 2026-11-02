/*Este archivo lo que hace es cambiar el título que aparece en la pestaña del navegador
y la descripción que aparece en los resultados de búsqueda de Google, para cada página del sitio web.
Además actualiza la descripción que los buscadores pueden utilizar en sus resultados.*/


interface SeoMetadata {
    title: string;
    description: string;
}

export function setPageSEO({ title, description }: SeoMetadata): void {
    //Actualizar el título de la página
    document.title = title;

  //Buscar la descripción SEO existente
    let descriptionTag = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]'
    );

  //Crearla si todavía no existe
    if (!descriptionTag) {
        descriptionTag = document.createElement('meta');
        descriptionTag.name = 'description';
        document.head.appendChild(descriptionTag);
    }

  //Actualizar su contenido
    descriptionTag.content = description;
}

import news2 from '../../assets/imgs/news2.png'
import news3 from '../../assets/imgs/news3.png'
import portadaTemporal from '../../assets/imgs/portadaTemporal.jpeg'
import type { BlogComment, BlogPost, CommunityPost } from '../../types/forum.ts'

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString()

export const communityPosts: CommunityPost[] = [
  {
    id: 'community-1',
    name: 'Carla Méndez',
    createdAt: hoursAgo(2),
    content: '¿El parque de los animales seguirá abierto este fin de semana?',
  },
  {
    id: 'community-2',
    name: 'Diego Soto',
    createdAt: hoursAgo(5),
    content: 'Gracias por las respuestas de ayer sobre el transporte.',
  },
  {
    id: 'community-3',
    name: 'Lucía Ferrari',
    createdAt: hoursAgo(27),
    content: 'Mi hija llega cada vez más contenta. Gracias al equipo.',
  },
  {
    id: 'community-4',
    name: 'Tomás Aguilar',
    createdAt: hoursAgo(50),
    content: '¿Habrá espacio para las preguntas de la próxima reunión?',
  },
]

export const blogPosts: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Regulación emocional en los primeros años',
    topic: 'Regulación emocional',
    authorName: 'Laura Jiménez',
    authorRole: 'Maestra de Psicología',
    createdAt: hoursAgo(8),
    content:
      'Observamos cómo los niños de 2 a 3 años responden ante un cambio de rutina. La mayoría necesita entre dos y cinco minutos para volver a la calma.\n\n' +
      'Trabajamos el nombre de la emoción antes que la regla. Si un niño puede decir que tiene miedo, el llanto suele bajar solo.\n\n' +
      'Anotamos durante ocho semanas cuántos episodios resolvimos con ayuda de un adulto. El resultado cambia mucho según la hora del día.\n\n' +
      'La guía completa está disponible en la sala de padres.',
    imageUrl: news3,
    imageAlt: 'Aula de regulación emocional',
    likeCount: 52,
  },
  {
    id: 'blog-2',
    title: 'El huerto como aula',
    topic: 'Huerto escolar',
    authorName: 'Ana Lucía Vargas',
    authorRole: 'Coordinadora del huerto',
    createdAt: hoursAgo(30),
    content:
      'El huerto sirve como aula porque cada semilla es una tarea que no se puede hacer de otra forma. El niño mide, riega y espera.\n\n' +
      'Esa espera es lo más valioso. Aprender a esperar algo que uno sembró cambia la relación con el tiempo.\n\n' +
      'Usamos canteros bajos para que todos lleguen sin pisar los otros. Cada familia trae una planta de su casa.\n\n' +
      'Los resultados de la temporada pasada están en el cartel de la entrada.',
    imageUrl: news2,
    imageAlt: 'Actividad del huerto escolar',
    likeCount: 37,
  },
  {
    id: 'blog-3',
    title: 'Movimiento y descanso en la tarde',
    topic: 'Movimiento',
    authorName: 'Sofía Ríos',
    authorRole: 'Profesora de Educación Física',
    createdAt: hoursAgo(72),
    content:
      'La actividad física diaria reduce la agitación de la tarde. Lo medimos con el registro de sueño que traen las familias.\n\n' +
      'Preferimos juegos que puedan todos: correr, saltar, arrastrar. Nada que deje a un niño mirando.\n\n' +
      'Cuando llueve, el espacio interior se reparte en tres circuitos cortos con pausas para el agua.\n\n' +
      'La rutina completa está escrita en la pizarra de la sala.',
    likeCount: 41,
  },
]

export const blogCommentsByPost: Record<string, BlogComment[]> = {
  'blog-1': [
    {
      id: 'comment-1-1',
      name: 'Carla Méndez',
      createdAt: hoursAgo(6),
      content: 'La pausa de la mañana nos sirvió mucho.',
    },
    {
      id: 'comment-1-2',
      name: 'Diego Soto',
      createdAt: hoursAgo(4),
      content: 'Queda clarísimo, gracias.',
    },
  ],
  'blog-2': [
    {
      id: 'comment-2-1',
      name: 'Lucía Ferrari',
      createdAt: hoursAgo(28),
      content: 'Mi hijo pregunta todos los días por sus plantines.',
    },
    {
      id: 'comment-2-2',
      name: 'Ana Lucía Vargas',
      createdAt: hoursAgo(27),
      content: 'Esa espera es la parte más linda del taller.',
    },
  ],
  'blog-3': [
    {
      id: 'comment-3-1',
      name: 'Tomás Aguilar',
      createdAt: hoursAgo(70),
      content: 'El registro de sueño lo llenamos todas las noches.',
    },
  ],
}

export const popularTopics = [
  { id: 'topic-1', label: 'Huerto escolar' },
  { id: 'topic-2', label: 'Transporte' },
  { id: 'topic-3', label: 'Alimentación' },
  { id: 'topic-4', label: 'Horarios' },
  { id: 'topic-5', label: 'Regulación emocional' },
  { id: 'topic-6', label: 'Talleres' },
]

export const featuredBanner = {
  imageUrl: portadaTemporal,
  alt: 'My Green Farm',
}

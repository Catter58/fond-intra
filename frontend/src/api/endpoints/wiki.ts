import api from '../client';

// Types
export interface WikiTag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export interface WikiAttachment {
  id: number;
  file: string;
  filename: string;
  size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
}

export interface WikiPageVersion {
  id: number;
  version_number: number;
  title: string;
  content: any;
  change_summary: string;
  author: number;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
}

export interface WikiPageListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  space: number;
  parent: number | null;
  order: number;
  depth: number;
  is_published: boolean;
  is_archived: boolean;
  view_count: number;
  author: number;
  author_name: string;
  tags: WikiTag[];
  children_count: number;
  created_at: string;
  updated_at: string;
}

export interface WikiPageDetail extends WikiPageListItem {
  content: any;
  space_name: string;
  space_slug: string;
  author_avatar: string | null;
  attachments: WikiAttachment[];
  breadcrumbs: { id: number; title: string; slug: string }[];
  children: WikiPageListItem[];
  versions_count: number;
}

export interface WikiPageTree {
  id: number;
  title: string;
  slug: string;
  order: number;
  depth: number;
  is_published: boolean;
  children: WikiPageTree[];
}

export interface WikiSpaceListItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_public: boolean;
  owner: number;
  owner_name: string;
  department: number | null;
  department_name: string | null;
  pages_count: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface WikiSpaceDetail extends WikiSpaceListItem {
  allowed_departments: number[];
  allowed_roles: number[];
  root_pages: WikiPageListItem[];
}

// Space API
export const wikiSpacesApi = {
  getAll: async (params?: { search?: string }) => {
    const response = await api.get<WikiSpaceListItem[]>('/wiki/spaces/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<WikiSpaceDetail>(`/wiki/spaces/${id}/`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    icon?: string;
    is_public?: boolean;
    department?: number;
    order?: number;
    allowed_department_ids?: number[];
    allowed_role_ids?: number[];
  }) => {
    const response = await api.post<WikiSpaceDetail>('/wiki/spaces/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{
    name: string;
    description: string;
    icon: string;
    is_public: boolean;
    department: number;
    order: number;
    allowed_department_ids: number[];
    allowed_role_ids: number[];
  }>) => {
    const response = await api.patch<WikiSpaceDetail>(`/wiki/spaces/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/wiki/spaces/${id}/`);
  },

  getTree: async (id: number) => {
    const response = await api.get<WikiPageTree[]>(`/wiki/spaces/${id}/tree/`);
    return response.data;
  },

  getPages: async (id: number, params?: { search?: string; tag?: string }) => {
    const response = await api.get<WikiPageListItem[]>(`/wiki/spaces/${id}/pages/`, { params });
    return response.data;
  },
};

// Page API
export const wikiPagesApi = {
  getAll: async (params?: {
    space?: number;
    space_slug?: string;
    tag?: string;
    archived?: boolean;
    search?: string;
  }) => {
    const response = await api.get<WikiPageListItem[]>('/wiki/pages/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<WikiPageDetail>(`/wiki/pages/${id}/`);
    return response.data;
  },

  getBySlug: async (spaceSlug: string, pageSlug: string) => {
    const response = await api.get<WikiPageDetail>('/wiki/pages/by_slug/', {
      params: { space: spaceSlug, page: pageSlug }
    });
    return response.data;
  },

  create: async (data: {
    title: string;
    content?: any;
    excerpt?: string;
    space: number;
    parent?: number;
    order?: number;
    is_published?: boolean;
    tag_ids?: number[];
  }) => {
    const response = await api.post<WikiPageDetail>('/wiki/pages/', data);
    return response.data;
  },

  update: async (id: number, data: {
    title?: string;
    content?: any;
    excerpt?: string;
    parent?: number;
    order?: number;
    is_published?: boolean;
    is_archived?: boolean;
    tag_ids?: number[];
    change_summary?: string;
  }) => {
    const response = await api.patch<WikiPageDetail>(`/wiki/pages/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/wiki/pages/${id}/`);
  },

  getVersions: async (id: number) => {
    const response = await api.get<WikiPageVersion[]>(`/wiki/pages/${id}/versions/`);
    return response.data;
  },

  restoreVersion: async (id: number, versionNumber: number) => {
    const response = await api.post<WikiPageDetail>(`/wiki/pages/${id}/restore_version/`, {
      version_number: versionNumber
    });
    return response.data;
  },

  move: async (id: number, data: {
    parent_id?: number | null;
    space_id?: number;
    order?: number;
  }) => {
    const response = await api.post<WikiPageDetail>(`/wiki/pages/${id}/move/`, data);
    return response.data;
  },

  uploadAttachment: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<WikiAttachment>(`/wiki/pages/${id}/upload_attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<WikiPageListItem[]>('/wiki/pages/search/', {
      params: { q: query }
    });
    return response.data;
  },

  getRecent: async () => {
    const response = await api.get<WikiPageListItem[]>('/wiki/pages/recent/');
    return response.data;
  },

  getPopular: async () => {
    const response = await api.get<WikiPageListItem[]>('/wiki/pages/popular/');
    return response.data;
  },
};

// Tags API
export const wikiTagsApi = {
  getAll: async (params?: { search?: string }) => {
    const response = await api.get<WikiTag[]>('/wiki/tags/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<WikiTag>(`/wiki/tags/${id}/`);
    return response.data;
  },

  create: async (data: { name: string; color?: string }) => {
    const response = await api.post<WikiTag>('/wiki/tags/', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; color?: string }) => {
    const response = await api.patch<WikiTag>(`/wiki/tags/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/wiki/tags/${id}/`);
  },

  getPopular: async () => {
    const response = await api.get<WikiTag[]>('/wiki/tags/popular/');
    return response.data;
  },
};

// Attachments API
export const wikiAttachmentsApi = {
  getAll: async (params?: { page?: number }) => {
    const response = await api.get<WikiAttachment[]>('/wiki/attachments/', { params });
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/wiki/attachments/${id}/`);
  },
};

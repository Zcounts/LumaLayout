export function createDesktopProjectStorage() {
  return {
    runtime: 'desktop',
    supportsPersistentProjects: false,

    async createProject() { return { success: false } },
    async saveProject() { return { success: false } },
    async loadProject() { return { success: false } },
    async listProjects() { return { success: true, projects: [] } },
    async deleteProject() { return { success: false } },
    async getLastOpenedProjectId() { return null },
    async setLastOpenedProjectId() {},
  }
}

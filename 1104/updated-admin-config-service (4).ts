import axiosInstance from "../configs/axiosConfig";
import BASE_URL from "../configs/apiConfig";
import {
  Project,
  Team,
  OrganizationConfig,
  OrganizationConfigPayload,
  TestItData,
  SonarData
} from "./types";

class AdminConfigService {
  /**
   * Fetches all teams from the API
   * @returns Promise with the teams data
   */
  static async fetchTeams(): Promise<Team[]> {
    const response = await axiosInstance.get<Team[]>(`${BASE_URL}/teams`);
    return response.data;
  }

  /**
   * Fetches all projects from the API
   * @returns Promise with the projects data
   */
  static async fetchProjects(): Promise<Project[]> {
    const response = await axiosInstance.get<Project[]>(`${BASE_URL}/projects`);
    return response.data;
  }

  /**
   * Fetches organization configuration from the API
   * @returns Promise with the organization configuration data
   */
  static async fetchOrganizationConfig(): Promise<OrganizationConfig[]> {
    const response = await axiosInstance.get<OrganizationConfig[]>(`${BASE_URL}/organisation/configuration`);
    console.log("RESPONSE FROM ADMIN CONFIG SERVICE", response);
    return response.data;
  }

  /**
   * Fetches organization configuration for a specific organization
   * @param org Organization name
   * @returns Promise with the organization configuration data
   */
  static async fetchOrganizationConfigByOrg(org: string): Promise<OrganizationConfig> {
    const response = await axiosInstance.get<OrganizationConfig>(`${BASE_URL}/organisation/configuration/org/${org}`);
    return response.data;
  }

  /**
   * Deletes an organization configuration
   * @param orgId Organization ID
   * @returns Promise with the response
   */
  static async deleteOrganizationConfig(orgId: string): Promise<void> {
    await axiosInstance.delete(`${BASE_URL}/organisation/configuration/${orgId}`);
  }

  /**
   * Creates a new organization configuration
   * @param payload Organization configuration payload
   * @returns Promise with the response
   */
  static async createOrganizationConfig(payload: OrganizationConfigPayload): Promise<void> {
    await axiosInstance.post(`${BASE_URL}/organisation/configuration`, payload);
  }

  /**
   * Updates an existing organization configuration
   * @param orgId Organization ID
   * @param payload Organization configuration payload
   * @returns Promise with the response
   */
  static async updateOrganizationConfig(orgId: string, payload: OrganizationConfigPayload): Promise<void> {
    await axiosInstance.put(`${BASE_URL}/organisation/configuration/${orgId}`, payload);
  }

  /**
   * Fetches TestIt data from the API
   * @returns Promise with the TestIt data
   */
  static async fetchTestItData(): Promise<TestItData> {
    const response = await axiosInstance.get<TestItData>(`${BASE_URL}/data/testit`);
    return response.data;
  }

  /**
   * Fetches Sonar data from the API
   * @returns Promise with the Sonar data
   */
  static async fetchSonarData(): Promise<SonarData> {
    const response = await axiosInstance.get<SonarData>(`${BASE_URL}/data/sonar`);
    return response.data;
  }

  /**
   * Fetches both TestIt and Sonar data in parallel
   * @returns Promise with both TestIt and Sonar data
   */
  static async fetchTestItAndSonarData(): Promise<[TestItData, SonarData]> {
    const [testItResponse, sonarResponse] = await Promise.all([
      this.fetchTestItData(),
      this.fetchSonarData()
    ]);
    return [testItResponse, sonarResponse];
  }

  /**
   * Gets TestIt statistics based on the provided paths
   * @param paths Array of paths in format "projectId:suiteId:childSuiteId"
   * @returns Promise with the statistics
   */
  static async getTestItStatsByPaths(paths: string[]): Promise<Record<string, any>> {
    const response = await axiosInstance.post(`${BASE_URL}/data/testit/stats`, { paths });
    return response.data;
  }
}

export default AdminConfigService;
// Updated types.ts for TestItTreeView
export interface Project {
  id: string;
  jiraId: string;
  key: string;
  name: string;
}

export interface TeamMember {
  name: string;
  jobTitle: string;
  location: string;
}

export interface Team {
  id: string;
  jiraKey: string;
  teamName: string;
  members: TeamMember[];
}

// Interface that exactly matches your MongoDB structure
export interface Suite {
  Suite_Id: string;
  'Suite Name': string;
  Suites?: Suite[];
  Total_Test_Cases?: number;
  Passing_Test_Cases?: number;
  Failing_Test_Cases?: number;
  Skipped_Test_Cases?: number;
  Automatable_Test_Cases?: number;
  Automated_Test_Cases?: number;
}

export interface TestItProject {
  id: string;
  'Project Name': string;
  'Project Prefix': string;
  'Project ID': string;
  'Test Suites': Suite[];
}

export type TestItData = TestItProject[];

export interface SonarProject {
  project: string;
}

export interface SonarDomain {
  id: string;
  sonarDomain: string;
  projects: SonarProject[];
}

export type SonarData = SonarDomain[];

// Updated payload interfaces for organization configuration
export interface SonarProjectConfig {
  sonarDomain: string;
  sonarProjects: string[];
}

// New team config using paths
export interface TeamConfig {
  testItPaths: string[]; // Using format "projectId:suiteId:childSuiteId"
  sonarQubeProjects: SonarProjectConfig[];
}

export interface OrganizationConfigPayload {
  organization: string;
  projects: Record<string, {
    projectName: string;
    projectFullName: string | null;
    teams: Array<{
      name: string;
      members: string[];
      testItPaths: string[]; // Changed from testItProjects
      sonarQubeProjects: Array<Record<string, string[]>>;
    }>;
  }>;
}

export interface OrganizationConfig {
  id: string;
  organization: string;
  projects: Record<string, ProjectData>;
}

export interface ProjectData {
  id: string | null;
  teams: TeamData[];
  projectName: string;
  projectFullName: string | null;
}

export interface TeamData {
  id: string;
  name: string;
  members: string[];
  testItPaths: string[]; // Changed from testItProjects
  sonarQubeProjects: Array<Record<string, string[]>>;
  scrumBoardId: string;
  scrumBoardName: string;
  storyPointsPerMemberPerSprint: number;
}
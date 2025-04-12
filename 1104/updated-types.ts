// Updated types.ts with proper nesting structure
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

// Updated structure for TestIt Suite with child suites
export interface Suite {
  Suite_Id: string;
  'Suite Name': string;
  Child_Suites?: Suite[];
  Total_Test_Cases?: number;
  Passing_Test_Cases?: number;
  Failing_Test_Cases?: number;
  Skipped_Test_Cases?: number;
  Automatable_Test_Cases?: number;
  Automated_Test_Cases?: number;
  // Add camelCase aliases for frontend ease of use
  totalTestCases?: number;
  passingTestCases?: number;
  failingTestCases?: number;
  skippedTestCases?: number;
  automatableTestCases?: number;
  automatedTestCases?: number;
}

export interface TestSuiteWrapper {
  Suites: Suite[];
  Suite_Id?: string;  // Some wrappers might actually be a Suite themselves
  'Suite Name'?: string;
}

export interface TestItProject {
  id: string;
  'Project Name': string;
  'Project Prefix': string;
  'Project ID': string;
  'Test Suites': TestSuiteWrapper[];
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

// New interface for TestItTeamConfig - now using paths instead of suiteIds
export interface TeamConfig {
  testItPaths: string[]; // Using format "projectId:suiteId:childSuiteId:..."
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
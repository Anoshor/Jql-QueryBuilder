// ========== BASIC PROJECT TYPES ==========

// A basic project from your data
export interface Project {
  id: string;
  jiraId: string;
  key: string; // often the JIRA key, e.g. "ABC"
  name: string;
}

// A team member
export interface TeamMember {
  name: string;
  jobTitle: string;
  location: string;
}

// A team
export interface Team {
  id: string;
  jiraKey: string;
  teamName: string;
  members: TeamMember[];
}

// ========== TESTIT RELATED TYPES ==========

// Interface that reflects your MongoDB "Suite" structure
export interface Suite {
  Suite_Id: string;
  'Suite Name': string;
  Suites?: Suite[];
  Child_Suites?: Suite[];
  Total_Test_Cases?: number;
  Passing_Test_Cases?: number;
  Failing_Test_Cases?: number;
  Skipped_Test_Cases?: number;
  Automatable_Test_Cases?: number;
  Automated_Test_Cases?: number;
}

// Represents a top-level project in TestIt
export interface TestItProject {
  id: string;
  'Project Name': string;
  'Project Prefix': string;
  'Project ID': string;
  'Test Suites': Suite[];
}

// The array shape of the entire TestIt data
export type TestItData = TestItProject[];

// ========== SONAR RELATED TYPES ==========

// Single Sonar project item
export interface SonarProject {
  project: string;
}

// A Sonar domain that has an ID, domain name, and multiple projects
export interface SonarDomain {
  id: string;
  sonarDomain: string;
  projects: SonarProject[];
}

// The array shape of the entire Sonar data
export type SonarData = SonarDomain[];

// ========== TEAM CONFIGURATION ==========

// Sonar config for a team: domain plus selected project IDs
export interface SonarProjectConfig {
  sonarDomain: string;
  sonarProjects: string[];
}

// The config for a single team, specifying which TestIt paths + Sonar projects they have
export interface TeamConfig {
  testItPaths: string[]; // Using format "projectId:suiteId:childSuiteId..."
  sonarQubeProjects: SonarProjectConfig[];
}

// ========== ORGANIZATION CONFIG PAYLOADS ==========

export interface OrganizationConfigPayload {
  organization: string;
  projects: Record<
    string,
    {
      projectName: string;
      projectFullName: string | null;
      teams: Array<{
        name: string;
        members: string[];
        testItPaths: string[]; // changed from testItProjects
        sonarQubeProjects: Array<Record<string, string[]>>;
      }>;
    }
  >;
}

export interface OrganizationConfig {
  id: string;
  organization: string;
  projects: Record<string, ProjectData>;
}

// A project within the OrganizationConfig
export interface ProjectData {
  id: string | null;
  teams: TeamData[];
  projectName: string;
  projectFullName: string | null;
}

// Each team in the OrganizationConfig
export interface TeamData {
  id: string;
  name: string;
  members: string[];
  testItPaths: string[]; // changed from testItProjects
  sonarQubeProjects: Array<Record<string, string[]>>;
  scrumBoardId: string;
  scrumBoardName: string;
  storyPointsPerMemberPerSprint: number;
}
